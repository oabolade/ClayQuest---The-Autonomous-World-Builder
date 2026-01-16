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
          max_tokens: 1024,
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
                  text: 'Please provide a detailed description of what you see in this image. Describe the objects, people, setting, colors, and any notable details.',
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
      res.json({ description: textContent.text });
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
