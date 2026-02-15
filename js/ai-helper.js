/* ==================================================================
   AI Helper Module - Routes AI requests to OpenRouter via backend
   
   IMPORTANT: This file must load BEFORE any file that calls 
   window.AIHelper.callAI (e.g., app-ai.js)
   
   Backend (api/chat.js) expects this JSON body:
   {
     prompt: string,        ← REQUIRED (non-empty)
     systemPrompt: string,  ← optional
     maxTokens: number,     ← optional (default 2000)
     temperature: number    ← optional (default 0.7)
   }
   
   Backend returns:
   { response: string, usage: object }
   ================================================================== */

window.AIHelper = {
  
  /**
   * Call AI with a prompt
   * @param {string} prompt - The user prompt/question (REQUIRED, must be non-empty string)
   * @param {object} options - Options for the AI call
   * @param {string} options.systemPrompt - System prompt to set context
   * @param {number} options.maxTokens - Maximum tokens in response
   * @param {number} options.temperature - Creativity level (0-1)
   * @returns {Promise<string>} The AI response text
   */
  callAI: function(prompt, options) {
    options = options || {};
    
    // ---- Validate prompt before sending ----
    // Ensure prompt is a string
    if (typeof prompt !== 'string') {
      console.error('AIHelper.callAI: prompt is not a string, got:', typeof prompt, prompt);
      return Promise.reject(new Error('Prompt must be a non-empty string. Received type: ' + typeof prompt));
    }
    
    // Trim and check for empty
    prompt = prompt.trim();
    if (!prompt) {
      console.error('AIHelper.callAI: prompt is empty after trim');
      return Promise.reject(new Error('Prompt cannot be empty.'));
    }
    
    // ---- Build request body matching api/chat.js expectations ----
    // api/chat.js destructures: const { prompt, systemPrompt, maxTokens, temperature } = req.body;
    var requestBody = {
      prompt: prompt,
      systemPrompt: (typeof options.systemPrompt === 'string' && options.systemPrompt.trim()) ? options.systemPrompt.trim() : '',
      maxTokens: (typeof options.maxTokens === 'number' && options.maxTokens > 0) ? options.maxTokens : 2000,
      temperature: (typeof options.temperature === 'number') ? options.temperature : 0.7
    };
    
    // Debug log so we can verify what's being sent
    console.log('AIHelper.callAI → sending to /api/chat:', {
      promptLength: requestBody.prompt.length,
      promptPreview: requestBody.prompt.substring(0, 150) + (requestBody.prompt.length > 150 ? '...' : ''),
      systemPromptLength: requestBody.systemPrompt.length,
      hasSystemPrompt: requestBody.systemPrompt.length > 0,
      maxTokens: requestBody.maxTokens,
      temperature: requestBody.temperature
    });
    
    // ---- Make the fetch call to /api/chat ----
    return fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    .then(function(response) {
      console.log('AIHelper.callAI → received response with status:', response.status);
      
      // If response is not OK, try to extract error details
      if (!response.ok) {
        return response.text().then(function(text) {
          // Try to parse as JSON for structured error
          var errorMsg = 'API request failed with status ' + response.status;
          var errorDetails = null;
          
          try {
            var errorData = JSON.parse(text);
            if (errorData.error) {
              errorMsg = errorData.error;
              errorDetails = errorData.details;
            }
          } catch (e) {
            // If not JSON, include the raw text for debugging
            if (text) {
              errorMsg += ': ' + text.substring(0, 300);
            }
          }
          
          console.error('AIHelper.callAI → server error:', {
            status: response.status,
            message: errorMsg,
            details: errorDetails
          });
          
          throw new Error(errorMsg);
        });
      }
      
      return response.json();
    })
    .then(function(data) {
      // api/chat.js returns { response: string, usage: object }
      if (!data.response) {
        console.error('AIHelper.callAI → no response field in data:', data);
        throw new Error('No response from AI. Server returned unexpected format.');
      }
      
      console.log('AIHelper.callAI → success:', {
        responseLength: data.response.length,
        responsePreview: data.response.substring(0, 100) + (data.response.length > 100 ? '...' : ''),
        usage: data.usage
      });
      
      return data.response;
    })
    .catch(function(error) {
      console.error('AIHelper.callAI → error:', error.message);
      
      // Provide user-friendly error messages
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Cannot reach the server. Please check your internet connection.');
      } else if (error.message.includes('400')) {
        throw new Error('Bad request: ' + error.message + '. Please try again.');
      } else if (error.message.includes('401')) {
        throw new Error('Authentication failed. Please contact support.');
      } else if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
        throw new Error('Server error. Please try again in a moment.');
      }
      
      throw error;
    });
  },
  
  /**
   * Clear API key (kept for backward compatibility)
   */
  clearApiKey: function() {
    localStorage.removeItem('ai_provider');
    localStorage.removeItem('ai_api_key');
    console.log('Local API settings cleared');
  },
  
  /**
   * Check if AI is available
   * @returns {boolean} True if AI can be used
   */
  isAvailable: function() {
    // With backend approach, AI is always available if backend is running
    return true;
  },
  
  /**
   * Get provider info
   * @returns {object} Provider information
   */
  getProviderInfo: function() {
    return {
      provider: 'OpenRouter',
      model: 'arcee-ai/arcee-trinity-large-preview:free',
      backend: '/api/chat'
    };
  }
};

// Log initialization
console.log('AI Helper initialized - window.AIHelper ready');
console.log('Provider:', window.AIHelper.getProviderInfo());
