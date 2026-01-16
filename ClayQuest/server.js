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
                  text: `You are analyzing an air-dry clay object made by a child, ideally on a clean background. Analyze this clay creation and provide character lore information in JSON format.

Please analyze the image and return a JSON object with the following structure:
{
  "name": "A creative character name based on the object",
  "color": "Primary colors observed (e.g., 'bright red and blue', 'pastel pink')",
  "shape": "Description of the shape and form (e.g., 'round and chubby', 'tall and slender', 'irregular blob')",
  "characterTraits": ["trait1", "trait2", "trait3"],
  "tone": "The voice/tone this character should have (e.g., 'playful and energetic', 'gentle and shy', 'bold and adventurous')"
}

Focus on the unique characteristics that make this clay creation special. The character traits should reflect the personality that emerges from the object's appearance. Return ONLY valid JSON, no additional text.`,
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
      
      try {
        let jsonText = textContent.text.trim();
        
        // Remove markdown code blocks if present
        jsonText = jsonText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        
        // Try to find JSON object in the text (in case there's extra text)
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('Found JSON match, attempting to parse...');
          const characterData = JSON.parse(jsonMatch[0]);
          console.log('Successfully parsed character data:', characterData);
          res.json({ characterData });
        } else {
          // Try parsing the whole text
          console.log('No JSON match, trying to parse entire text as JSON...');
          const characterData = JSON.parse(jsonText);
          console.log('Successfully parsed character data:', characterData);
          res.json({ characterData });
        }
      } catch (parseError) {
        // If parsing fails, return the raw text (fallback)
        console.error('Failed to parse JSON response:', parseError.message);
        console.error('Raw response text (first 1000 chars):', textContent.text.substring(0, 1000));
        console.error('Full response text length:', textContent.text.length);
        
        // Try one more time with a more aggressive JSON extraction
        try {
          // Look for JSON that might be embedded in text
          const aggressiveMatch = textContent.text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
          if (aggressiveMatch) {
            console.log('Found JSON with aggressive matching, attempting to parse...');
            const characterData = JSON.parse(aggressiveMatch[0]);
            console.log('Successfully parsed with aggressive matching:', characterData);
            res.json({ characterData });
            return;
          }
        } catch (secondTryError) {
          console.error('Aggressive matching also failed:', secondTryError.message);
        }
        
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
