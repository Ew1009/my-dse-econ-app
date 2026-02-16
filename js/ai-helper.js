/* ==================================================================
   AI Helper Module - Routes AI requests to OpenRouter via backend
   
   v2.4 — AUTOMATIC MODEL FALLBACK WITH JITTER DELAY
   
   Flow:
   1. Try PRIMARY model (gpt-oss-120b) with a 30-second timeout
   2. If it fails (timeout, 429, 500, 502, 503):
      a. Log the error to console for debugging
      b. Show "Switching to backup..." message in the UI
      c. Wait a RANDOM jitter delay (1.5–3 seconds) to avoid
         rapid successive calls being flagged as bot activity
      d. Retry with FALLBACK model (gpt-oss-20b)
   3. If fallback also fails → throw the error to the caller
   
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

  /* Jitter delay config (milliseconds) */
  var JITTER_MIN = 1500;  // 1.5 seconds
  var JITTER_MAX = 3000;  // 3.0 seconds

  /* ────────────────────────────────────────────
     Internal: generate a random jitter delay
     Returns a value between JITTER_MIN and JITTER_MAX
     ──────────────────────────────────────────── */
  function getJitterDelay() {
    return Math.floor(Math.random() * (JITTER_MAX - JITTER_MIN + 1)) + JITTER_MIN;
  }

  /* ────────────────────────────────────────────
     Internal: sleep for a given number of ms
     Returns a Promise that resolves after `ms`
     ──────────────────────────────────────────── */
  function sleep(ms) {
    return new Promise(function(resolve) {
      setTimeout(resolve, ms);
    });
  }

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
     Internal: show "Switching to backup…" in the UI
     
     Creates a temporary overlay message so the
     student knows the app is still working.
     Uses the existing global toast() if available,
     otherwise creates a temporary one.
     ──────────────────────────────────────────── */
  function showSwitchingMessage() {
    var msg = '<i class="fas fa-sync-alt fa-spin" style="margin-right:6px"></i> Switching to backup model…';

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
    el.innerHTML =
      '<i class="fas fa-sync-alt fa-spin" style="font-size:18px;color:var(--ac)"></i>' +
      '<div style="flex:1;font-weight:600;font-size:13px">Switching to backup model…</div>';
    ctr.appendChild(el);
    setTimeout(function() {
      el.style.opacity = '0';
      el.style.transition = 'opacity .3s';
      setTimeout(function() { el.remove(); }, 300);
    }, 4000);
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
     
     This is the main entry point. All existing
     code calls  window.AIHelper.callAI(prompt, opts)
     and gets back a Promise<string>.
     
     FLOW:
     ┌─────────────────────────────────┐
     │  1. Call PRIMARY model           │
     │     ↓ success → return response  │
     │     ↓ failure (retryable)        │
     │  2. console.error(primaryErr)    │
     │  3. Show "Switching to backup…"  │
     │  4. await sleep(1.5–3s jitter)   │
     │  5. Call FALLBACK model          │
     │     ↓ success → return response  │
     │     ↓ failure → throw error      │
     └─────────────────────────────────┘
     ──────────────────────────────────────────── */
  function callAI(prompt, options) {
    options = options || {};

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

        // ** ALWAYS log the primary error for debugging **
        console.error('AIHelper.callAI → PRIMARY MODEL FAILED:', {
          model: requestedModel,
          message: primaryErr.message,
          isTimeout: !!primaryErr.isTimeout,
          httpStatus: httpStatus,
          stack: primaryErr.stack || '(no stack)'
        });

        if (!isRetryable(primaryErr, httpStatus)) {
          // Non-retryable error → bubble up immediately
          console.error('AIHelper.callAI → error is not retryable, giving up');
          throw friendlyError(primaryErr);
        }

        // ---- Begin fallback sequence ----
        // Step 1: Show "Switching to backup…" message in the UI
        showSwitchingMessage();

        // Step 2: Calculate random jitter delay (1.5–3s)
        var jitterMs = getJitterDelay();
        console.log('AIHelper.callAI → waiting ' + jitterMs + 'ms jitter before fallback…');

        // Step 3: Wait for the jitter, THEN call the fallback model
        return sleep(jitterMs).then(function() {
          console.log('AIHelper.callAI → jitter complete, calling fallback model:', FALLBACK_MODEL);

          var fallbackBody = Object.assign({}, baseBody, { model: FALLBACK_MODEL });

          // Give the fallback a fresh full timeout
          return attemptFetch(fallbackBody, REQUEST_TIMEOUT)
            .then(function(data) {
              console.log('AIHelper.callAI → fallback success:', {
                model: data.model,
                responseLength: data.response.length,
                jitterUsed: jitterMs + 'ms'
              });
              return data.response;
            })
            .catch(function(fallbackErr) {
              console.error('AIHelper.callAI → FALLBACK MODEL ALSO FAILED:', {
                model: FALLBACK_MODEL,
                message: fallbackErr.message,
                httpStatus: fallbackErr.httpStatus || 0
              });
              throw friendlyError(fallbackErr);
            });
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
        jitterRange: JITTER_MIN + '-' + JITTER_MAX + 'ms',
        backend: '/api/chat'
      };
    },

    /** Expose config for AI Settings modal */
    getConfig: function() {
      return {
        primaryModel: PRIMARY_MODEL,
        fallbackModel: FALLBACK_MODEL,
        timeout: REQUEST_TIMEOUT,
        jitterMin: JITTER_MIN,
        jitterMax: JITTER_MAX
      };
    }
  };

})();

// Log initialization
console.log('AI Helper v2.4 initialized — automatic model fallback with jitter delay enabled');
console.log('Provider:', window.AIHelper.getProviderInfo());
