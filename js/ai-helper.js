/* ==================================================================
   AI Helper Module - Routes AI requests to OpenRouter via backend
   
   v2.3 — AUTOMATIC MODEL FALLBACK
   
   Flow:
   1. Try PRIMARY model with a 30-second timeout
   2. If it fails (timeout, 429, 500, 502, 503) → retry with FALLBACK model
   3. Show a subtle toast: "Switching to high-speed mode…"
   4. If fallback also fails → throw the error to the caller
   
   IMPORTANT: This file must load BEFORE any file that calls 
   window.AIHelper.callAI (e.g., app-ai.js)
   
   Backend (api/chat.js) expects this JSON body:
   {
     prompt: string,        ← REQUIRED (non-empty)
     systemPrompt: string,  ← optional
     maxTokens: number,     ← optional (default 2000)
     temperature: number,   ← optional (default 0.7)
     model: string          ← optional (backend has its own default)
   }
   
   Backend returns:
   { response: string, model: string, usage: object }
   ================================================================== */

window.AIHelper = (function() {

  /* ────────────────────────────────────────────
     Configuration
     ──────────────────────────────────────────── */
  var PRIMARY_MODEL   = 'openai/gpt-oss-120b:free';
  var FALLBACK_MODEL  = 'openai/gpt-oss-20b:free';
  var REQUEST_TIMEOUT = 30000;   // 30 seconds
  var RETRYABLE_CODES = [429, 500, 502, 503];

  /* ────────────────────────────────────────────
     Internal: fetch with timeout
     Wraps a fetch() in a Promise.race against a
     timer that rejects after `ms` milliseconds.
     ──────────────────────────────────────────── */
  function fetchWithTimeout(url, options, ms) {
    return new Promise(function(resolve, reject) {
      var timedOut = false;

      var timer = setTimeout(function() {
        timedOut = true;
        reject(new _TimeoutError('Request timed out after ' + (ms / 1000) + 's'));
      }, ms);

      fetch(url, options)
        .then(function(response) {
          clearTimeout(timer);
          if (!timedOut) resolve(response);
        })
        .catch(function(err) {
          clearTimeout(timer);
          if (!timedOut) reject(err);
        });
    });
  }

  /* Custom error class so we can identify timeouts */
  function _TimeoutError(message) {
    this.name = 'TimeoutError';
    this.message = message;
    this.isTimeout = true;
  }
  _TimeoutError.prototype = Object.create(Error.prototype);
  _TimeoutError.prototype.constructor = _TimeoutError;

  /* ────────────────────────────────────────────
     Internal: show a subtle fallback toast
     Uses the existing global toast() if available,
     otherwise creates a temporary one.
     ──────────────────────────────────────────── */
  function showFallbackToast(reason) {
    var msg = '<i class="fas fa-bolt" style="margin-right:4px"></i> Switching to high-speed mode…';
    // Use global toast if available
    if (typeof window.toast === 'function') {
      window.toast(msg, 'info');
      return;
    }
    // Fallback: inject a quick toast ourselves
    var ctr = document.getElementById('toastCtr');
    if (!ctr) return;
    var el = document.createElement('div');
    el.className = 'toast t-info';
    el.innerHTML = '<i class="fas fa-bolt" style="font-size:18px;color:var(--ac)"></i>' +
      '<div style="flex:1;font-weight:600;font-size:13px">Switching to high-speed mode…</div>';
    ctr.appendChild(el);
    setTimeout(function() {
      el.style.opacity = '0';
      el.style.transition = 'opacity .3s';
      setTimeout(function() { el.remove(); }, 300);
    }, 3500);
  }

  /* ────────────────────────────────────────────
     Internal: determine if an error is retryable
     ──────────────────────────────────────────── */
  function isRetryable(err, httpStatus) {
    // Timeout is always retryable
    if (err && err.isTimeout) return true;
    // Network failures
    if (err && err.message && err.message.indexOf('Failed to fetch') !== -1) return true;
    // Specific HTTP status codes
    if (httpStatus && RETRYABLE_CODES.indexOf(httpStatus) !== -1) return true;
    return false;
  }

  /* ────────────────────────────────────────────
     Internal: single fetch attempt to /api/chat
     Returns { response, model, usage } on success.
     Throws on failure (with .httpStatus if available).
     ──────────────────────────────────────────── */
  function attemptFetch(requestBody, timeoutMs) {
    return fetchWithTimeout('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }, timeoutMs)
    .then(function(response) {
      var status = response.status;

      if (!response.ok) {
        // Try to parse the error body
        return response.text().then(function(text) {
          var errorMsg = 'API request failed with status ' + status;
          try {
            var errorData = JSON.parse(text);
            if (errorData.error) errorMsg = errorData.error;
          } catch (e) {
            if (text) errorMsg += ': ' + text.substring(0, 300);
          }
          var err = new Error(errorMsg);
          err.httpStatus = status;
          throw err;
        });
      }

      return response.json().then(function(data) {
        if (!data.response) {
          throw new Error('No response from AI. Server returned unexpected format.');
        }
        return data;
      });
    });
  }

  /* ────────────────────────────────────────────
     PUBLIC: callAI(prompt, options)
     
     This is the main entry point.  All existing
     code calls  window.AIHelper.callAI(prompt, opts)
     and gets back a Promise<string>.
     ──────────────────────────────────────────── */
  function callAI(prompt, options) {
  options = options || {};
  const primaryModel = options.model || 'openai/gpt-oss-120b:free';
  const fallbackModel = 'openai/gpt-oss-20b:free';

  // Primary attempt
  return this.attemptFetch(prompt, { ...options, model: primaryModel })
    .catch(err => {
      // If primary fails with 429 (Rate Limit), wait 2s and try fallback
      if (err.message.includes('429')) {
        console.warn("Primary model rate limited. Retrying with fallback...");
        return new Promise(res => setTimeout(res, 2000)) 
          .then(() => this.attemptFetch(prompt, { ...options, model: fallbackModel }));
      }
      throw err;
    });
}

    // ---- Validate prompt ----
    if (typeof prompt !== 'string') {
      console.error('AIHelper.callAI: prompt is not a string, got:', typeof prompt, prompt);
      return Promise.reject(new Error('Prompt must be a non-empty string. Received type: ' + typeof prompt));
    }
    prompt = prompt.trim();
    if (!prompt) {
      console.error('AIHelper.callAI: prompt is empty after trim');
      return Promise.reject(new Error('Prompt cannot be empty.'));
    }

    // ---- Build base request body ----
    var baseBody = {
      prompt: prompt,
      systemPrompt: (typeof options.systemPrompt === 'string' && options.systemPrompt.trim())
                      ? options.systemPrompt.trim() : '',
      maxTokens: (typeof options.maxTokens === 'number' && options.maxTokens > 0)
                   ? options.maxTokens : 2000,
      temperature: (typeof options.temperature === 'number') ? options.temperature : 0.7
    };

    // Allow caller to force a specific model (edge case)
    var requestedModel = (typeof options.model === 'string' && options.model) ? options.model : PRIMARY_MODEL;

    // ---- Attempt 1: Primary model ----
    var primaryBody = Object.assign({}, baseBody, { model: requestedModel });

    console.log('AIHelper.callAI → attempt 1 (primary):', {
      model: primaryBody.model,
      promptLength: primaryBody.prompt.length,
      promptPreview: primaryBody.prompt.substring(0, 120) + (primaryBody.prompt.length > 120 ? '…' : ''),
      timeout: REQUEST_TIMEOUT + 'ms'
    });

    return attemptFetch(primaryBody, REQUEST_TIMEOUT)
      .then(function(data) {
        // Primary succeeded
        console.log('AIHelper.callAI → primary success:', {
          model: data.model,
          responseLength: data.response.length
        });
        return data.response;
      })
      .catch(function(primaryErr) {
        // ---- Decide whether to retry ----
        var httpStatus = primaryErr.httpStatus || 0;
        console.warn('AIHelper.callAI → primary failed:', {
          message: primaryErr.message,
          isTimeout: !!primaryErr.isTimeout,
          httpStatus: httpStatus
        });

        if (!isRetryable(primaryErr, httpStatus)) {
          // Non-retryable error → bubble up immediately
          console.error('AIHelper.callAI → not retryable, giving up');
          throw friendlyError(primaryErr);
        }

        // ---- Attempt 2: Fallback model ----
        console.log('AIHelper.callAI → retrying with fallback model:', FALLBACK_MODEL);
        showFallbackToast(primaryErr.message);

        var fallbackBody = Object.assign({}, baseBody, { model: FALLBACK_MODEL });

        // Give the fallback a fresh full timeout
        return attemptFetch(fallbackBody, REQUEST_TIMEOUT)
          .then(function(data) {
            console.log('AIHelper.callAI → fallback success:', {
              model: data.model,
              responseLength: data.response.length
            });
            return data.response;
          })
          .catch(function(fallbackErr) {
            console.error('AIHelper.callAI → fallback also failed:', fallbackErr.message);
            throw friendlyError(fallbackErr);
          });
      });
  }

  /* ────────────────────────────────────────────
     Internal: produce user-friendly error messages
     ──────────────────────────────────────────── */
  function friendlyError(err) {
    var msg = err.message || 'Unknown error';
    if (err.isTimeout) {
      return new Error('Request timed out. Please try again.');
    }
    if (msg.indexOf('Failed to fetch') !== -1) {
      return new Error('Network error: Cannot reach the server. Please check your internet connection.');
    }
    var status = err.httpStatus || 0;
    if (status === 400) return new Error('Bad request: ' + msg);
    if (status === 401) return new Error('Authentication failed. Please contact support.');
    if (status === 429) return new Error('Rate limit exceeded. Please wait a moment and try again.');
    if (status >= 500) return new Error('Server error. Please try again in a moment.');
    return err;
  }

  /* ────────────────────────────────────────────
     PUBLIC API
     ──────────────────────────────────────────── */
  return {
    callAI: callAI,

    /** Clear API key (backward compat) */
    clearApiKey: function() {
      localStorage.removeItem('ai_provider');
      localStorage.removeItem('ai_api_key');
      console.log('Local API settings cleared');
    },

    /** Check if AI is available */
    isAvailable: function() {
      return true;
    },

    /** Get provider info */
    getProviderInfo: function() {
      return {
        provider: 'OpenRouter',
        primaryModel: PRIMARY_MODEL,
        fallbackModel: FALLBACK_MODEL,
        timeout: REQUEST_TIMEOUT,
        backend: '/api/chat'
      };
    },

    /** Expose config for AI Settings modal */
    getConfig: function() {
      return {
        primaryModel: PRIMARY_MODEL,
        fallbackModel: FALLBACK_MODEL,
        timeout: REQUEST_TIMEOUT
      };
    }
  };

})();

// Log initialization
console.log('AI Helper v2.3 initialized — automatic model fallback enabled');
console.log('Provider:', window.AIHelper.getProviderInfo());
