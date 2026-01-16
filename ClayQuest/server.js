import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Analyze image endpoint
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Try different models in order of preference
    const models = [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307',
    ];

    let response;
    let lastError;

    for (const model of models) {
      try {
        response = await anthropic.messages.create({
          model: model,
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: imageBase64,
                  },
                },
                {
                  type: 'text',
                  text: `You are analyzing an air-dry clay object made by a child, ideally on a clean background. Analyze this clay creation and provide character lore information.

CRITICAL: You must respond with ONLY a valid JSON object. Do not include any markdown code blocks, explanations, or additional text. Start your response with { and end with }.

Return a JSON object with this exact structure:
{
  "name": "A creative character name based on the object",
  "color": "Primary colors observed (e.g., 'bright red and blue', 'pastel pink')",
  "shape": "Description of the shape and form (e.g., 'round and chubby', 'tall and slender', 'irregular blob')",
  "characterTraits": ["trait1", "trait2", "trait3"],
  "tone": "The voice/tone this character should have (e.g., 'playful and energetic', 'gentle and shy', 'bold and adventurous')"
}

Focus on the unique characteristics that make this clay creation special. The character traits should reflect the personality that emerges from the object's appearance.

Remember: Return ONLY the JSON object, nothing else.`,
                },
              ],
            },
          ],
        });
        break; // Success, exit loop
      } catch (err) {
        lastError = err;
        // If it's a 404 (model not found), try next model
        if (err.status === 404 || err.message?.includes('not_found')) {
          continue;
        }
        // For other errors, throw immediately
        throw err;
      }
    }

    if (!response) {
      throw lastError || new Error('All models failed');
    }

    const textContent = response.content.find(
      (item) => item.type === 'text'
    );

    if (textContent && textContent.type === 'text') {
      console.log('Claude response text (first 500 chars):', textContent.text.substring(0, 500));
      
      // Function to extract JSON from text, handling nested objects
      const extractJSON = (text) => {
        let jsonText = text.trim();
        
        // Remove markdown code blocks if present
        jsonText = jsonText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        
        // Find the first { and try to match it with the corresponding }
        let startIndex = jsonText.indexOf('{');
        if (startIndex === -1) {
          return null;
        }
        
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = startIndex; i < jsonText.length; i++) {
          const char = jsonText[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              braceCount++;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                // Found matching closing brace
                const jsonCandidate = jsonText.substring(startIndex, i + 1);
                try {
                  return JSON.parse(jsonCandidate);
                } catch (e) {
                  // Not valid JSON, continue searching
                }
              }
            }
          }
        }
        
        return null;
      };
      
      try {
        // Try direct parsing first
        let jsonText = textContent.text.trim();
        jsonText = jsonText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        
        try {
          const characterData = JSON.parse(jsonText);
          console.log('Successfully parsed character data (direct):', characterData);
          res.json({ characterData });
          return;
        } catch (directError) {
          console.log('Direct parse failed, trying extraction method...');
        }
        
        // Try extraction method
        const extracted = extractJSON(textContent.text);
        if (extracted) {
          console.log('Successfully extracted and parsed character data:', extracted);
          res.json({ characterData: extracted });
          return;
        }
        
        // Try regex as fallback
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const characterData = JSON.parse(jsonMatch[0]);
          console.log('Successfully parsed character data (regex):', characterData);
          res.json({ characterData });
          return;
        }
        
        throw new Error('Could not find valid JSON in response');
      } catch (parseError) {
        // If parsing fails, return the raw text (fallback)
        console.error('Failed to parse JSON response:', parseError.message);
        console.error('Raw response text (first 1000 chars):', textContent.text.substring(0, 1000));
        console.error('Full response text length:', textContent.text.length);
        console.error('Full response:', textContent.text);
        
        res.json({ 
          characterData: null,
          rawResponse: textContent.text,
          description: textContent.text // Also include as description for backward compatibility
        });
      }
    } else {
      res.status(500).json({ error: 'No description received from API' });
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to analyze image',
      details: error.status ? `Status: ${error.status}` : undefined
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
