/* ---- Question Formatters (from v0.1) ---- */

/* Safe markdown parsing with XSS protection */
function safeMarkdown(text) {
  if (!text) return '';
  // If marked and DOMPurify are available, use them
  if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
    const parsed = marked.parse(text);
    return DOMPurify.sanitize(parsed, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style']
    });
  }
  // Fallback to plain HTML escaping
  return esc(text);
}

/* Format statements-based questions: (1) text (2) text (3) text */
function formatStatementsQuestion(text) {
  // Check if text contains numbered statements like (1), (2), (3), (4)
  const hasStatements = /\(1\)/.test(text) && /\(2\)/.test(text);
  if (!hasStatements) return safeMarkdown(text);

  // Check for "Statement (N):" format
  const hasStatementFormat = /Statement\s*\(1\):/i.test(text);

  let stem = '';
  let subQuestion = '';
  let statementsText = text;
  const statements = [];

  // Patterns for identifying sub-questions
  const subQuestionPatterns = [
    /Which of the following.*?(?:correct|true|false|incorrect)\??$/i,
    /Which of the following.*?\??$/i,
    /Which of the above.*?(?:correct|true|false|incorrect)\??$/i,
    /Which of the above.*?\??$/i
  ];

  // Handle standard "(1) text (2) text" format
  // First, find where (1) starts
  const firstStatementIdx = text.search(/\(1\)\s*/);

  if (firstStatementIdx > 0) {
    // There's text before the statements - need to separate context from sub-question
    const textBeforeStatements = text.substring(0, firstStatementIdx).trim();
    statementsText = text.substring(firstStatementIdx);

    // Check if textBeforeStatements contains "Which of the following" pattern
    // If so, split into context (question-stem) and sub-question (question-sub)
    const whichOfMatch = textBeforeStatements.match(/^(.*?[.!])\s*(Which of the following[^?]*\?)\s*$/is);
    if (whichOfMatch) {
      stem = whichOfMatch[1].trim(); // Context becomes stem
      subQuestion = whichOfMatch[2].trim(); // "Which of the following..." becomes subQuestion
    } else {
      stem = textBeforeStatements;
    }
  }

  // Find all statement markers to determine the last one
  const statementMarkers = [...statementsText.matchAll(/\((\d+)\)/g)];
  const lastMarker = statementMarkers.length > 0 ? statementMarkers[statementMarkers.length - 1] : null;

  // Check if there's question context AFTER the last statement
  if (lastMarker) {
    const lastMarkerEnd = lastMarker.index + lastMarker[0].length;
    const textAfterLastMarker = statementsText.substring(lastMarkerEnd);

    // Look for a sentence that contains a question pattern after the last statement content
    const questionContextPatterns = [
      /([A-Z][^.!?]*(?:Which of the following|Which of the above)[^?]*\?)/i,
      /([A-Z][^(]*\?)\s*$/  // Any sentence ending with ? at the end
    ];

    for (const pattern of questionContextPatterns) {
      const match = textAfterLastMarker.match(pattern);
      if (match) {
        const contextStart = textAfterLastMarker.indexOf(match[1]);
        // Make sure this context appears AFTER some statement content (not immediately after the marker)
        if (contextStart > 5) { // At least some content before the question context
          const trailingContext = match[1].trim();
          // This trailing text should become the stem (displayed first)
          if (!stem) {
            stem = trailingContext;
          } else {
            stem = trailingContext + ' ' + stem;
          }
          // Remove the context from statementsText
          statementsText = statementsText.substring(0, lastMarkerEnd + contextStart).trim();
          break;
        }
      }
    }
  }

  // Also check for sub-question patterns that should be moved to stem
  for (const pattern of subQuestionPatterns) {
    const match = statementsText.match(pattern);
    if (match) {
      const matchIdx = statementsText.indexOf(match[0]);
      const textAfterMatch = statementsText.substring(matchIdx + match[0].length);

      // If no more statements after this pattern, it's trailing context
      if (!/\(\d+\)/.test(textAfterMatch)) {
        // Check if there's additional context before the question pattern
        // Find where the last statement ends
        const beforeMatch = statementsText.substring(0, matchIdx);
        const lastStatementInBefore = beforeMatch.match(/\(\d+\)[^(]*$/);

        if (lastStatementInBefore) {
          // Extract context: from end of last statement content to the question
          const contextWithQuestion = statementsText.substring(matchIdx).trim();
          if (!stem) {
            stem = contextWithQuestion;
          } else {
            stem = contextWithQuestion;  // Replace with the more complete context
          }
          statementsText = beforeMatch.trim();
        }
        break;
      }
    }
  }

  // Extract numbered statements - handle text with parentheses like Chinese (丁屋)
  // Split by (1), (2), (3), (4) patterns only
  const parts = statementsText.split(/\((\d+)\)\s*/);
  // parts will be: ["", "1", "text1", "2", "text2", ...]
  for (let i = 1; i < parts.length; i += 2) {
    const num = parts[i];
    let statementText = parts[i + 1] || '';
    // Clean up trailing punctuation and whitespace
    statementText = statementText.trim().replace(/[.,;:]+$/, '');
    if (statementText) {
      statements.push({ num: num, text: statementText });
    }
  }

  // Post-process: Check if the LAST statement contains embedded question context
  if (statements.length > 0 && !stem) {
    const lastStatement = statements[statements.length - 1];
    const lastText = lastStatement.text;

    // Look for question context embedded in the last statement
    const embeddedContextMatch = lastText.match(/^(.+?[a-z])\s+([A-Z][^.]*(?:Which of the following|Which of the above)[^?]*\?)$/i);

    if (embeddedContextMatch) {
      // Found embedded context - split it out
      lastStatement.text = embeddedContextMatch[1].trim().replace(/[.,;:]+$/, '');
      stem = embeddedContextMatch[2].trim();
    } else {
      // Try another pattern: look for any sentence ending with ? after statement content
      const questionAtEndMatch = lastText.match(/^(.+?[a-z])\s+([A-Z][^(]+\?)\s*$/);
      if (questionAtEndMatch && questionAtEndMatch[2].length > 20) {
        lastStatement.text = questionAtEndMatch[1].trim().replace(/[.,;:]+$/, '');
        stem = questionAtEndMatch[2].trim();
      }
    }
  }

  // If no statements found, return original
  if (statements.length === 0) return safeMarkdown(text);

  // Build formatted HTML
  let html = '';
  if (stem) html += `<div class="question-stem">${stem}</div>`;
  html += '<div class="statement-list">';
  statements.forEach(s => {
    // Use "Statement (N):" format if original used it, otherwise use "(N)"
    const numLabel = hasStatementFormat
      ? `Statement (${s.num}):`
      : `(${s.num})`;
    html += `<div class="statement-item"><span class="statement-num">${numLabel}</span><span class="statement-text">${s.text}</span></div>`;
  });
  html += '</div>';
  // Show sub-question AFTER statements (like in DSE papers)
  if (subQuestion) html += `<div class="question-sub">${subQuestion}</div>`;
  return html;
}

/* Master format function - applies appropriate formatter based on question content */
function formatQuestionText(text, formatted) {
  if (!text) return '';
  
  // If pre-formatted data exists, use it directly
  if (formatted && formatted.type && formatted.type !== 'text') {
    // Could add handlers for pre-formatted data here
    return text;
  }

  // Check for "The above case/situation/example..." pattern - separates context from question
  const aboveCaseMatch = text.match(/^(.*\.)\s*(The above (?:case|situation|example|scenario|event|policy|measure|building|project|news|information)s?\s+(?:is|are|was|were|shows?|demonstrates?|illustrates?|relates?|involves?|concerns?)[^?]*\??)\s*$/is);
  if (aboveCaseMatch) {
    const context = aboveCaseMatch[1].trim();
    const question = aboveCaseMatch[2].trim();
    return `<div class="question-stem">${context}</div><div class="question-sub">${question}</div>`;
  }

  // Also check for "Which of the following... the above..." pattern
  const whichAboveMatch = text.match(/^(.*\.)\s*(Which of the following[^?]*(?:the above|above case|above situation)[^?]*\?)\s*$/is);
  if (whichAboveMatch) {
    const context = whichAboveMatch[1].trim();
    const question = whichAboveMatch[2].trim();
    return `<div class="question-stem">${context}</div><div class="question-sub">${question}</div>`;
  }

  // Check for numbered statements pattern
  if (/\(1\)/.test(text) && /\(2\)/.test(text)) {
    return formatStatementsQuestion(text);
  }

  // Default: use safe markdown
  return safeMarkdown(text);
}
