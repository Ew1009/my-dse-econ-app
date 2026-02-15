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
    // Log incoming request for debugging
    console.log('Received request body:', JSON.stringify(req.body).substring(0, 200));
    
    // Extract parameters from request body
    const { prompt, systemPrompt, maxTokens, temperature } = req.body;
    
    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      console.error('Invalid prompt:', typeof prompt, prompt);
      return res.status(400).json({ 
        error: 'Prompt is required and must be a non-empty string' 
      });
    }
    
    if (prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Prompt cannot be empty' 
      });
    }
    
    // Get API key from environment variable
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'API key not configured on server. Please set OPENROUTER_API_KEY environment variable.' 
      });
    }
    
    // Build messages array for OpenRouter
    const messages = [];
    
    // Add system message if provided
    if (systemPrompt && typeof systemPrompt === 'string' && systemPrompt.trim().length > 0) {
      messages.push({
        role: 'system',
        content: systemPrompt.trim()
      });
    }
    
    // Add user prompt
    messages.push({
      role: 'user',
      content: prompt.trim()
    });
    
    console.log('Calling OpenRouter with messages count:', messages.length);
    
    // Prepare request body for OpenRouter
    const openRouterBody = {
      model: 'openai/gpt-oss-20b:free',
      messages: messages,
      max_tokens: (typeof maxTokens === 'number' && maxTokens > 0) ? maxTokens : 2000,
      temperature: (typeof temperature === 'number') ? temperature : 0.7
    };
    
    // Get referer from request headers or use a default
    const referer = req.headers.referer || req.headers.origin || 'https://dse-econ-app.vercel.app';
    
    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': referer,
        'X-Title': 'DSE Economics Study App'
      },
      body: JSON.stringify(openRouterBody)
    });
    
    // Check if request was successful
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: errorText } };
      }
      
      console.error('OpenRouter API error:', response.status, errorData);
      
      return res.status(response.status).json({ 
        error: errorData.error?.message || errorData.message || `OpenRouter API request failed with status ${response.status}`,
        details: errorData
      });
    }
    
    // Parse OpenRouter response
    const data = await response.json();
    
    // Log response structure for debugging
    console.log('OpenRouter response structure:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasMessage: !!data.choices?.[0]?.message,
      hasContent: !!data.choices?.[0]?.message?.content
    });
    
    // Extract the AI response text
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      console.error('No content in OpenRouter response:', JSON.stringify(data).substring(0, 500));
      return res.status(500).json({ 
        error: 'No response from AI. The API returned an unexpected format.',
        rawResponse: data
      });
    }
    
    // Return the AI response
    return res.status(200).json({ 
      response: aiResponse,
      usage: data.usage || {}
    });
    
  } catch (error) {
    console.error('Server error:', error.message, error.stack);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      type: error.name
    });
  }
}
