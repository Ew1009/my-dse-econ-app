/* ==================================================================
   AI Helper Module - Routes AI requests to OpenRouter via backend
   ================================================================== */

(function() {
  'use strict';
  
  /**
   * AI Helper - Manages all AI API calls through the backend
   */
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
      const requestBody = {
        prompt: prompt,
        systemPrompt: options.systemPrompt || '',
        maxTokens: options.maxTokens || 2000,
        temperature: options.temperature !== undefined ? options.temperature : 0.7
      };
      
      // Call our backend API endpoint
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
            throw new Error(errorData.error || 'API request failed');
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
     * Clear API key (kept for backward compatibility, but not needed for backend approach)
     */
    clearApiKey: function() {
      // Not needed anymore since API key is on the server
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
  console.log('AI Helper initialized - using OpenRouter via backend');
  
})();
