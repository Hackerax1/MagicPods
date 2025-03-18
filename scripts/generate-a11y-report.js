/**
 * Generates an HTML report from accessibility test results
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportDir = path.join(__dirname, '..', 'a11y-reports');

// Ensure reports directory exists
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Find all JSON report files
const reportFiles = fs.readdirSync(__dirname + '/../')
  .filter(file => file.startsWith('a11y-report-') && file.endsWith('.json'));

if (reportFiles.length === 0) {
  console.log('No accessibility report files found.');
  process.exit(0);
}

// Read and combine all reports
const reports = reportFiles.map(file => {
  const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  try {
    const data = JSON.parse(content);
    return {
      name: file.replace('a11y-report-', '').replace(/\.json$/, ''),
      data
    };
  } catch (e) {
    console.error(`Error parsing ${file}:`, e);
    return null;
  }
}).filter(Boolean);

// Get current date for report name
const dateString = new Date().toISOString().split('T')[0];
const reportFileName = `accessibility-report-${dateString}.html`;
const reportPath = path.join(reportDir, reportFileName);

// Generate HTML report
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Audit Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #1a1a1a;
    }
    .report-header {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eaeaea;
    }
    .page-section {
      margin-bottom: 40px;
      padding: 20px;
      border: 1px solid #eaeaea;
      border-radius: 4px;
    }
    .violation {
      margin-bottom: 20px;
      padding: 15px;
      border-left: 4px solid #e74c3c;
      background-color: #fdf7f7;
    }
    .violation-critical {
      border-left-color: #e74c3c;
    }
    .violation-serious {
      border-left-color: #e67e22;
    }
    .violation-moderate {
      border-left-color: #f1c40f;
    }
    .violation-minor {
      border-left-color: #3498db;
    }
    .violation-header {
      display: flex;
      justify-content: space-between;
    }
    .impact {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .impact-critical {
      background-color: #e74c3c;
      color: white;
    }
    .impact-serious {
      background-color: #e67e22;
      color: white;
    }
    .impact-moderate {
      background-color: #f1c40f;
      color: #333;
    }
    .impact-minor {
      background-color: #3498db;
      color: white;
    }
    .nodes {
      margin-top: 10px;
      padding: 10px;
      background-color: #f9f9f9;
      border: 1px solid #eaeaea;
      border-radius: 4px;
      font-family: monospace;
      white-space: pre-wrap;
    }
    .summary {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    .summary-item {
      flex: 1;
      padding: 15px;
      border-radius: 4px;
      text-align: center;
    }
    .summary-violations {
      background-color: #fdf7f7;
      border: 1px solid #e74c3c;
    }
    .summary-passes {
      background-color: #f0faf0;
      border: 1px solid #2ecc71;
    }
    .summary-incomplete {
      background-color: #faf8f0;
      border: 1px solid #f1c40f;
    }
    .summary-inapplicable {
      background-color: #f0f0f0;
      border: 1px solid #bdc3c7;
    }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>Accessibility Audit Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>

  <div class="summary">
    <div class="summary-item summary-violations">
      <h3>Violations</h3>
      <p>${reports.reduce((sum, report) => sum + report.data.violations.length, 0)}</p>
    </div>
    <div class="summary-item summary-passes">
      <h3>Passes</h3>
      <p>${reports.reduce((sum, report) => sum + report.data.passes.length, 0)}</p>
    </div>
    <div class="summary-item summary-incomplete">
      <h3>Incomplete</h3>
      <p>${reports.reduce((sum, report) => sum + report.data.incomplete.length, 0)}</p>
    </div>
    <div class="summary-item summary-inapplicable">
      <h3>Inapplicable</h3>
      <p>${reports.reduce((sum, report) => sum + report.data.inapplicable.length, 0)}</p>
    </div>
  </div>

  ${reports.map(report => `
    <div class="page-section">
      <h2>Page: ${report.name}</h2>
      
      <h3>Violations</h3>
      ${report.data.violations.length === 0 ? '<p>No violations found! 🎉</p>' : ''}
      ${report.data.violations.map(violation => `
        <div class="violation violation-${violation.impact}">
          <div class="violation-header">
            <h4>${violation.id}: ${violation.help}</h4>
            <span class="impact impact-${violation.impact}">${violation.impact}</span>
          </div>
          <p>${violation.description}</p>
          <p><strong>Help:</strong> <a href="${violation.helpUrl}" target="_blank">${violation.helpUrl}</a></p>
          <div class="nodes">
            <p><strong>Affected elements (${violation.nodes.length}):</strong></p>
            ${violation.nodes.map(node => `<p>${node.html}</p>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `).join('')}
</body>
</html>
`;

fs.writeFileSync(reportPath, html);

// Also delete the original JSON files after processing
for (const file of reportFiles) {
  fs.unlinkSync(path.join(__dirname, '..', file));
}

console.log(`Accessibility report generated: ${reportPath}`);