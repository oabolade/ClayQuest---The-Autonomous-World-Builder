import { useState, useRef, useEffect, useCallback } from 'react';
import './CameraCapture.css';
import CharacterLoreDisplay from './CharacterLoreDisplay';
import type { CharacterData } from '../types/character';

interface CameraCaptureProps {
  apiUrl?: string;
}

function CameraCapture({ apiUrl }: CameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get API URL from environment or prop
  const getApiUrl = () => {
    return apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:3001';
  };

  // Start camera stream
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      
      streamRef.current = stream;
      setIsStreaming(true);
    } catch (err) {
      setError('Failed to access camera. Please ensure you have granted camera permissions.');
      console.error('Error accessing camera:', err);
      setIsStreaming(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageDataUrl);
      }
    }
  }, []);

  // Convert base64 image to blob
  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Analyze image via backend API
  const analyzeImage = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    setError(null);
    setCharacterData(null);
    setRawResponse(null);

    try {
      // Convert base64 to blob
      const blob = dataURLtoBlob(capturedImage);
      
      // Convert blob to base64 for API
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove data URL prefix
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Image,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('API Response:', data); // Debug log
      
      // Try multiple ways to extract character data
      let extractedData = null;
      
      // Method 1: Direct characterData field
      if (data.characterData) {
        extractedData = data.characterData;
      }
      // Method 2: Try rawResponse field
      else if (data.rawResponse) {
        try {
          let jsonText = data.rawResponse.trim();
          jsonText = jsonText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
          extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(jsonText);
        } catch (err) {
          console.warn('Failed to parse rawResponse:', err);
        }
      }
      // Method 3: Try description field (legacy or fallback)
      else if (data.description) {
        console.log('Attempting to parse description field:', data.description.substring(0, 200));
        try {
          let jsonText = data.description.trim();
          // Remove markdown code blocks if present
          jsonText = jsonText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          
          // Try to find JSON object in the text (handles cases with extra text)
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            console.log('Found JSON match, attempting to parse...');
            extractedData = JSON.parse(jsonMatch[0]);
            console.log('Successfully parsed character data:', extractedData);
          } else {
            // Try parsing the whole text as JSON
            console.log('No JSON match found, trying to parse entire text as JSON...');
            extractedData = JSON.parse(jsonText);
            console.log('Successfully parsed character data:', extractedData);
          }
        } catch (err) {
          console.error('Failed to parse description as JSON:', err);
          console.error('Description content:', data.description);
          // Don't set error here, let it fall through to show raw response
          setRawResponse(data.description);
        }
      }
      // Method 4: Check if the response itself is the character data
      else if (data.name && data.color && data.shape && data.characterTraits && data.tone) {
        extractedData = data;
      }
      
      if (extractedData) {
        // Validate the extracted data has required fields
        if (extractedData.name && extractedData.color && extractedData.shape && 
            Array.isArray(extractedData.characterTraits) && extractedData.tone) {
          setCharacterData(extractedData);
          setError(null); // Clear any previous errors
        } else {
          console.error('Extracted data missing required fields:', extractedData);
          console.error('Missing fields:', {
            name: !!extractedData.name,
            color: !!extractedData.color,
            shape: !!extractedData.shape,
            characterTraits: Array.isArray(extractedData.characterTraits),
            tone: !!extractedData.tone
          });
          setError('Character data received but missing required fields. Check console for details.');
          // Still show raw response if available
          if (data.description) {
            setRawResponse(data.description);
          }
        }
      } else {
        // Log the full response for debugging
        console.error('Unexpected API response format:', data);
        console.error('Full response object:', JSON.stringify(data, null, 2));
        
        // If we have a description but couldn't parse it, show it as raw
        if (data.description && !rawResponse) {
          setRawResponse(data.description);
          setError('Could not parse character data from API response. Raw response displayed below. Check console for details.');
        } else {
          setError(`No character data received from API. Response keys: ${Object.keys(data).join(', ')}. Check console for full response.`);
        }
      }
    } catch (err: any) {
      setError(`Failed to analyze image: ${err.message || 'Unknown error'}`);
      console.error('Error analyzing image:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Space key for capturing photos
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only capture if camera is streaming and Space is pressed
      // Prevent default if Space is pressed to avoid scrolling
      if (event.code === 'Space' && isStreaming) {
        event.preventDefault();
        capturePhoto();
      }
    };

    if (isStreaming) {
      window.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isStreaming, capturePhoto]);

  // Handle video element when streaming starts
  useEffect(() => {
    if (isStreaming && streamRef.current) {
      // Use requestAnimationFrame to ensure video element is in DOM
      requestAnimationFrame(() => {
        if (videoRef.current && streamRef.current) {
          const video = videoRef.current;
          const stream = streamRef.current;
          
          video.srcObject = stream;
          video.play().catch(err => {
            console.error('Error playing video:', err);
            setError('Failed to play video stream.');
          });
        }
      });
    } else if (!isStreaming && videoRef.current) {
      // Clear video when stopping
      videoRef.current.srcObject = null;
    }
  }, [isStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="camera-capture">
      <div className="header-section">
        <h2>Camera Capture & Image Recognition</h2>
        {isStreaming && (
          <div className="camera-status-indicator">
            <span className="status-dot"></span>
            <span className="status-text">Camera Active</span>
            <span className="hotkey-hint">Press Space to capture</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="camera-controls">
        {!isStreaming ? (
          <button onClick={startCamera} className="btn btn-primary">
            Open Camera
          </button>
        ) : (
          <>
            <button onClick={stopCamera} className="btn btn-secondary">
              Stop Camera
            </button>
            <button onClick={capturePhoto} className="btn btn-primary capture-btn">
              <span>Capture Photo</span>
              <span className="hotkey-badge">Space</span>
            </button>
          </>
        )}
      </div>

      <div className="camera-preview">
        <div className="video-container">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="video-stream"
            style={{ display: isStreaming ? 'block' : 'none' }}
          />
          {!isStreaming && (
            <div className="video-placeholder">
              <p>Camera not active</p>
              <p className="placeholder-hint">Click "Open Camera" to start</p>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {capturedImage && (
          <div className="captured-image-container">
            <h3>Captured Image</h3>
            <img src={capturedImage} alt="Captured" className="captured-image" />
            <button 
              onClick={analyzeImage} 
              disabled={isAnalyzing}
              className="btn btn-primary analyze-btn"
            >
              {isAnalyzing ? 'Analyzing Character...' : 'Analyze Character Lore'}
            </button>
          </div>
        )}

        {characterData && (
          <CharacterLoreDisplay characterData={characterData} />
        )}
        {rawResponse && (
          <div className="description-container">
            <h3>Raw Response</h3>
            <div className="description-text">
              {rawResponse}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CameraCapture;
