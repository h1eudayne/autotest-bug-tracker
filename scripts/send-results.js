const fs = require('fs');
const path = require('path');

// Script to parse Playwright test results and send to n8n webhook
async function sendResults() {
  const resultsPath = path.join(__dirname, '..', 'test-results.json');
  
  if (!fs.existsSync(resultsPath)) {
    console.log('No test-results.json found. Skipping webhook.');
    return;
  }

  const rawResults = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  
  // Parse Playwright JSON report into simplified format
  const testResults = [];
  
  if (rawResults.suites) {
    for (const suite of rawResults.suites) {
      for (const spec of (suite.specs || [])) {
        for (const testCase of (spec.tests || [])) {
          const result = testCase.results?.[0] || {};
          testResults.push({
            test: spec.title,
            status: result.status || 'unknown',
            duration: result.duration || 0,
            error: result.error?.message || null,
            file: spec.file || suite.file || 'unknown',
            line: spec.line || 0
          });
        }
      }
      // Handle nested suites
      for (const nestedSuite of (suite.suites || [])) {
        for (const spec of (nestedSuite.specs || [])) {
          for (const testCase of (spec.tests || [])) {
            const result = testCase.results?.[0] || {};
            testResults.push({
              test: spec.title,
              status: result.status || 'unknown',
              duration: result.duration || 0,
              error: result.error?.message || null,
              file: spec.file || nestedSuite.file || 'unknown',
              line: spec.line || 0
            });
          }
        }
      }
    }
  }

  console.log(`Found ${testResults.length} test results:`);
  testResults.forEach(t => {
    console.log(`  [${t.status.toUpperCase()}] ${t.test}`);
  });

  // Send to n8n webhook
  const webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/test-results';
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: 'web-login',
        timestamp: new Date().toISOString(),
        total: testResults.length,
        passed: testResults.filter(t => t.status === 'passed').length,
        failed: testResults.filter(t => t.status === 'failed').length,
        results: testResults
      })
    });
    console.log(`Webhook response: ${response.status}`);
  } catch (err) {
    console.log(`Webhook send failed (n8n might not be running): ${err.message}`);
    // Also save failed results locally for bug tracking
  }

  // Always save parsed results locally
  const parsedPath = path.join(__dirname, '..', 'bugs', 'last-test-results.json');
  fs.mkdirSync(path.dirname(parsedPath), { recursive: true });
  fs.writeFileSync(parsedPath, JSON.stringify(testResults, null, 2));
  console.log(`Parsed results saved to ${parsedPath}`);

  // Auto-create bug entries for failed tests
  const bugsPath = path.join(__dirname, '..', 'bugs', 'bugs.json');
  let bugs = [];
  if (fs.existsSync(bugsPath)) {
    bugs = JSON.parse(fs.readFileSync(bugsPath, 'utf-8'));
  }

  const failedTests = testResults.filter(t => t.status === 'failed');
  for (const failed of failedTests) {
    const existingBug = bugs.find(b => b.title === failed.test && b.status === 'open');
    if (!existingBug) {
      bugs.push({
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        project: 'web-login',
        title: failed.test,
        severity: 'high',
        file: failed.file,
        line: failed.line,
        error: failed.error,
        status: 'open',
        createdAt: new Date().toISOString()
      });
    }
  }

  fs.writeFileSync(bugsPath, JSON.stringify(bugs, null, 2));
  console.log(`Bugs database updated: ${bugs.length} total bugs`);
}

sendResults().catch(console.error);
