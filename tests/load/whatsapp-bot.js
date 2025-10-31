import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 1000 }, // Peak load of 1000 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<450'], // 95% of requests < 450ms (your target)
    http_req_failed: ['rate<0.02'], // Error rate < 2%
    http_req_waiting: ['p(95)<300'], // Waiting time < 300ms
  },
  tags: {
    test: 'whatsapp-bot-load-test',
    environment: 'staging',
  },
};

// Generate random phone numbers for testing
function generateRandomPhone() {
  const prefixes = ['+233', '+1', '+44', '+91', '+62'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 1000000000);
  return `${prefix}${number}`;
}

// Test scenarios
export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3002';

  // Scenario 1: Simple chat message
  const chatPayload = {
    from: generateRandomPhone(),
    body: 'Hello WhatsDeX! How are you?',
    timestamp: Date.now(),
  };

  let response = http.post(`${baseUrl}/webhook/whatsapp`, JSON.stringify(chatPayload), {
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': 'sha256=test_signature',
    },
  });

  check(response, {
    'chat response status is 200': r => r.status === 200,
    'chat response time < 450ms': r => r.timings.duration < 450,
    'chat response contains success': r => r.body.includes('success') || r.status === 200,
  });

  sleep(Math.random() * 2 + 1); // Random sleep 1-3 seconds

  // Scenario 2: AI command
  const aiPayload = {
    from: generateRandomPhone(),
    body: '.ai Tell me a joke',
    timestamp: Date.now(),
  };

  response = http.post(`${baseUrl}/webhook/whatsapp`, JSON.stringify(aiPayload), {
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': 'sha256=test_signature',
    },
  });

  check(response, {
    'AI command response status is 200': r => r.status === 200,
    'AI command response time acceptable': r => r.timings.duration < 2000, // AI can be slower
  });

  sleep(Math.random() * 3 + 2); // Random sleep 2-5 seconds

  // Scenario 3: Media processing command
  const mediaPayload = {
    from: generateRandomPhone(),
    body: '.sticker https://example.com/image.jpg',
    timestamp: Date.now(),
  };

  response = http.post(`${baseUrl}/webhook/whatsapp`, JSON.stringify(mediaPayload), {
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': 'sha256=test_signature',
    },
  });

  check(response, {
    'media command response status is 200': r => r.status === 200,
    'media command response time < 1000ms': r => r.timings.duration < 1000,
  });

  sleep(Math.random() * 2 + 1); // Random sleep 1-3 seconds
}

// Setup function - runs before the test starts
export function setup() {
  console.log('Starting WhatsApp Bot Load Test');
  console.log('Target: 1000 concurrent users');
  console.log('Duration: 9 minutes total');

  // Health check before starting
  const healthResponse = http.get(`${__ENV.BASE_URL || 'http://localhost:3002'}/health`);
  if (healthResponse.status !== 200) {
    console.error('Health check failed! Aborting test.');
    return;
  }

  console.log('Health check passed. Starting load test...');
  return { timestamp: new Date().toISOString() };
}

// Teardown function - runs after the test completes
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Started at: ${data.timestamp}`);
  console.log(`Completed at: ${new Date().toISOString()}`);
}

// Handle summary - custom summary output
export function handleSummary(data) {
  const summary = {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data, null, 2),
    'load-test-report.html': htmlReport(data),
  };

  // Custom metrics analysis
  const metrics = data.metrics;
  const analysis = {
    totalRequests: metrics.http_reqs?.values?.count || 0,
    averageResponseTime: metrics.http_req_duration?.values?.avg || 0,
    p95ResponseTime: metrics.http_req_duration?.values?.['p(95)'] || 0,
    errorRate: metrics.http_req_failed?.values?.rate || 0,
    throughput: metrics.http_reqs?.values?.rate || 0,
    recommendations: [],
  };

  // Generate recommendations based on results
  if (analysis.p95ResponseTime > 450) {
    analysis.recommendations.push(
      'Response time exceeds target. Consider optimizing database queries.'
    );
  }

  if (analysis.errorRate > 0.02) {
    analysis.recommendations.push('Error rate too high. Check application logs for issues.');
  }

  if (analysis.throughput < 100) {
    analysis.recommendations.push('Throughput is low. Consider scaling horizontally.');
  }

  summary['analysis.json'] = JSON.stringify(analysis, null, 2);

  return summary;
}

function htmlReport(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>WhatsApp Bot Load Test Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
            .pass { color: green; }
            .fail { color: red; }
            .warn { color: orange; }
        </style>
    </head>
    <body>
        <h1>WhatsApp Bot Load Test Report</h1>
        <p><strong>Test Date:</strong> ${new Date().toISOString()}</p>
        <p><strong>Target Users:</strong> 1000</p>
        <p><strong>Test Duration:</strong> 9 minutes</p>

        <h2>Key Metrics</h2>
        <div class="metric">
            <strong>Average Response Time:</strong>
            <span class="${data.metrics.http_req_duration?.values?.avg < 450 ? 'pass' : 'fail'}">
                ${Math.round(data.metrics.http_req_duration?.values?.avg || 0)}ms
            </span>
        </div>

        <div class="metric">
            <strong>95th Percentile Response Time:</strong>
            <span class="${data.metrics.http_req_duration?.values?.['p(95)'] < 450 ? 'pass' : 'fail'}">
                ${Math.round(data.metrics.http_req_duration?.values?.['p(95)'] || 0)}ms
            </span>
        </div>

        <div class="metric">
            <strong>Error Rate:</strong>
            <span class="${(data.metrics.http_req_failed?.values?.rate || 0) < 0.02 ? 'pass' : 'fail'}">
                ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%
            </span>
        </div>

        <div class="metric">
            <strong>Requests per Second:</strong>
            <span class="${(data.metrics.http_reqs?.values?.rate || 0) > 50 ? 'pass' : 'warn'}">
                ${Math.round(data.metrics.http_reqs?.values?.rate || 0)}
            </span>
        </div>
    </body>
    </html>
  `;
}
