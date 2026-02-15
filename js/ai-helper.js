/* ==================================================================
   AI Helper Module - Routes AI requests to OpenRouter via backend
   
   IMPORTANT: This file must load BEFORE any file that calls 
   window.AIHelper.callAI (e.g., app-ai.js)
   ================================================================== */

window.AIHelper = {
  
  /**
   * Call AI with a prompt
   * @param {string} prompt - The user prompt/question
   * @param {object} options - Options for the AI call
   * @param {string} options.systemPrompt - System prompt to set context
   * @param {number} options.maxTokens - Maximum tokens in response
   * @param {number} options.temperature - Creativity level (0-1)
   * @returns {Promise<string>} The AI response text
   */
  callAI: function(prompt, options) {
    options = options || {};
    
    // Prepare request body
    var requestBody = {
      prompt: prompt,
      systemPrompt: options.systemPrompt || '',
      maxTokens: options.maxTokens || 2000,
      temperature: options.temperature !== undefined ? options.temperature : 0.7
    };
    
    // Call our backend API endpoint (Vercel serverless function at /api/chat)
    return fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    .then(function(response) {
      // Check if response is OK
      if (!response.ok) {
        return response.json().then(function(errorData) {
          throw new Error(errorData.error || 'API request failed with status ' + response.status);
        }).catch(function(parseErr) {
          // If we can't parse the error JSON, throw a generic error
          if (parseErr.message && parseErr.message.indexOf('API request failed') >= 0) {
            throw parseErr;
          }
          throw new Error('API request failed with status ' + response.status);
        });
      }
      return response.json();
    })
    .then(function(data) {
      // Extract the response text
      if (!data.response) {
        throw new Error('No response from AI');
      }
      return data.response;
    })
    .catch(function(error) {
      console.error('AI Helper Error:', error);
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
  }
};

// Log initialization
console.log('AI Helper initialized - window.AIHelper ready (using /api/chat backend)');
