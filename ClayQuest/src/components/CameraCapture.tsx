import { useState, useRef, useEffect, useCallback } from 'react';
import './CameraCapture.css';

interface CameraCaptureProps {
  apiUrl?: string;
}

function CameraCapture({ apiUrl }: CameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
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
    setDescription(null);

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
      
      if (data.description) {
        setDescription(data.description);
      } else {
        setError('No description received from API');
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
              {isAnalyzing ? 'Analyzing...' : 'Analyze with Claude'}
            </button>
          </div>
        )}

        {description && (
          <div className="description-container">
            <h3>Image Description</h3>
            <div className="description-text">
              {description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CameraCapture;
