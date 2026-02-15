/**
 * Vercel Serverless Function for OpenRouter API
 * This handles all AI requests from the frontend
 */

export default async function handler(req, res) {
  // Enable CORS for frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  
  try {
    const { prompt, systemPrompt, maxTokens, temperature } = req.body;
    
    // Validate required fields
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Get API key from environment variable
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }
    
    // Build messages array for OpenRouter
    const messages = [];
    
    // Add system message if provided
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    // Add user prompt
    messages.push({
      role: 'user',
      content: prompt
    });
    
    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.referer || 'https://your-app.vercel.app',
        'X-Title': 'DSE Economics App'
      },
      body: JSON.stringify({
        model: 'arcee-ai/arcee-trinity-large-preview:free',
        messages: messages,
        max_tokens: maxTokens || 2000,
        temperature: temperature !== undefined ? temperature : 0.7
      })
    });
    
    // Check if request was successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'OpenRouter API request failed'
      });
    }
    
    // Parse OpenRouter response
    const data = await response.json();
    
    // Extract the AI response text
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      return res.status(500).json({ error: 'No response from AI' });
    }
    
    // Return the AI response
    return res.status(200).json({ 
      response: aiResponse,
      usage: data.usage
    });
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}
