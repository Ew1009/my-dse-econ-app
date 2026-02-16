/* ==================================================================
   Question Formatters (restored from v0.1 + adapted for v2.2+ CSS vars)
   
   CSS variable mapping (v0.1 → v2.2):
     --bg-primary    → --bg0
     --bg-secondary  → --bg1
     --bg-tertiary   → --bg2
     --text-primary  → --tx1
     --text-secondary→ --tx2
     --text-muted    → --tx3
     --border        → --bd
     --primary       → --pr
     --success       → --ok
     --warning       → --wn
     --danger        → --no
   ================================================================== */

/* Safe markdown parsing with XSS protection */
function safeMarkdown(text) {
  if (!text) return '';
  if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
    const parsed = marked.parse(text);
    return DOMPurify.sanitize(parsed, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style']
    });
  }
  return esc(text);
}

/* ============================================================
   DIAGRAM FORMATTER
   Handles [DIAGRAM: Parent → (X) Child1, (Y) Child2] patterns
   ============================================================ */
function formatDiagramQuestion(text, match) {
  const diagramContent = match[1].trim();
  const beforeDiagram = text.substring(0, match.index).trim();
  const afterDiagram = text.substring(match.index + match[0].length).trim();

  const arrowMatch = diagramContent.match(/^([^→]+)→\s*(.+)$/);
  if (!arrowMatch) return safeMarkdown(text);

  const parent = arrowMatch[1].trim();
  const childrenStr = arrowMatch[2].trim();

  const children = [];
  const childPattern = /\(([^)]+)\)\s*([^,]+)/g;
  let childMatch;
  while ((childMatch = childPattern.exec(childrenStr)) !== null) {
    children.push({ label: childMatch[1].trim(), name: childMatch[2].trim() });
  }

  let diagramHtml = `
    <div class="org-chart-container">
      <div class="org-chart">
        <div class="org-parent">
          <div class="org-box parent-box">${parent}</div>
        </div>
        <div class="org-arrows">
          ${children.map(c => `<div class="org-arrow"><span class="arrow-label">${c.label}</span><div class="arrow-line">↓</div></div>`).join('')}
        </div>
        <div class="org-children">
          ${children.map(c => `<div class="org-child"><div class="org-box child-box">${c.name}</div></div>`).join('')}
        </div>
      </div>
    </div>`;

  let result = '';
  if (beforeDiagram) result += `<p>${beforeDiagram}</p>`;
  result += diagramHtml;
  if (afterDiagram) result += `<p class="question-suffix">${afterDiagram}</p>`;

  return result;
}

/* ============================================================
   TABLE QUESTION FORMATTER
   Handles production/cost data tables with Header (unit) patterns
   e.g., "Capital (units) Labour (units) 1 10 2 20..."
   ============================================================ */
function formatTableQuestion(text) {
  // Smart normalization: "10 000" → "10000" (thousand separator)
  let normalizedText = text.replace(/(\d+)\s+(000)(?!\d)/g, '$1$2');
  normalizedText = normalizedText.replace(/(\d+)\s+(000)(?!\d)/g, '$1$2');

  // Find the intro text
  const introPatterns = [
    /^(.*?(?:is as follows|as follows|shown below|given below)[:\.]?\s*)/i,
    /^(.*?(?:schedule|table|data) below[^.]*\.\s*)/i,
    /^(.*?relationship[^:]*:\s*)/i,
    /^(.*?following (?:table|schedule|data)[^.]*\.\s*)/i,
    /^(.*?shows the[^.]*\.\s*)/i,
    /^(.*?fixed cost[^.]*\.\s*)/i,
    /^(.*?change in (?:output|cost|production)[^.]*\.\s*)/i,
    /^(.*?after a change in output\.\s*)/i,
    /^(.*?(?:labour and machinery|capital and labour|machinery and labour)\.\s*)/i,
    /^(The following table shows[^.]*\.\s*)/i
  ];

  let introText = '';
  let remainingText = normalizedText;

  for (const pattern of introPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      introText = match[1];
      remainingText = normalizedText.substring(match[1].length);
      break;
    }
  }

  // Find all headers with their positions
  const headerPattern = /([A-Z][A-Za-z]*(?:\s+[A-Za-z]+)*)\s*\(([^)]+)\)/g;
  const allMatches = [];
  let match;
  while ((match = headerPattern.exec(remainingText)) !== null) {
    allMatches.push({
      name: match[1].trim(),
      unit: match[2].trim(),
      start: match.index,
      end: match.index + match[0].length
    });
  }

  if (allMatches.length < 2) return safeMarkdown(text);

  // Detect format: horizontal vs vertical
  const valuePattern = /\d+(?:\.\d+)?|[A-Z](?![a-z])/g;
  const betweenHeaders = remainingText.substring(allMatches[0].end, allMatches[1].start);
  const valuesBetween = betweenHeaders.match(valuePattern) || [];
  const isHorizontal = valuesBetween.length >= 2;

  // Suffix patterns
  const suffixPatterns = [
    /According to the above/i, /From the above/i, /Based on the above/i,
    /The above table/i, /From the table/i, /Diminishing marginal returns/i,
    /we can conclude/i, /Which of the following/i, /What is the/i,
    /The marginal product/i, /If the average cost/i, /If the product price/i,
    /If the profit/i, /If the market price/i, /the firm will produce/i,
    /The maximum profit/i, /The minimum/i, /Suppose the/i,
    /Assuming the/i, /Given that/i, /As a result/i, /The market price/i,
    /If the above/i, /X\s*If the above/i
  ];

  let questionSuffix = '';
  let tableHtml = '';

  if (isHorizontal) {
    // HORIZONTAL FORMAT: "Header1 (unit) d1 d2 d3 Header2 (unit) d1 d2 d3..."
    const rows = [];
    for (let i = 0; i < allMatches.length; i++) {
      const header = allMatches[i];
      const nextStart = (i + 1 < allMatches.length) ? allMatches[i + 1].start : remainingText.length;
      let dataSection = remainingText.substring(header.end, nextStart);

      if (i === allMatches.length - 1) {
        for (const sp of suffixPatterns) {
          const sm = dataSection.match(sp);
          if (sm) {
            const idx = dataSection.indexOf(sm[0]);
            questionSuffix = dataSection.substring(idx);
            dataSection = dataSection.substring(0, idx);
            break;
          }
        }
      }

      const values = dataSection.match(/\d+(?:\.\d+)?|[A-Z](?![a-z])/g) || [];
      if (values.length > 0) {
        rows.push({ name: header.name, unit: header.unit, data: values });
      }
    }

    if (rows.length < 2) return safeMarkdown(text);
    const numCols = Math.min(...rows.map(r => r.data.length));

    tableHtml = '<div class="question-table-container"><table class="question-data-table">';
    rows.forEach((row, idx) => {
      tableHtml += idx === 0 ? '<thead>' : '';
      tableHtml += '<tr>';
      tableHtml += `<th class="row-header">${row.name}<br><span class="unit">(${row.unit})</span></th>`;
      row.data.slice(0, numCols).forEach(val => {
        tableHtml += idx === 0 ? `<th class="data-cell">${val}</th>` : `<td>${val}</td>`;
      });
      tableHtml += '</tr>';
      tableHtml += idx === 0 ? '</thead><tbody>' : '';
    });
    tableHtml += '</tbody></table></div>';

  } else {
    // VERTICAL FORMAT: headers together, then interleaved data
    const headers = allMatches.map(m => ({ name: m.name, unit: m.unit }));
    const lastHeaderEnd = allMatches[allMatches.length - 1].end;
    let dataSection = remainingText.substring(lastHeaderEnd);

    for (const sp of suffixPatterns) {
      const sm = dataSection.match(sp);
      if (sm) {
        const idx = dataSection.indexOf(sm[0]);
        questionSuffix = dataSection.substring(idx);
        dataSection = dataSection.substring(0, idx);
        break;
      }
    }

    const allValues = dataSection.match(/\d+(?:\.\d+)?|[A-Z](?![a-z])/g) || [];
    const numCols = headers.length;
    const numRows = Math.floor(allValues.length / numCols);

    if (numRows < 1) return safeMarkdown(text);

    tableHtml = '<div class="question-table-container"><table class="question-data-table"><thead><tr>';
    headers.forEach(h => {
      tableHtml += `<th>${h.name}<br><span class="unit">(${h.unit})</span></th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    for (let row = 0; row < numRows; row++) {
      tableHtml += '<tr>';
      for (let col = 0; col < numCols; col++) {
        tableHtml += `<td>${allValues[row * numCols + col] || ''}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table></div>';
  }

  let result = '';
  if (introText) result += `<p>${introText.trim()}</p>`;
  result += tableHtml;
  if (questionSuffix) result += `<p class="question-suffix">${questionSuffix.trim()}</p>`;
  return result;
}

/* ============================================================
   HELPER: Extract value for a firm/factory row label
   ============================================================ */
function extractFirmValue(firmData, targetLabel, allLabels) {
  const targetPattern = new RegExp(targetLabel.replace(/\s+/g, '\\s+'), 'i');
  const match = firmData.match(targetPattern);
  if (!match) return null;

  const startIdx = match.index + match[0].length;
  let endIdx = firmData.length;
  for (const label of allLabels) {
    if (label.toLowerCase() === targetLabel.toLowerCase()) continue;
    const labelPattern = new RegExp(label.replace(/\s+/g, '\\s+'), 'i');
    const nextMatch = firmData.substring(startIdx).match(labelPattern);
    if (nextMatch && startIdx + nextMatch.index < endIdx) {
      endIdx = startIdx + nextMatch.index;
    }
  }

  let value = firmData.substring(startIdx, endIdx).trim();
  value = value.replace(/^[:\s]+/, '').replace(/[,\s]+$/, '').trim();
  return value || null;
}

/* ============================================================
   FIRM COMPARISON TABLE FORMATTER
   Handles Firm A vs Firm B comparison tables
   ============================================================ */
function formatFirmComparisonTable(text) {
  const rowLabels = [
    'Number of owners',
    'Transfer of ownership',
    'Disclosure of financial account to public',
    'Disclosure of financial account',
    'Liability',
    'Legal status',
    'Continuity',
    'Raising capital in the stock market',
    'Raising capital'
  ];

  let introText = '';
  let dataText = text;
  const introMatch = text.match(/^(.*?(?:Study the following information about|The following (?:table|information) shows?)[^.]*\.)\s*/i);
  if (introMatch) {
    introText = introMatch[1].trim();
    dataText = text.substring(introMatch[0].length);
  }

  let questionSuffix = '';
  const suffixPatterns = [
    /According to the above (?:table|information)?[^?]*\??/i,
    /Which of the following (?:descriptions?|statements?)[^?]*\?/i
  ];
  for (const pattern of suffixPatterns) {
    const match2 = dataText.match(pattern);
    if (match2) {
      questionSuffix = match2[0];
      dataText = dataText.substring(0, dataText.indexOf(match2[0])).trim();
      break;
    }
  }

  const firmMatch = dataText.match(/Firm ([A-Z])/g);
  if (!firmMatch || firmMatch.length < 2) return safeMarkdown(text);

  const firms = [...new Set(firmMatch.map(f => f.replace('Firm ', '')))];
  if (firms.length < 2) return safeMarkdown(text);

  const firm1 = firms[0];
  const firm2 = firms[1];

  const firm2Pattern = new RegExp(`Firm ${firm2}`, 'i');
  const firm2Match = dataText.match(firm2Pattern);
  if (!firm2Match) return safeMarkdown(text);

  const splitIdx = dataText.indexOf(firm2Match[0]);
  let firm1Data = dataText.substring(0, splitIdx).replace(new RegExp(`Firm ${firm1}`, 'i'), '').trim();
  let firm2Data = dataText.substring(splitIdx + firm2Match[0].length).trim();

  const tableRows = [];
  for (const label of rowLabels) {
    const labelPattern = new RegExp(label.replace(/\s+/g, '\\s+'), 'i');
    if (labelPattern.test(firm1Data)) {
      const value1 = extractFirmValue(firm1Data, label, rowLabels);
      const value2 = extractFirmValue(firm2Data, label, rowLabels);
      if (value1 || value2) {
        tableRows.push({ label, value1: value1 || '-', value2: value2 || '-' });
      }
    }
  }

  if (tableRows.length === 0) return safeMarkdown(text);

  let html = '';
  if (introText) html += `<div class="question-stem">${introText}</div>`;
  html += '<div class="firm-table-container"><table class="firm-table">';
  html += `<thead><tr><th></th><th>Firm ${firm1}</th><th>Firm ${firm2}</th></tr></thead>`;
  html += '<tbody>';
  tableRows.forEach(row => {
    html += `<tr><td class="row-label">${row.label}</td><td>${row.value1}</td><td>${row.value2}</td></tr>`;
  });
  html += '</tbody></table></div>';
  if (questionSuffix) html += `<div class="question-sub">${questionSuffix}</div>`;
  return html;
}

/* ============================================================
   FACTORY COMPARISON TABLE FORMATTER
   Handles Factory A vs Factory B comparison tables
   ============================================================ */
function formatFactoryComparisonTable(text) {
  const rowLabels = [
    'Number of workers employed',
    'Number of full-time workers',
    'Number of part-time workers',
    'Total number of working hours',
    'Average working hours of full-time workers',
    'Average working hours of full-tome workers', // typo in original data
    'Average working hours of part-time workers',
    'Total output (units)',
    'Total output'
  ];

  let introText = '';
  let dataText = text;
  const introMatch = text.match(/^(.*?(?:Refer to the (?:following )?table|table) below[.:]?\s*)/i);
  if (introMatch) {
    introText = introMatch[1].trim();
    dataText = text.substring(introMatch[0].length);
  }

  let questionSuffix = '';
  const suffixPatterns = [
    /(?:Based on the above|Which of the following)[^?]*\?/i,
    /(?:labour supply|labor supply)[^?]*\?/i
  ];
  for (const pattern of suffixPatterns) {
    const match2 = dataText.match(pattern);
    if (match2) {
      questionSuffix = dataText.substring(dataText.indexOf(match2[0])).trim();
      dataText = dataText.substring(0, dataText.indexOf(match2[0])).trim();
      break;
    }
  }

  const factoryMatch = dataText.match(/Factory ([A-Z])/gi);
  if (!factoryMatch || factoryMatch.length < 2) return safeMarkdown(text);

  const factories = [...new Set(factoryMatch.map(f => f.replace(/Factory /i, '').toUpperCase()))];
  if (factories.length < 2) return safeMarkdown(text);

  const factory1 = factories[0];
  const factory2 = factories[1];

  dataText = dataText.replace(/(\d+)\s+(\d{3})(?!\d)/g, '$1$2');
  dataText = dataText.replace(/(\d+)\s+(\d{3})(?!\d)/g, '$1$2');

  const tableRows = [];
  for (const label of rowLabels) {
    const labelPattern = new RegExp(label.replace(/\s+/g, '\\s+').replace(/\(/g, '\\(').replace(/\)/g, '\\)'), 'i');
    const labelMatch = dataText.match(labelPattern);
    if (labelMatch) {
      const afterLabel = dataText.substring(labelMatch.index + labelMatch[0].length);
      const values = afterLabel.match(/^\s*(\d[\d\s]*\d|\d)\s+(\d[\d\s]*\d|\d)/);
      if (values) {
        const val1 = values[1].replace(/\s+/g, '');
        const val2 = values[2].replace(/\s+/g, '');
        tableRows.push({ label: label.replace(' (units)', ''), value1: val1, value2: val2 });
      }
    }
  }

  if (tableRows.length === 0) return safeMarkdown(text);

  let html = '';
  if (introText) html += `<div class="question-stem">${introText}</div>`;
  html += '<div class="firm-table-container"><table class="firm-table">';
  html += `<thead><tr><th></th><th>Factory ${factory1}</th><th>Factory ${factory2}</th></tr></thead>`;
  html += '<tbody>';
  tableRows.forEach(row => {
    html += `<tr><td class="row-label">${row.label}</td><td>${row.value1}</td><td>${row.value2}</td></tr>`;
  });
  html += '</tbody></table></div>';
  if (questionSuffix) html += `<div class="question-sub">${questionSuffix}</div>`;
  return html;
}

/* ============================================================
   SYSTEM COMPARISON TABLE FORMATTER
   Old System vs New System
   ============================================================ */
function formatSystemComparisonTable(text) {
  const rowLabels = [
    'Output per worker (per day)',
    'Output per worker',
    'Output with quality below standard',
    'Quality below standard'
  ];

  let introText = '';
  let dataText = text;
  const introMatch = text.match(/^(.*?(?:following results|results after)[^:]*:\s*)/i);
  if (introMatch) {
    introText = introMatch[1].trim();
    dataText = text.substring(introMatch[0].length);
  }

  let questionSuffix = '';
  const suffixPatterns = [
    /Most probably[^.]*[._]+/i,
    /Which of the following[^?]*\?/i,
    /Based on the above[^?]*\?/i
  ];
  for (const pattern of suffixPatterns) {
    const match2 = dataText.match(pattern);
    if (match2) {
      questionSuffix = dataText.substring(dataText.indexOf(match2[0])).trim();
      dataText = dataText.substring(0, dataText.indexOf(match2[0])).trim();
      break;
    }
  }

  dataText = dataText.replace(/(\d+)\s+(000)(?!\d)/g, '$1$2');

  const tableRows = [];
  for (const label of rowLabels) {
    const labelPattern = new RegExp(label.replace(/\s+/g, '\\s+').replace(/\(/g, '\\(').replace(/\)/g, '\\)'), 'i');
    const labelMatch = dataText.match(labelPattern);
    if (labelMatch) {
      const afterLabel = dataText.substring(labelMatch.index + labelMatch[0].length);
      const values = afterLabel.match(/^\s*(\d+)\s*(?:units?)?\s+(\d+)\s*(?:units?)?/i);
      if (values) {
        tableRows.push({ label: label, value1: values[1] + ' units', value2: values[2] + ' units' });
      }
    }
  }

  if (tableRows.length === 0) return safeMarkdown(text);

  let html = '';
  if (introText) html += `<div class="question-stem">${introText}</div>`;
  html += '<div class="firm-table-container"><table class="firm-table">';
  html += '<thead><tr><th></th><th>Old System</th><th>New System</th></tr></thead>';
  html += '<tbody>';
  tableRows.forEach(row => {
    html += `<tr><td class="row-label">${row.label}</td><td>${row.value1}</td><td>${row.value2}</td></tr>`;
  });
  html += '</tbody></table></div>';
  if (questionSuffix) html += `<div class="question-sub">${questionSuffix}</div>`;
  return html;
}

/* ============================================================
   YEAR COMPARISON TABLE FORMATTER
   Year 1 vs Year 2
   ============================================================ */
function formatYearComparisonTable(text) {
  const rowLabels = [
    'Number of workers',
    'Number of working hours per worker per day',
    'Quantity of output (units)',
    'Quantity of output',
    'Total output (units)',
    'Total output'
  ];

  let introText = '';
  let dataText = text;
  const introMatch = text.match(/^(.*?(?:is as follows|as follows)[:\.]?\s*)/i);
  if (introMatch) {
    introText = introMatch[1].trim();
    dataText = text.substring(introMatch[0].length);
  }

  let questionSuffix = '';
  const suffixPatterns = [
    /Based on the above[^.]*[._]+/i,
    /Which of the following[^?]*\?/i
  ];
  for (const pattern of suffixPatterns) {
    const match2 = dataText.match(pattern);
    if (match2) {
      questionSuffix = dataText.substring(dataText.indexOf(match2[0])).trim();
      dataText = dataText.substring(0, dataText.indexOf(match2[0])).trim();
      break;
    }
  }

  dataText = dataText.replace(/(\d+)\s+(\d{3})(?!\d)/g, '$1$2');
  dataText = dataText.replace(/(\d+)\s+(\d{3})(?!\d)/g, '$1$2');

  const tableRows = [];
  for (const label of rowLabels) {
    const labelPattern = new RegExp(label.replace(/\s+/g, '\\s+').replace(/\(/g, '\\(').replace(/\)/g, '\\)'), 'i');
    const labelMatch = dataText.match(labelPattern);
    if (labelMatch) {
      const afterLabel = dataText.substring(labelMatch.index + labelMatch[0].length);
      const values = afterLabel.match(/^\s*(\d+)\s+(\d+)/);
      if (values) {
        tableRows.push({ label: label, value1: values[1], value2: values[2] });
      }
    }
  }

  if (tableRows.length === 0) return safeMarkdown(text);

  let html = '';
  if (introText) html += `<div class="question-stem">${introText}</div>`;
  html += '<div class="firm-table-container"><table class="firm-table">';
  html += '<thead><tr><th></th><th>Year 1</th><th>Year 2</th></tr></thead>';
  html += '<tbody>';
  tableRows.forEach(row => {
    html += `<tr><td class="row-label">${row.label}</td><td>${row.value1}</td><td>${row.value2}</td></tr>`;
  });
  html += '</tbody></table></div>';
  if (questionSuffix) html += `<div class="question-sub">${questionSuffix}</div>`;
  return html;
}

/* ============================================================
   COUNTRY COMPARISON TABLE FORMATTER
   Country A vs Country B
   ============================================================ */
function formatCountryComparisonTable(text) {
  const rowLabels = [
    'Number of workers',
    'Average working hours of workers per day',
    'Average working hours per worker per day',
    'Total output (units)',
    'Total output (unit)',
    'Total output',
    'Output per worker'
  ];

  let introText = '';
  let dataText = text;
  const introMatch = text.match(/^(.*?(?:Refer to the following table|following table|is as follows)[.:]?\s*)/i);
  if (introMatch) {
    introText = introMatch[1].trim();
    dataText = text.substring(introMatch[0].length);
  }

  let questionSuffix = '';
  const suffixPatterns = [
    /In the above table[^?]*\?/i,
    /(?:Based on the above|Which of the following)[^?]*\?/i,
    /(?:labour supply|labor supply|average product|labour productivity)[^?]*\?/i,
    /The above information[^?]*\?/i
  ];
  for (const pattern of suffixPatterns) {
    const match2 = dataText.match(pattern);
    if (match2) {
      questionSuffix = dataText.substring(dataText.indexOf(match2[0])).trim();
      dataText = dataText.substring(0, dataText.indexOf(match2[0])).trim();
      break;
    }
  }

  const countryMatch = dataText.match(/Country ([A-Z])/gi);
  if (!countryMatch || countryMatch.length < 2) return safeMarkdown(text);

  const countries = [...new Set(countryMatch.map(c => c.replace(/Country /i, '').toUpperCase()))];
  if (countries.length < 2) return safeMarkdown(text);

  const country1 = countries[0];
  const country2 = countries[1];

  dataText = dataText.replace(/(\d+)\s+(\d{3})(?!\d)/g, '$1$2');

  const tableRows = [];
  for (const label of rowLabels) {
    const labelPattern = new RegExp(label.replace(/\s+/g, '\\s+').replace(/\(/g, '\\(').replace(/\)/g, '\\)'), 'i');
    const labelMatch = dataText.match(labelPattern);
    if (labelMatch) {
      const afterLabel = dataText.substring(labelMatch.index + labelMatch[0].length);
      const values = afterLabel.match(/^\s*([A-Z0-9]+)\s+([A-Z0-9]+)/i);
      if (values) {
        tableRows.push({ label: label.replace(' (unit)', '').replace(' (units)', ''), value1: values[1], value2: values[2] });
      }
    }
  }

  if (tableRows.length === 0) return safeMarkdown(text);

  let html = '';
  if (introText) html += `<div class="question-stem">${introText}</div>`;
  html += '<div class="firm-table-container"><table class="firm-table">';
  html += `<thead><tr><th></th><th>Country ${country1}</th><th>Country ${country2}</th></tr></thead>`;
  html += '<tbody>';
  tableRows.forEach(row => {
    html += `<tr><td class="row-label">${row.label}</td><td>${row.value1}</td><td>${row.value2}</td></tr>`;
  });
  html += '</tbody></table></div>';
  if (questionSuffix) html += `<div class="question-sub">${questionSuffix}</div>`;
  return html;
}

/* ============================================================
   SIMPLE TABLE QUESTION FORMATTER
   Handles "No. of workers Average output (units) 5 100..."
   ============================================================ */
function formatSimpleTableQuestion(text) {
  const normalizedText = text;

  const noOfWorkersMatch = normalizedText.match(
    /^(.*?)(No\.\s*of\s+workers)\s+(Average\s+output\s*\(units?\))\s+((?:\d+\s+)+\d+)\s+(.*)$/is
  );

  if (noOfWorkersMatch) {
    const introText = noOfWorkersMatch[1].trim();
    const header1 = noOfWorkersMatch[2].trim();
    const header2 = noOfWorkersMatch[3].trim();
    const numbersText = noOfWorkersMatch[4].trim();
    const questionSuffix = noOfWorkersMatch[5].trim();

    const numbers = numbersText.split(/\s+/).map(n => n.trim()).filter(n => n);
    const numCols = 2;
    const numRows = Math.floor(numbers.length / numCols);

    let html = '';
    if (introText) html += `<div class="question-stem">${introText}</div>`;
    html += '<div class="question-table-container"><table class="question-data-table">';
    html += '<thead><tr>';
    html += `<th>${header1}</th>`;
    html += `<th>${header2}</th>`;
    html += '</tr></thead><tbody>';
    for (let row = 0; row < numRows; row++) {
      html += '<tr>';
      html += `<td>${numbers[row * numCols] || ''}</td>`;
      html += `<td>${numbers[row * numCols + 1] || ''}</td>`;
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    if (questionSuffix) html += `<div class="question-sub">${questionSuffix}</div>`;
    return html;
  }

  return null;
}

/* ============================================================
   EMPLOYMENT DISTRIBUTION TABLE FORMATTER
   Year/Sector with years as columns
   ============================================================ */
function formatEmploymentDistributionTable(text) {
  const pattern = /^(.*?(?:following table shows|table below shows)[^.]*\.)\s*Year\s+Sector\s+(\d{4})\s+(\d{4})\s+(\d{4})\s+Primary\s+([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)\s+Secondary\s+([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)\s+Tertiary\s+([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)\s+\(Total\)\s+([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)\s+(.*?)$/is;

  const match = text.match(pattern);
  if (!match) return null;

  const intro = match[1].trim();
  const years = [match[2], match[3], match[4]];
  const primary = [match[5], match[6], match[7]];
  const secondary = [match[8], match[9], match[10]];
  const tertiary = [match[11], match[12], match[13]];
  const total = [match[14], match[15], match[16]];
  const suffix = match[17].trim();

  let html = `<p class="question-intro">${intro}</p>`;
  html += '<div class="question-table-container"><table class="question-data-table">';
  html += '<thead><tr>';
  html += '<th class="diagonal-header"><span class="diagonal-top">Year</span><span class="diagonal-bottom">Sector</span></th>';
  years.forEach(y => html += `<th>${y}</th>`);
  html += '</tr></thead><tbody>';
  html += `<tr><td class="row-header"><em>Primary</em></td><td>${primary[0]}</td><td>${primary[1]}</td><td>${primary[2]}</td></tr>`;
  html += `<tr><td class="row-header"><em>Secondary</em></td><td>${secondary[0]}</td><td>${secondary[1]}</td><td>${secondary[2]}</td></tr>`;
  html += `<tr><td class="row-header"><em>Tertiary</em></td><td>${tertiary[0]}</td><td>${tertiary[1]}</td><td>${tertiary[2]}</td></tr>`;
  html += `<tr><td class="row-header"><em>(Total)</em></td><td>${total[0]}</td><td>${total[1]}</td><td>${total[2]}</td></tr>`;
  html += '</tbody></table></div>';

  if (suffix) html += `<div class="question-sub">${suffix}</div>`;
  return html;
}

/* ============================================================
   GDP PIE CHART QUESTION FORMATTER
   ============================================================ */
function formatGDPPieChartQuestion(text) {
  const introPattern = /^(.*?(?:charts? below show|following charts? show)[^.]*\.)/is;
  const introMatch = text.match(introPattern);
  if (!introMatch) return null;

  const intro = introMatch[1].trim();
  let remaining = text.substring(introMatch[0].length);

  const dataPattern = /Year\s+(\d{4})\s+Tertiary\s+production\s+\(([\d.]+)%\)\s+Secondary\s+production\s+\(([\d.]+)%\)\s+Primary\s+production\s+\(([\d.]+)%\)/gi;

  const charts = [];
  let match;
  while ((match = dataPattern.exec(remaining)) !== null) {
    charts.push({
      year: match[1],
      tertiary: parseFloat(match[2]),
      secondary: parseFloat(match[3]),
      primary: parseFloat(match[4])
    });
  }

  if (charts.length < 2) return null;

  const suffixPattern = /(?:Based on the above|From the above|According to the above)[^]*$/i;
  const suffixMatch = remaining.match(suffixPattern);
  const suffix = suffixMatch ? suffixMatch[0].trim() : '';

  function createPieChart(data) {
    const tertiary = data.tertiary;
    const secondary = data.secondary;
    const primary = data.primary;

    const minPrimaryVisual = 4;
    const visualPrimary = Math.max(primary, minPrimaryVisual);
    const remainingActual = tertiary + secondary;
    const remainingVisual = 100 - visualPrimary;
    const visualTertiary = (tertiary / remainingActual) * remainingVisual;
    const visualSecondary = (secondary / remainingActual) * remainingVisual;

    const tertiaryEnd = visualTertiary;
    const secondaryEnd = tertiaryEnd + visualSecondary;

    const gradient = `conic-gradient(
      #e5e7eb 0% ${tertiaryEnd}%,
      #6b7280 ${tertiaryEnd}% ${secondaryEnd}%,
      #1f2937 ${secondaryEnd}% 100%
    )`;

    return `
      <div class="pie-chart-wrapper">
        <div class="pie-chart" style="background: ${gradient};"></div>
        <div class="pie-chart-label">Year ${data.year}</div>
        <div class="pie-legend">
          <div class="pie-legend-item">
            <div class="pie-legend-color" style="background: #e5e7eb;"></div>
            <div class="pie-legend-text"><em>Tertiary</em> production (${tertiary}%)</div>
          </div>
          <div class="pie-legend-item">
            <div class="pie-legend-color" style="background: #6b7280;"></div>
            <div class="pie-legend-text"><em>Secondary</em> production (${secondary}%)</div>
          </div>
          <div class="pie-legend-item">
            <div class="pie-legend-color" style="background: #1f2937;"></div>
            <div class="pie-legend-text"><em>Primary</em> production (${primary}%)</div>
          </div>
        </div>
      </div>
    `;
  }

  let html = `<p class="question-intro">${intro}</p>`;
  html += '<div class="pie-charts-container">';
  charts.forEach(chart => { html += createPieChart(chart); });
  html += '</div>';

  if (suffix) html += `<div class="question-sub">${suffix}</div>`;
  return html;
}

/* ============================================================
   EMPLOYMENT PERCENTAGE TABLE FORMATTER
   % of total employment In YYYY In YYYY
   ============================================================ */
function formatEmploymentPercentageTable(text) {
  const pattern = /^(.*?(?:Study the following information|following information)[^:]*:)\s*%\s*of\s+total\s+employment\s+In\s+(\d{4})\s+In\s+(\d{4})\s+Primary\s+production\s+(\d+)\s+(\d+)\s+Secondary\s+production\s+(\d+)\s+(\d+)\s+Tertiary\s+production\s+(\d+)\s+(\d+)\s+\(Total\)\s+(\d+)\s+(\d+)\s+(.*?)$/is;

  const match = text.match(pattern);
  if (!match) return null;

  const intro = match[1].trim();
  const year1 = match[2];
  const year2 = match[3];
  const primary = [match[4], match[5]];
  const secondary = [match[6], match[7]];
  const tertiary = [match[8], match[9]];
  const total = [match[10], match[11]];
  const suffix = match[12].trim();

  let html = `<p class="question-intro">${intro}</p>`;
  html += '<div class="question-table-container"><table class="question-data-table">';
  html += '<thead>';
  html += '<tr><th rowspan="2" style="border-bottom: 1px solid var(--tx1);"></th><th colspan="2" style="border-bottom: none;">% of total employment</th></tr>';
  html += `<tr><th>In ${year1}</th><th>In ${year2}</th></tr>`;
  html += '</thead><tbody>';
  html += `<tr><td class="row-header"><em>Primary production</em></td><td>${primary[0]}</td><td>${primary[1]}</td></tr>`;
  html += `<tr><td class="row-header"><em>Secondary production</em></td><td>${secondary[0]}</td><td>${secondary[1]}</td></tr>`;
  html += `<tr><td class="row-header"><em>Tertiary production</em></td><td>${tertiary[0]}</td><td>${tertiary[1]}</td></tr>`;
  html += `<tr><td class="row-header"><em>(Total)</em></td><td><em>${total[0]}</em></td><td><em>${total[1]}</em></td></tr>`;
  html += '</tbody></table></div>';

  if (suffix) html += `<div class="question-sub">${suffix}</div>`;
  return html;
}

/* ============================================================
   PRODUCTION STAGES DIAGRAM FORMATTER
   SVG-based interrelationship of three stages of production
   ============================================================ */
function formatProductionStagesDiagram(text) {
  const pattern = /^(.*?following diagram shows the interrelationship of the three stages of production\.)\s*(What do X and Y stand for respectively\??)/is;

  const match = text.match(pattern);
  if (!match) return null;

  const intro = match[1].trim();
  const question = match[2].trim();

  let html = `<p class="question-intro">${intro}</p>`;
  html += `
    <div class="production-diagram">
      <svg width="320" height="200" viewBox="0 0 320 200" style="overflow: visible;">
        <rect x="110" y="10" width="100" height="45" fill="var(--bg0)" stroke="var(--tx1)" stroke-width="2"/>
        <text x="160" y="28" text-anchor="middle" fill="var(--tx1)" font-size="12" font-style="italic">Primary</text>
        <text x="160" y="44" text-anchor="middle" fill="var(--tx1)" font-size="12" font-style="italic">Production</text>

        <text x="50" y="40" text-anchor="middle" fill="var(--tx1)" font-size="18" font-weight="600" font-style="italic">X</text>
        <text x="270" y="40" text-anchor="middle" fill="var(--tx1)" font-size="18" font-weight="600" font-style="italic">Y</text>

        <line x1="65" y1="50" x2="105" y2="35" stroke="var(--tx1)" stroke-width="1.5"/>
        <polygon points="105,35 97,32 100,40" fill="var(--tx1)"/>

        <line x1="215" y1="35" x2="255" y2="50" stroke="var(--tx1)" stroke-width="1.5"/>
        <polygon points="255,50 248,42 246,51" fill="var(--tx1)"/>

        <rect x="20" y="130" width="100" height="45" fill="var(--bg0)" stroke="var(--tx1)" stroke-width="2"/>
        <text x="70" y="148" text-anchor="middle" fill="var(--tx1)" font-size="12" font-style="italic">Secondary</text>
        <text x="70" y="164" text-anchor="middle" fill="var(--tx1)" font-size="12" font-style="italic">Production</text>

        <rect x="200" y="130" width="100" height="45" fill="var(--bg0)" stroke="var(--tx1)" stroke-width="2"/>
        <text x="250" y="148" text-anchor="middle" fill="var(--tx1)" font-size="12" font-style="italic">Tertiary</text>
        <text x="250" y="164" text-anchor="middle" fill="var(--tx1)" font-size="12" font-style="italic">Production</text>

        <line x1="90" y1="125" x2="130" y2="60" stroke="var(--tx1)" stroke-width="1.5"/>
        <polygon points="130,60 121,63 127,70" fill="var(--tx1)"/>

        <line x1="190" y1="60" x2="230" y2="125" stroke="var(--tx1)" stroke-width="1.5"/>
        <polygon points="230,125 224,116 220,124" fill="var(--tx1)"/>

        <line x1="195" y1="152" x2="125" y2="152" stroke="var(--tx1)" stroke-width="1.5"/>
        <polygon points="125,152 133,147 133,157" fill="var(--tx1)"/>

        <line x1="125" y1="165" x2="195" y2="165" stroke="var(--tx1)" stroke-width="1.5"/>
        <polygon points="195,165 187,160 187,170" fill="var(--tx1)"/>
      </svg>
    </div>
  `;
  html += `<div class="question-sub">${question}</div>`;
  return html;
}

/* ============================================================
   PRE-FORMATTED DATA RENDERERS
   These handle questions with pre-parsed `formatted` objects
   ============================================================ */
function renderTableFromFormatted(fmt) {
  let result = '';
  if (fmt.intro) result += `<p class="question-intro">${fmt.intro}</p>`;

  let tableHtml = '<div class="data-table-container"><table class="data-table"><thead><tr>';
  fmt.rows.forEach(row => {
    tableHtml += `<th>${row.name}${row.unit ? ` (${row.unit})` : ''}</th>`;
  });
  tableHtml += '</tr></thead><tbody>';

  const numCols = fmt.rows[0]?.data?.length || 0;
  for (let c = 0; c < numCols; c++) {
    tableHtml += '<tr>';
    fmt.rows.forEach(row => {
      tableHtml += `<td>${row.data[c] || ''}</td>`;
    });
    tableHtml += '</tr>';
  }
  tableHtml += '</tbody></table></div>';
  result += tableHtml;

  if (fmt.suffix) result += `<p class="question-suffix">${fmt.suffix.trim()}</p>`;
  return result;
}

function renderStatementsFromFormatted(fmt) {
  let html = '';
  if (fmt.stem) html += `<div class="question-stem">${fmt.stem}</div>`;
  if (fmt.subQuestion) html += `<div class="question-sub">${fmt.subQuestion}</div>`;
  html += '<div class="statement-list">';
  fmt.statements.forEach(s => {
    html += `<div class="statement-item"><span class="statement-num">(${s.num})</span><span class="statement-text">${s.text}</span></div>`;
  });
  html += '</div>';
  return html;
}

function renderDiagramFromFormatted(fmt) {
  let html = '';
  if (fmt.beforeText) html += `<p>${fmt.beforeText}</p>`;
  html += `<div class="diagram-container"><div class="diagram-box"><div class="diagram-parent">${fmt.parent}</div>`;
  if (fmt.children && fmt.children.length > 0) {
    html += '<div class="diagram-children">';
    fmt.children.forEach(child => {
      html += `<div class="diagram-child">${child}</div>`;
    });
    html += '</div>';
  }
  html += '</div></div>';
  if (fmt.afterText) html += `<p>${fmt.afterText}</p>`;
  return html;
}

/* ============================================================
   STATEMENTS-BASED QUESTION FORMATTER
   Handles (1) text (2) text (3) text patterns
   ============================================================ */
function formatStatementsQuestion(text) {
  const hasStatements = /\(1\)/.test(text) && /\(2\)/.test(text);
  if (!hasStatements) return safeMarkdown(text);

  const hasStatementFormat = /Statement\s*\(1\)/i.test(text);

  let stem = '';
  let subQuestion = '';
  let statementsText = text;
  const statements = [];

  const subQuestionPatterns = [
    /Which of the following.*?(?:correct|true|false|incorrect)\??$/i,
    /Which of the following.*?\??$/i,
    /Which of the above.*?(?:correct|true|false|incorrect)\??$/i,
    /Which of the above.*?\??$/i
  ];

  if (hasStatementFormat) {
    // Handle "Statement (1):" format
    const statementStartMatch = text.match(/Statement\s*\(1\)/i);
    if (statementStartMatch) {
      const startIdx = text.indexOf(statementStartMatch[0]);
      stem = text.substring(0, startIdx).trim();
      statementsText = text.substring(startIdx);
    }

    for (const pattern of subQuestionPatterns) {
      const match = statementsText.match(pattern);
      if (match) {
        subQuestion = match[0];
        statementsText = statementsText.substring(0, statementsText.lastIndexOf(match[0])).trim();
        break;
      }
    }

    const statementParts = statementsText.split(/Statement\s*\((\d+)\):?\s*/i);
    for (let i = 1; i < statementParts.length; i += 2) {
      const num = statementParts[i];
      let statementText = (statementParts[i + 1] || '').trim();
      statementText = statementText.replace(/[.,;:]+$/, '').trim();
      if (statementText) {
        statements.push({ num: num, text: statementText });
      }
    }
  } else {
    // Handle standard "(1) text (2) text" format
    const firstStatementIdx = text.search(/\(1\)\s*/);

    if (firstStatementIdx > 0) {
      const textBeforeStatements = text.substring(0, firstStatementIdx).trim();
      statementsText = text.substring(firstStatementIdx);

      const whichOfMatch = textBeforeStatements.match(/^(.*?[.!])\s*(Which of the following[^?]*\?)\s*$/is);
      if (whichOfMatch) {
        stem = whichOfMatch[1].trim();
        subQuestion = whichOfMatch[2].trim();
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

      const questionContextPatterns = [
        /([A-Z][^.!?]*(?:Which of the following|Which of the above)[^?]*\?)/i,
        /([A-Z][^(]*\?)\s*$/
      ];

      for (const pattern of questionContextPatterns) {
        const match = textAfterLastMarker.match(pattern);
        if (match) {
          const contextStart = textAfterLastMarker.indexOf(match[1]);
          if (contextStart > 5) {
            const trailingContext = match[1].trim();
            if (!stem) {
              stem = trailingContext;
            } else {
              stem = trailingContext + ' ' + stem;
            }
            statementsText = statementsText.substring(0, lastMarkerEnd + contextStart).trim();
            break;
          }
        }
      }
    }

    // Check for sub-question patterns trailing after statements
    for (const pattern of subQuestionPatterns) {
      const match = statementsText.match(pattern);
      if (match) {
        const matchIdx = statementsText.indexOf(match[0]);
        const textAfterMatch = statementsText.substring(matchIdx + match[0].length);
        if (!/\(\d+\)/.test(textAfterMatch)) {
          const beforeMatch = statementsText.substring(0, matchIdx);
          const lastStatementInBefore = beforeMatch.match(/\(\d+\)[^(]*$/);
          if (lastStatementInBefore) {
            const contextWithQuestion = statementsText.substring(matchIdx).trim();
            if (!stem) {
              stem = contextWithQuestion;
            } else {
              stem = contextWithQuestion;
            }
            statementsText = beforeMatch.trim();
          }
          break;
        }
      }
    }

    // Extract numbered statements
    const parts = statementsText.split(/\((\d+)\)\s*/);
    for (let i = 1; i < parts.length; i += 2) {
      const num = parts[i];
      let statementText = parts[i + 1] || '';
      statementText = statementText.trim().replace(/[.,;:]+$/, '');
      if (statementText) {
        statements.push({ num: num, text: statementText });
      }
    }

    // Post-process: check if last statement has embedded question context
    if (statements.length > 0 && !stem) {
      const lastStatement = statements[statements.length - 1];
      const lastText = lastStatement.text;

      const embeddedContextMatch = lastText.match(/^(.+?[a-z])\s+([A-Z][^.]*(?:Which of the following|Which of the above)[^?]*\?)$/i);
      if (embeddedContextMatch) {
        lastStatement.text = embeddedContextMatch[1].trim().replace(/[.,;:]+$/, '');
        stem = embeddedContextMatch[2].trim();
      } else {
        const questionAtEndMatch = lastText.match(/^(.+?[a-z])\s+([A-Z][^(]+\?)\s*$/);
        if (questionAtEndMatch && questionAtEndMatch[2].length > 20) {
          lastStatement.text = questionAtEndMatch[1].trim().replace(/[.,;:]+$/, '');
          stem = questionAtEndMatch[2].trim();
        }
      }
    }
  }

  if (statements.length === 0) return safeMarkdown(text);

  let html = '';
  if (stem) html += `<div class="question-stem">${stem}</div>`;
  html += '<div class="statement-list">';
  statements.forEach(s => {
    const numLabel = hasStatementFormat
      ? `Statement (${s.num}):`
      : `(${s.num})`;
    html += `<div class="statement-item"><span class="statement-num">${numLabel}</span><span class="statement-text">${s.text}</span></div>`;
  });
  html += '</div>';
  if (subQuestion) html += `<div class="question-sub">${subQuestion}</div>`;
  return html;
}

/* ============================================================
   DEMAND / SUPPLY SCHEDULE TABLE FORMATTER
   Handles: Price $X $Y ... Demand ... Supply ...
   Also: Price per unit $X ... Quantity demanded ... Quantity supplied ...
   Also: Unit price $X ... Demand ... Supply ...
   ============================================================ */
function formatDemandSupplyScheduleTable(text) {
  // Normalize thousand separators: "1 200" → "1200"
  let normalizedText = text.replace(/(\d)\s+(\d{3})(?!\d)/g, '$1$2');
  normalizedText = normalizedText.replace(/(\d)\s+(\d{3})(?!\d)/g, '$1$2');

  // Match price header: "Price per unit $20 $25 $30..." or "Unit price $4 $5 $6..." or "Price $2 $3..."
  const priceHeaderMatch = normalizedText.match(/(?:Price per unit|Unit [Pp]rice|Price)\s+(\$\d+(?:\s+\$\d+)+)/i);
  if (!priceHeaderMatch) return null;

  const priceHeaderStart = normalizedText.indexOf(priceHeaderMatch[0]);
  const introText = normalizedText.substring(0, priceHeaderStart).trim();
  const priceValues = priceHeaderMatch[1].match(/\$(\d+)/g).map(p => p.replace('$', ''));
  let afterPrices = normalizedText.substring(priceHeaderStart + priceHeaderMatch[0].length).trim();

  // Define row label patterns (order: first found in text)
  const rowDefs = [
    { pattern: /Quantity demanded\s*(?:\(units?\))?/i, label: 'Qty demanded' },
    { pattern: /Quantity supplied\s*(?:\(units?\))?/i, label: 'Qty supplied' },
    { pattern: /(?<![a-z])Demand(?:\s*\(units?\))?/i, label: 'Demand' },
    { pattern: /(?<![a-z])Supply(?:\s*\(units?\))?/i, label: 'Supply' }
  ];

  // Find all row labels and their positions
  const labelPositions = [];
  for (const rd of rowDefs) {
    const m = afterPrices.match(rd.pattern);
    if (m) {
      labelPositions.push({ label: rd.label, start: m.index, end: m.index + m[0].length });
    }
  }
  labelPositions.sort((a, b) => a.start - b.start);
  if (labelPositions.length < 1) return null;

  // Extract question suffix - text after all numbers following the last label
  let questionSuffix = '';
  const lastLabel = labelPositions[labelPositions.length - 1];
  const textAfterLastLabel = afterPrices.substring(lastLabel.end);
  
  // Find where the numbers end and the question text begins
  const suffixPatterns = [
    /(?:If |When |Suppose |The government|Which of the following|According to|Based on|The new |The total |Sellers|The above|The market|buyers)/i
  ];
  for (const sp of suffixPatterns) {
    const sm = textAfterLastLabel.match(sp);
    if (sm) {
      // Make sure there are actual numbers before the suffix
      const beforeSuffix = textAfterLastLabel.substring(0, sm.index);
      if (/\d/.test(beforeSuffix)) {
        questionSuffix = textAfterLastLabel.substring(sm.index).trim();
        break;
      }
    }
  }

  // Extract data for each row
  const rowLabels = [];
  const rowData = [];
  for (let i = 0; i < labelPositions.length; i++) {
    const lp = labelPositions[i];
    const nextStart = (i + 1 < labelPositions.length) ? labelPositions[i + 1].start : afterPrices.length;
    let dataSection = afterPrices.substring(lp.end, nextStart);
    
    // Remove suffix from data section if it's the last row
    if (i === labelPositions.length - 1 && questionSuffix) {
      const sfxIdx = dataSection.indexOf(questionSuffix);
      if (sfxIdx >= 0) {
        dataSection = dataSection.substring(0, sfxIdx);
      }
    }

    const values = dataSection.match(/\d+/g) || [];
    if (values.length > 0) {
      rowLabels.push(lp.label);
      rowData.push(values);
    }
  }

  if (rowLabels.length < 1) return null;

  // Build the table
  const numCols = priceValues.length;
  let html = '';
  if (introText) html += `<div class="question-stem">${introText}</div>`;
  html += '<div class="question-table-container"><table class="question-data-table">';
  html += '<thead><tr>';
  html += '<th class="row-header">Price ($)</th>';
  priceValues.forEach(v => { html += `<th class="data-cell">${v}</th>`; });
  html += '</tr></thead><tbody>';

  rowLabels.forEach((label, idx) => {
    html += '<tr>';
    html += `<td class="row-header"><strong>${label}</strong></td>`;
    const data = rowData[idx];
    for (let c = 0; c < numCols; c++) {
      html += `<td>${data[c] || ''}</td>`;
    }
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  if (questionSuffix) html += `<div class="question-sub">${questionSuffix}</div>`;
  return html;
}

/* ============================================================
   PRICE-VALUE TABLE FORMATTER
   Handles: "Price ($) 10 20 30 Sales revenue ($) 1000 1500 2000"
   Also: "Unit price ($) 5 6 7 8 Total expenditure ($) 25 30 35 40"
   ============================================================ */
function formatPriceValueTable(text) {
  let normalizedText = text.replace(/(\d)\s+(\d{3})(?!\d)/g, '$1$2');
  normalizedText = normalizedText.replace(/(\d)\s+(\d{3})(?!\d)/g, '$1$2');

  // Match pattern: "Price ($) vals... OtherHeader ($) vals..."
  const pattern = /^(.*?)((?:Price|Unit price)\s*\(\$\))\s+((?:\d+\s+)*\d+)\s+((?:Sales revenue|Total expenditure|Total revenue|Revenue)\s*\(\$\))\s+((?:\d+\s+)*\d+)\s*(.*?)$/is;
  const match = normalizedText.match(pattern);
  if (!match) return null;

  const intro = match[1].trim();
  const header1 = match[2].trim();
  const values1 = match[3].trim().split(/\s+/);
  const header2 = match[4].trim();
  const values2 = match[5].trim().split(/\s+/);
  const suffix = match[6].trim();

  const numCols = Math.min(values1.length, values2.length);
  if (numCols < 2) return null;

  let html = '';
  if (intro) html += `<div class="question-stem">${intro}</div>`;
  html += '<div class="question-table-container"><table class="question-data-table">';
  html += `<thead><tr><th class="row-header">${header1}</th>`;
  for (let i = 0; i < numCols; i++) html += `<th class="data-cell">${values1[i]}</th>`;
  html += '</tr></thead><tbody><tr>';
  html += `<td class="row-header"><strong>${header2}</strong></td>`;
  for (let i = 0; i < numCols; i++) html += `<td>${values2[i]}</td>`;
  html += '</tr></tbody></table></div>';
  if (suffix) html += `<div class="question-sub">${suffix}</div>`;
  return html;
}

/* ============================================================
   COST-OUTPUT TABLE FORMATTER
   Handles: "Output (unit) 1 2 3 Average cost ($) 5 6 7"
   Also: "Quantity (units) 1 2 3 Average cost ($) 5 6 7"
   Also multi-row: "Total output (units) ... Marginal cost ($) ... Average variable cost ($) ... Fixed cost ($) ..."
   ============================================================ */
function formatCostOutputTable(text) {
  let normalizedText = text.replace(/(\d)\s+(\d{3})(?!\d)/g, '$1$2');
  normalizedText = normalizedText.replace(/(\d)\s+(\d{3})(?!\d)/g, '$1$2');

  // Define possible row headers (order matters - first match wins for intro detection)
  const headerDefs = [
    { pattern: /Price\s*\(\$\)/i, label: 'Price ($)' },
    { pattern: /Total output\s*\(units?\)/i, label: 'Total output (units)' },
    { pattern: /Output\s*\(units?\)/i, label: 'Output (units)' },
    { pattern: /Quantity\s*\(units?\)/i, label: 'Quantity (units)' },
    { pattern: /Demand\s*\(units?\)/i, label: 'Demand (units)' },
    { pattern: /Supply\s*\(units?\)/i, label: 'Supply (units)' },
    { pattern: /Marginal cost\s*\(\$\)/i, label: 'Marginal cost ($)' },
    { pattern: /Average variable cost\s*\(\$\)/i, label: 'Avg. variable cost ($)' },
    { pattern: /Average cost\s*\(\$\)/i, label: 'Average cost ($)' },
    { pattern: /Total cost\s*\(\$\)/i, label: 'Total cost ($)' },
    { pattern: /Total cost of production\s*\(\$\)/i, label: 'Total cost ($)' },
    { pattern: /Fixed cost\s*\(\$\)/i, label: 'Fixed cost ($)' },
    { pattern: /Total variable cost\s*\(\$\)/i, label: 'Total var. cost ($)' },
    { pattern: /Average fixed cost\s*\(\$\)/i, label: 'Avg. fixed cost ($)' },
    { pattern: /Total revenue\s*\(\$\)/i, label: 'Total revenue ($)' },
    { pattern: /Sales revenue\s*\(\$\)/i, label: 'Sales revenue ($)' },
    { pattern: /Total expenditure\s*\(\$\)/i, label: 'Total expenditure ($)' }
  ];

  // Find all matching headers and their positions
  const foundHeaders = [];
  for (const hd of headerDefs) {
    const m = normalizedText.match(hd.pattern);
    if (m) {
      foundHeaders.push({ label: hd.label, start: m.index, end: m.index + m[0].length, raw: m[0] });
    }
  }

  if (foundHeaders.length < 2) return null;
  foundHeaders.sort((a, b) => a.start - b.start);

  // Extract intro text (before first header)
  const intro = normalizedText.substring(0, foundHeaders[0].start).trim();

  // Extract data for each header row
  const rows = [];
  let questionSuffix = '';

  for (let i = 0; i < foundHeaders.length; i++) {
    const hd = foundHeaders[i];
    const nextStart = (i + 1 < foundHeaders.length) ? foundHeaders[i + 1].start : normalizedText.length;
    let dataSection = normalizedText.substring(hd.end, nextStart).trim();

    // For last row, extract suffix
    if (i === foundHeaders.length - 1) {
      const suffixPatterns = [
        /(?:If |When |Suppose |Given |Based |Which |According |The firm|The market|The profit|The average|The optional|The minimum|Of the market|we can conclude)[\s\S]*/i
      ];
      for (const sp of suffixPatterns) {
        const sm = dataSection.match(sp);
        if (sm) {
          const before = dataSection.substring(0, sm.index);
          if (/\d/.test(before)) {
            questionSuffix = dataSection.substring(sm.index).trim();
            dataSection = before.trim();
          }
          break;
        }
      }
    }

    const values = dataSection.match(/[\d.]+/g) || [];
    if (values.length > 0) {
      rows.push({ label: hd.label, data: values });
    }
  }

  if (rows.length < 2) return null;

  const numCols = Math.min(...rows.map(r => r.data.length));
  if (numCols < 2) return null;

  let html = '';
  if (intro) html += `<div class="question-stem">${intro}</div>`;
  html += '<div class="question-table-container"><table class="question-data-table">';
  html += '<thead><tr>';
  html += `<th class="row-header">${rows[0].label}</th>`;
  rows[0].data.slice(0, numCols).forEach(v => { html += `<th class="data-cell">${v}</th>`; });
  html += '</tr></thead><tbody>';
  for (let i = 1; i < rows.length; i++) {
    html += '<tr>';
    html += `<td class="row-header"><strong>${rows[i].label}</strong></td>`;
    rows[i].data.slice(0, numCols).forEach(v => { html += `<td>${v}</td>`; });
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  if (questionSuffix) html += `<div class="question-sub">${questionSuffix}</div>`;
  return html;
}

/* ============================================================
   DEMAND / SUPPLY SCHEDULE TABLE FORMATTER (NO $ SIGN)
   Handles: "Price 5 4 3 2 1 Demand 10 12 15 20 27 Supply 25 20 15 10 5"
   ============================================================ */
function formatDemandSupplyScheduleNoDollar(text) {
  let normalizedText = text.replace(/(\d)\s+(\d{3})(?!\d)/g, '$1$2');
  normalizedText = normalizedText.replace(/(\d)\s+(\d{3})(?!\d)/g, '$1$2');

  // Match: "Price X Y Z ... Demand ... Supply ..."
  const priceMatch = normalizedText.match(/(?:^|[.\s])\s*(?:Price)\s+((?:\d+\s+)*\d+)\s+(?:Demand|Supply|Quantity demanded|Quantity supplied)/i);
  if (!priceMatch) return null;

  const priceStart = normalizedText.indexOf(priceMatch[0]);
  const introText = normalizedText.substring(0, priceStart).trim();
  const priceValues = priceMatch[1].trim().split(/\s+/);

  let afterPriceLabel = normalizedText.substring(priceStart + priceMatch[0].length);
  // Re-add the Demand/Supply label that was consumed by the match lookahead
  const labelMatch = normalizedText.substring(priceStart).match(/(?:Demand|Supply|Quantity demanded|Quantity supplied)/i);
  let afterPrices = normalizedText.substring(priceStart + priceMatch[0].length - (labelMatch ? labelMatch[0].length : 0));

  // Actually re-get from after price values
  const fullPriceSection = normalizedText.substring(priceStart).match(/Price\s+(?:\d+\s+)*\d+/i);
  if (!fullPriceSection) return null;
  afterPrices = normalizedText.substring(priceStart + fullPriceSection[0].length).trim();

  // Define row label patterns
  const rowDefs = [
    { pattern: /Quantity demanded\s*(?:\(units?\))?/i, label: 'Qty demanded' },
    { pattern: /Quantity supplied\s*(?:\(units?\))?/i, label: 'Qty supplied' },
    { pattern: /(?<![a-z])Demand(?:\s*\(units?\))?/i, label: 'Demand' },
    { pattern: /(?<![a-z])Supply(?:\s*\(units?\))?/i, label: 'Supply' }
  ];

  const labelPositions = [];
  for (const rd of rowDefs) {
    const m = afterPrices.match(rd.pattern);
    if (m) {
      labelPositions.push({ label: rd.label, start: m.index, end: m.index + m[0].length });
    }
  }
  labelPositions.sort((a, b) => a.start - b.start);
  if (labelPositions.length < 1) return null;

  // Find question suffix
  let questionSuffix = '';
  const lastLabel = labelPositions[labelPositions.length - 1];
  const textAfterLastLabel = afterPrices.substring(lastLabel.end);
  const suffixPatterns = [
    /(?:If |When |Suppose |The government|Which of the following|According to|Based on|The new |The total |Sellers|The above|The market|buyers)/i
  ];
  for (const sp of suffixPatterns) {
    const sm = textAfterLastLabel.match(sp);
    if (sm && /\d/.test(textAfterLastLabel.substring(0, sm.index))) {
      questionSuffix = textAfterLastLabel.substring(sm.index).trim();
      break;
    }
  }

  // Extract data
  const rowLabels = [];
  const rowData = [];
  for (let i = 0; i < labelPositions.length; i++) {
    const lp = labelPositions[i];
    const nextStart = (i + 1 < labelPositions.length) ? labelPositions[i + 1].start : afterPrices.length;
    let dataSection = afterPrices.substring(lp.end, nextStart);
    if (i === labelPositions.length - 1 && questionSuffix) {
      const sfxIdx = dataSection.indexOf(questionSuffix);
      if (sfxIdx >= 0) dataSection = dataSection.substring(0, sfxIdx);
    }
    const values = dataSection.match(/\d+/g) || [];
    if (values.length > 0) {
      rowLabels.push(lp.label);
      rowData.push(values);
    }
  }

  if (rowLabels.length < 1) return null;

  const numCols = priceValues.length;
  let html = '';
  if (introText) html += `<div class="question-stem">${introText}</div>`;
  html += '<div class="question-table-container"><table class="question-data-table">';
  html += '<thead><tr><th class="row-header">Price</th>';
  priceValues.forEach(v => { html += `<th class="data-cell">${v}</th>`; });
  html += '</tr></thead><tbody>';
  rowLabels.forEach((label, idx) => {
    html += '<tr>';
    html += `<td class="row-header"><strong>${label}</strong></td>`;
    const data = rowData[idx];
    for (let c = 0; c < numCols; c++) html += `<td>${data[c] || ''}</td>`;
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  if (questionSuffix) html += `<div class="question-sub">${questionSuffix}</div>`;
  return html;
}

/* ============================================================
   MARKET DATA TABLE FORMATTER (Unit price $X ... Demand/Supply ...)
   Handles market of Good M tables etc.
   ============================================================ */
function formatMarketDataTable(text) {
  let normalizedText = text.replace(/(\d)\s+(\d{3})(?!\d)/g, '$1$2');
  normalizedText = normalizedText.replace(/(\d)\s+(\d{3})(?!\d)/g, '$1$2');

  // Match: "Unit price Quantity demanded Quantity supplied $2 1200 400 $4 1000 600..."
  const headerMatch = normalizedText.match(/Unit price\s+(?:Quantity demanded|Demand)\s+(?:Quantity supplied|Supply)/i);
  if (!headerMatch) return null;

  const headerStart = normalizedText.indexOf(headerMatch[0]);
  const introText = normalizedText.substring(0, headerStart).trim();
  const afterHeaders = normalizedText.substring(headerStart + headerMatch[0].length).trim();

  // Extract data: alternating price/demand/supply values
  const dataPattern = /\$(\d+)\s+(\d+)\s+(\d+)/g;
  const prices = [], demands = [], supplies = [];
  let dm;
  while ((dm = dataPattern.exec(afterHeaders)) !== null) {
    prices.push(dm[1]);
    demands.push(dm[2]);
    supplies.push(dm[3]);
  }

  if (prices.length < 2) return null;

  // Find suffix
  const lastMatch = afterHeaders.match(/\$\d+\s+\d+\s+\d+/g);
  let questionSuffix = '';
  if (lastMatch) {
    const lastPos = afterHeaders.lastIndexOf(lastMatch[lastMatch.length - 1]);
    const suffixStart = lastPos + lastMatch[lastMatch.length - 1].length;
    questionSuffix = afterHeaders.substring(suffixStart).trim();
  }

  let html = '';
  if (introText) html += `<div class="question-stem">${introText}</div>`;
  html += '<div class="question-table-container"><table class="question-data-table">';
  html += '<thead><tr><th class="row-header">Unit price ($)</th>';
  prices.forEach(v => { html += `<th class="data-cell">${v}</th>`; });
  html += '</tr></thead><tbody>';
  html += '<tr><td class="row-header"><strong>Qty demanded</strong></td>';
  demands.forEach(v => { html += `<td>${v}</td>`; });
  html += '</tr><tr><td class="row-header"><strong>Qty supplied</strong></td>';
  supplies.forEach(v => { html += `<td>${v}</td>`; });
  html += '</tr></tbody></table></div>';
  if (questionSuffix) html += `<div class="question-sub">${questionSuffix}</div>`;
  return html;
}

/* ============================================================
   GINI COEFFICIENT TABLE FORMATTER
   ============================================================ */
function formatGiniCoefficientTable(text) {
  const pattern = /^(.*?(?:following table shows|table below shows)[^.]*\.)\s*(?:Year\s+)?(\d+)\s+(0\.\d+)\s+(?:Year\s+)?(\d+)\s+(0\.\d+)\s+(?:Year\s+)?(\d+)\s+(0\.\d+)\s+(?:Year\s+)?(\d+)\s+(0\.\d+)\s*(.*?)$/is;
  const match = text.match(pattern);
  if (!match) return null;

  const intro = match[1].trim();
  const years = [match[2], match[4], match[6], match[8]];
  const coefficients = [match[3], match[5], match[7], match[9]];
  const suffix = match[10].trim();

  let html = '';
  if (intro) html += `<div class="question-stem">${intro}</div>`;
  html += '<div class="question-table-container"><table class="question-data-table">';
  html += '<thead><tr><th class="row-header">Year</th>';
  years.forEach(y => { html += `<th class="data-cell">${y}</th>`; });
  html += '</tr></thead><tbody><tr>';
  html += '<td class="row-header"><strong>Gini Coefficient</strong></td>';
  coefficients.forEach(c => { html += `<td>${c}</td>`; });
  html += '</tr></tbody></table></div>';
  if (suffix) html += `<div class="question-sub">${suffix}</div>`;
  return html;
}

/* ============================================================
   INCOME COMPARISON TABLE FORMATTER
   Handles: Age / Income of women (HK$) / Income of men (HK$)
   ============================================================ */
function formatIncomeComparisonTable(text) {
  let normalizedText = text.replace(/(\d)\s+(\d{3})(?!\d)/g, '$1$2');
  normalizedText = normalizedText.replace(/(\d)\s+(\d{3})(?!\d)/g, '$1$2');

  const pattern = /^(.*?(?:following table shows|table below shows)[^.]*\.)\s*Age\s+Average annual income of women\s*\(HK\$\)\s*Average annual income of men\s*\(HK\$\)\s*([\d\s\-]+?)\s*(Which[\s\S]*?)$/is;
  const match = normalizedText.match(pattern);
  if (!match) return null;

  const intro = match[1].trim();
  const dataStr = match[2].trim();
  const suffix = match[3].trim();

  // Parse data rows: "20 - 29 122000 121000 50 - 59 482000 645000"
  const rowPattern = /(\d+\s*-\s*\d+)\s+(\d+)\s+(\d+)/g;
  const dataRows = [];
  let rm;
  while ((rm = rowPattern.exec(dataStr)) !== null) {
    dataRows.push({ age: rm[1].trim(), women: Number(rm[2]).toLocaleString(), men: Number(rm[3]).toLocaleString() });
  }

  if (dataRows.length === 0) return null;

  let html = '';
  if (intro) html += `<div class="question-stem">${intro}</div>`;
  html += '<div class="question-table-container"><table class="question-data-table">';
  html += '<thead><tr><th>Age</th><th>Avg. annual income of women (HK$)</th><th>Avg. annual income of men (HK$)</th></tr></thead><tbody>';
  dataRows.forEach(r => {
    html += `<tr><td>${r.age}</td><td>${r.women}</td><td>${r.men}</td></tr>`;
  });
  html += '</tbody></table></div>';
  if (suffix) html += `<div class="question-sub">${suffix}</div>`;
  return html;
}

/* ============================================================
   TESLA REGISTRATION TABLE FORMATTER
   ============================================================ */
function formatMonthlyDataTable(text) {
  const pattern = /^(.*?(?:following table shows|table below shows)[^.]*\.)\s*(Month\s+Number of new Tesla[\s\S]*?(?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s+\d+\s*)+)\s*(The Government[\s\S]*?)$/is;
  const match = text.match(pattern);
  if (!match) return null;

  let normalizedData = match[2].replace(/(\d)\s+(\d{3})(?!\d)/g, '$1$2');
  normalizedData = normalizedData.replace(/(\d)\s+(\d{3})(?!\d)/g, '$1$2');

  const intro = match[1].trim();
  const suffix = match[3].trim();

  const rowPattern = /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\s+(\d+)/gi;
  const rows = [];
  let rm;
  while ((rm = rowPattern.exec(normalizedData)) !== null) {
    rows.push({ month: rm[1], count: Number(rm[2]).toLocaleString() });
  }

  if (rows.length === 0) return null;

  let html = '';
  if (intro) html += `<div class="question-stem">${intro}</div>`;
  html += '<div class="question-table-container"><table class="question-data-table">';
  html += '<thead><tr><th>Month</th><th>Number of new registrations</th></tr></thead><tbody>';
  rows.forEach(r => {
    html += `<tr><td>${r.month}</td><td>${r.count}</td></tr>`;
  });
  html += '</tbody></table></div>';
  if (suffix) html += `<div class="question-sub">${suffix}</div>`;
  return html;
}

/* ============================================================
   TAXI FARE TABLE FORMATTER
   ============================================================ */
function formatTaxiFareTable(text) {
  const pattern = /^(.*?(?:correct after the adjustment|the following)[\s\S]*?(?:shown below|taxi fare)[.:]?\s*)(Existing taxi fare|First)[\s\S]*?(First \d+ kilometres?:\s*\$\d+[\s\S]*?Every subsequent[\s\S]*?:\s*\$[\d.]+)[\s\S]*?(First \d+ kilometres?:\s*\$\d+[\s\S]*?Every subsequent[\s\S]*?:\s*\$[\d.]+)\s*(.*?)$/is;
  const match = text.match(pattern);
  if (!match) return null;

  const intro = match[1].trim();
  const existing = match[3].trim();
  const adjusted = match[4].trim();
  const suffix = match[5].trim();

  let html = '';
  if (intro) html += `<div class="question-stem">${intro}</div>`;
  html += '<div class="firm-table-container"><table class="firm-table">';
  html += '<thead><tr><th></th><th>Existing taxi fare</th><th>Adjusted taxi fare</th></tr></thead>';
  html += '<tbody>';

  // Parse fare items
  const existingItems = existing.split(/\n|(?=Every)/);
  const adjustedItems = adjusted.split(/\n|(?=Every)/);
  const maxRows = Math.max(existingItems.length, adjustedItems.length);
  for (let i = 0; i < maxRows; i++) {
    const label = i === 0 ? 'Initial fare' : 'Subsequent';
    html += `<tr><td class="row-label">${label}</td><td>${(existingItems[i] || '').trim()}</td><td>${(adjustedItems[i] || '').trim()}</td></tr>`;
  }

  html += '</tbody></table></div>';
  if (suffix) html += `<div class="question-sub">${suffix}</div>`;
  return html;
}

/* ============================================================
   SUPERMARKET MARKET SHARE TABLE FORMATTER
   ============================================================ */
function formatMarketShareTable(text) {
  const pattern = /^(.*?(?:following table|table below)[^.]*\.)\s*(Name\s+Market share[\s\S]*?Total\s+100)\s*(.*?)$/is;
  const match = text.match(pattern);
  if (!match) return null;

  const intro = match[1].trim();
  const dataStr = match[2].trim();
  const suffix = match[3].trim();

  // Parse rows: "Name Market share (%) Wellcome 39.8 Parknshop 33.1..."
  const rows = [];
  const rowPattern = /([A-Z][A-Za-z]+(?:\s+[A-Za-z]+)*)\s+([\d.]+)/g;
  let rm;
  const skipLabels = ['Name', 'Market', 'Total'];
  while ((rm = rowPattern.exec(dataStr)) !== null) {
    if (!skipLabels.includes(rm[1].trim())) {
      rows.push({ name: rm[1].trim(), share: rm[2] + '%' });
    }
  }

  if (rows.length === 0) return null;

  let html = '';
  if (intro) html += `<div class="question-stem">${intro}</div>`;
  html += '<div class="question-table-container"><table class="question-data-table">';
  html += '<thead><tr><th>Name</th><th>Market share (%)</th></tr></thead><tbody>';
  rows.forEach(r => {
    html += `<tr><td>${r.name}</td><td>${r.share}</td></tr>`;
  });
  html += '<tr><td><strong>Total</strong></td><td><strong>100%</strong></td></tr>';
  html += '</tbody></table></div>';
  if (suffix) html += `<div class="question-sub">${suffix}</div>`;
  return html;
}

/* ============================================================
   MASTER FORMAT FUNCTION
   Applies the appropriate formatter based on question content
   This is the function called by the rest of the app.
   ============================================================ */
function formatQuestionText(text, formatted) {
  if (!text) return '';

  // If pre-formatted data exists, use it directly for faster rendering
  if (formatted && formatted.type && formatted.type !== 'text') {
    if (formatted.type === 'table') return renderTableFromFormatted(formatted);
    if (formatted.type === 'statements') return renderStatementsFromFormatted(formatted);
    if (formatted.type === 'diagram') return renderDiagramFromFormatted(formatted);
  }

  // Fallback to runtime parsing if no pre-formatted data

  // 1. Check for diagram patterns like [DIAGRAM: ...]
  const diagramMatch = text.match(/\[DIAGRAM:\s*([^\]]+)\]/i);
  if (diagramMatch) {
    return formatDiagramQuestion(text, diagramMatch);
  }

  // 2. Check for simple table patterns first (tables without parenthesized units)
  const simpleTablePatterns = [
    /No\.\s*of\s+workers\s+Average\s+output/i,
    /Number\s+of\s+workers.*(?:output|product)/i
  ];
  if (simpleTablePatterns.some(p => p.test(text))) {
    const result = formatSimpleTableQuestion(text);
    if (result) return result;
  }

  // 3. Check for Firm comparison table pattern (Firm X vs Firm Y) — BEFORE general table patterns
  if (/Firm [A-Z]\s+(?:Number of owners|Transfer of ownership|Liability|Legal status)/i.test(text)) {
    return formatFirmComparisonTable(text);
  }

  // 4. Check for Factory comparison table pattern (Factory A vs Factory B)
  if (/Factory [A-Z]\s+Factory [A-Z]\s+(?:Number of |Total (?:number of working hours|output))/i.test(text)) {
    return formatFactoryComparisonTable(text);
  }

  // 5. Check for System comparison table pattern (Old System vs New System)
  if (/Old System\s+New System\s+(?:Output per worker|Output with quality)/i.test(text)) {
    return formatSystemComparisonTable(text);
  }

  // 6. Check for Year comparison table pattern (Year 1 vs Year 2)
  if (/Year\s*1\s+Year\s*2\s+(?:Number of workers|Number of working hours|Quantity of output)/i.test(text)) {
    return formatYearComparisonTable(text);
  }

  // 7. Check for Country comparison table pattern (Country A vs Country B)
  if (/Country [A-Z]\s+Country [A-Z]\s+(?:Number of workers|Average working hours|Total output|Output per worker)/i.test(text)) {
    return formatCountryComparisonTable(text);
  }

  // 8. Check for Employment distribution table (Year Sector with years as columns)
  if (/Year\s+Sector\s+\d{4}\s+\d{4}\s+\d{4}\s+Primary/i.test(text)) {
    const result = formatEmploymentDistributionTable(text);
    if (result) return result;
  }

  // 9. Check for GDP contribution pie chart question
  if (/charts? below show.*contribution.*GDP.*by sectors/i.test(text) && /Tertiary\s+production\s+\([\d.]+%\)/i.test(text)) {
    const result = formatGDPPieChartQuestion(text);
    if (result) return result;
  }

  // 10. Check for Employment percentage table
  if (/%\s*of\s+total\s+employment\s+In\s+\d{4}\s+In\s+\d{4}/i.test(text) && /Primary\s+production\s+\d+\s+\d+/i.test(text)) {
    const result = formatEmploymentPercentageTable(text);
    if (result) return result;
  }

  // 11. Check for Production stages interrelationship diagram
  if (/following diagram shows the interrelationship of the three stages of production/i.test(text)) {
    const result = formatProductionStagesDiagram(text);
    if (result) return result;
  }

  // 11a. Check for Demand/Supply schedule tables (Price $X $Y ... Demand ... Supply ...)
  if (/(?:Price per unit|Unit [Pp]rice|Price)\s+\$\d+\s+\$\d+/.test(text) && /(?:Demand|Supply|Quantity demanded|Quantity supplied)/i.test(text)) {
    const result = formatDemandSupplyScheduleTable(text);
    if (result) return result;
  }

  // 11a2. Check for Demand/Supply schedule tables WITHOUT $ signs (Price 5 4 3 ... Demand ... Supply ...)
  if (/(?:^|[.\s:])Price\s+\d+\s+\d+\s+\d+/i.test(text) && /(?:Demand|Supply|Quantity demanded|Quantity supplied)/i.test(text) && !/\$\d+\s+\$\d+/.test(text)) {
    const result = formatDemandSupplyScheduleNoDollar(text);
    if (result) return result;
  }

  // 11a3. Check for Market data table (Unit price Qty demanded Qty supplied $X Y Z)
  if (/Unit price\s+(?:Quantity demanded|Demand)\s+(?:Quantity supplied|Supply)/i.test(text)) {
    const result = formatMarketDataTable(text);
    if (result) return result;
  }

  // 11b. Check for Price-Value tables (Price ($) 10 20 ... Sales revenue ($) 1000 ...)
  if (/(?:Price|Unit price)\s*\(\$\)\s*\d+/i.test(text) && /(?:Sales revenue|Total expenditure|Total revenue|Revenue)\s*\(\$\)/i.test(text)) {
    const result = formatPriceValueTable(text);
    if (result) return result;
  }

  // 11c. Check for Cost-Output tables with ($) or (units) headers
  // Matches: "Output (units) ... Average cost ($) ..." or "Price ($) ... Demand (units) ... Supply (units) ..."
  if ((/(?:Total output|Output|Quantity)\s*\(units?\)/i.test(text) && /(?:Marginal cost|Average (?:variable )?cost|Average cost|Total cost|Fixed cost|Total revenue|Sales revenue|Total expenditure)\s*\(\$\)/i.test(text)) ||
      (/Price\s*\(\$\)/i.test(text) && /(?:Demand|Supply)\s*\(units?\)/i.test(text)) ||
      (/(?:Price|Unit price)\s*\(\$\)/i.test(text) && /(?:Sales revenue|Total expenditure|Total revenue)\s*\(\$\)/i.test(text))) {
    const result = formatCostOutputTable(text);
    if (result) return result;
  }

  // 11d. Check for Gini Coefficient table
  if (/Gini coefficient/i.test(text) && /Year\s*\d+\s+0\.\d+/i.test(text)) {
    const result = formatGiniCoefficientTable(text);
    if (result) return result;
  }

  // 11e. Check for Income comparison table (HK$)
  if (/Average annual income of women\s*\(HK\$\)/i.test(text)) {
    const result = formatIncomeComparisonTable(text);
    if (result) return result;
  }

  // 11f. Check for Monthly data table (Tesla registrations etc.)
  if (/Month\s+Number of new Tesla/i.test(text)) {
    const result = formatMonthlyDataTable(text);
    if (result) return result;
  }

  // 11g. Check for Taxi fare comparison table
  if (/Existing taxi fare\s+Adjusted taxi fare/i.test(text)) {
    const result = formatTaxiFareTable(text);
    if (result) return result;
  }

  // 11h. Check for Market share table
  if (/Name\s+Market share\s*\(%?\)/i.test(text) && /Total\s+100/i.test(text)) {
    const result = formatMarketShareTable(text);
    if (result) return result;
  }

  // 12. Check for general table patterns (e.g., "Capital (units) Labour (units) 1 10 2 20...")
  const tablePatterns = [
    /(?:Capital|Labour|Machine|Output|Product|Cost|Units?|Quantity|Total|Average|Marginal|Fixed|Variable)\s*\([^)]+\).*?(?:\d+(?:\.\d+)?\s+){4,}/i,
    /input.*output.*relationship/i,
    /(?:schedule|table).*(?:shows|below).*\([^)]+\)/i,
    /following table.*\([^)]+\)/i,
    /No\.\s*of\s+workers.*Average\s+output/i,
    /Number\s+of\s+workers.*(?:output|product)/i,
    /(?:Machine|Machinery)\s*\([^)]+\).*?Labour\s*\([^)]+\)/i,
    /Average\s+Product\s+(?:of\s+)?(?:labour|labor)\s*\([^)]+\)/i
  ];
  if (tablePatterns.some(p => p.test(text))) {
    return formatTableQuestion(text);
  }

  // 13. Check for "The above case/situation/example..." pattern
  const aboveCaseMatch = text.match(/^(.*\.)\s*(The above (?:case|situation|example|scenario|event|policy|measure|building|project|news|information)s?\s+(?:is|are|was|were|shows?|demonstrates?|illustrates?|relates?|involves?|concerns?)[^?]*\??)\s*$/is);
  if (aboveCaseMatch) {
    const context = aboveCaseMatch[1].trim();
    const question = aboveCaseMatch[2].trim();
    return `<div class="question-stem">${context}</div><div class="question-sub">${question}</div>`;
  }

  // 14. Check for "Which of the following... the above..." pattern
  const whichAboveMatch = text.match(/^(.*\.)\s*(Which of the following[^?]*(?:the above|above case|above situation)[^?]*\?)\s*$/is);
  if (whichAboveMatch) {
    const context = whichAboveMatch[1].trim();
    const question = whichAboveMatch[2].trim();
    return `<div class="question-stem">${context}</div><div class="question-sub">${question}</div>`;
  }

  // 15. Check for "Based on the above information..." pattern
  const basedOnAboveMatch = text.match(/^(.*\.)\s*(Based on the above (?:information|case|situation|example|scenario)?[,\s]*[^.]*(?:can|will|would|should|is|are|has|have|could|may|might)[^.]*[._]+)\s*$/is);
  if (basedOnAboveMatch) {
    const context = basedOnAboveMatch[1].trim();
    const question = basedOnAboveMatch[2].trim();
    return `<div class="question-stem">${context}</div><div class="question-sub">${question}</div>`;
  }

  // 16. Check for "Study the following information and answer Question X:" pattern
  const studyInfoMatch = text.match(/^(Study the following information and answer Questions?\s*\d*[:\s]*)\s*(.*?)\s*(\(\d+\).*?(?:which of the (?:above|following)[^?]*\?|[Ww]hich of the above items[^?]*\?))\s*$/is);
  if (studyInfoMatch) {
    const context = studyInfoMatch[2].trim();
    const questionPart = studyInfoMatch[3].trim();

    let html = `<div class="question-stem">${context}</div>`;

    const statementsMatch = questionPart.match(/^(.*?)((?:which|Which) of the (?:above|following)[^?]*\?)\s*$/is);
    if (statementsMatch) {
      const statementsText = statementsMatch[1];
      const finalQuestion = statementsMatch[2];
      const parts = statementsText.split(/\((\d+)\)\s*/);
      html += '<div class="statement-list">';
      for (let i = 1; i < parts.length; i += 2) {
        const num = parts[i];
        let statementText = (parts[i + 1] || '').trim().replace(/[.,;:]+$/, '');
        if (statementText) {
          html += `<div class="statement-item"><span class="statement-num">(${num})</span><span class="statement-text">${statementText}</span></div>`;
        }
      }
      html += '</div>';
      html += `<div class="question-sub">${finalQuestion}</div>`;
    }
    return html;
  }

  // 17. Check for numbered statements pattern
  if (/\(1\)/.test(text) && /\(2\)/.test(text)) {
    return formatStatementsQuestion(text);
  }

  // 18. Default: use safe markdown
  return safeMarkdown(text);
}
