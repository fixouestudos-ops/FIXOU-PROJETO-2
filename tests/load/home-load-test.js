import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.FIXOU_URL || 'https://fixouestudos.com.br';

const errorRate = new Rate('errors');
const sessionDuration = new Trend('session_duration', true);
const totalRequests = new Counter('total_requests');

export const options = {
  scenarios: {
    warmup: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '30s', target: 10 },
      ],
      gracefulStop: '10s',
      exec: 'homeScenario',
    },
    ramp_mid: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '60s', target: 50 },
      ],
      gracefulStop: '10s',
      exec: 'homeScenario',
      startTime: '90s',
    },
    ramp_high: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '60s', target: 100 },
      ],
      gracefulStop: '10s',
      exec: 'homeScenario',
      startTime: '180s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<3000'],
    errors: ['rate<0.02'],
    http_req_failed: ['rate<0.02'],
  },
};

function weightedRandom(endpoints) {
  const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const ep of endpoints) {
    r -= ep.weight;
    if (r <= 0) return ep;
  }
  return endpoints[endpoints.length - 1];
}

const UNAUTH_ENDPOINTS = [
  { method: 'GET', path: '/', weight: 40, name: 'home' },
  { method: 'GET', path: '/api/health', weight: 10, name: 'health' },
  { method: 'GET', path: '/api/auth/session', weight: 30, name: 'session_check' },
  { method: 'GET', path: '/index.html', weight: 15, name: 'index_html' },
  { method: 'GET', path: '/assets/fixou-logo.png', weight: 5, name: 'logo' },
];

export function homeScenario() {
  const ep = weightedRandom(UNAUTH_ENDPOINTS);
  const url = `${BASE_URL}${ep.path}`;
  const params = {
    headers: {
      'User-Agent': 'FIXOU-LoadTest/1.0',
      'Accept': 'text/html,application/json,*/*',
    },
    tags: { endpoint: ep.name },
    timeout: '10s',
  };

  const res = http.get(url, params);
  totalRequests.add(1);

  check(res, {
    'status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
    'status is not 5xx': (r) => r.status < 500,
    'status is not 429': (r) => r.status !== 429,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
    'response time < 5000ms': (r) => r.timings.duration < 5000,
  });

  if (res.status >= 400) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sessionDuration.add(res.timings.duration);

  const jitter = Math.random() * 2 + 0.5;
  sleep(jitter);
}

export function handleSummary(data) {
  const metrics = data.metrics;
  const summary = {
    timestamp: new Date().toISOString(),
    url: BASE_URL,
    vus_max: metrics.vus_max?.value || 0,
    iterations: metrics.iterations?.value || 0,
    http_reqs: metrics.http_reqs?.value || 0,
    http_req_duration_p50: metrics.http_req_duration?.values?.['p(50)'] || 0,
    http_req_duration_p90: metrics.http_req_duration?.values?.['p(90)'] || 0,
    http_req_duration_p95: metrics.http_req_duration?.values?.['p(95)'] || 0,
    http_req_duration_p99: metrics.http_req_duration?.values?.['p(99)'] || 0,
    http_req_duration_max: metrics.http_req_duration?.values?.max || 0,
    http_req_failed: metrics.http_req_failed?.value || 0,
    errors: metrics.errors?.value || 0,
    http_reqs_per_second: metrics.http_reqs?.rate || 0,
    data_received: metrics.data_received?.value || 0,
    data_sent: metrics.data_sent?.value || 0,
  };

  const summaryPath = `tests/load/results-home-${Date.now()}.json`;
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [summaryPath]: JSON.stringify(summary, null, 2),
  };
}

function textSummary(data, options) {
  const m = data.metrics;
  const lines = [
    '',
    '========================================',
    '  FIXOU LOAD TEST RESULTS',
    '========================================',
    `  URL:            ${BASE_URL}`,
    `  Timestamp:      ${new Date().toISOString()}`,
    `  Max VUs:        ${m.vus_max?.value || 0}`,
    `  Total Requests: ${m.http_reqs?.value || 0}`,
    `  Requests/s:     ${(m.http_reqs?.rate || 0).toFixed(2)}`,
    '',
    '  --- Latency ---',
    `  p50:            ${(m.http_req_duration?.values?.['p(50)'] || 0).toFixed(2)} ms`,
    `  p90:            ${(m.http_req_duration?.values?.['p(90)'] || 0).toFixed(2)} ms`,
    `  p95:            ${(m.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)} ms`,
    `  p99:            ${(m.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)} ms`,
    `  max:            ${(m.http_req_duration?.values?.max || 0).toFixed(2)} ms`,
    '',
    '  --- Errors ---',
    `  Failed:         ${((m.http_req_failed?.value || 0) * 100).toFixed(2)}%`,
    `  Error rate:     ${((m.errors?.value || 0) * 100).toFixed(2)}%`,
    '',
    '  --- Data ---',
    `  Received:       ${((m.data_received?.value || 0) / 1024 / 1024).toFixed(2)} MB`,
    `  Sent:           ${((m.data_sent?.value || 0) / 1024 / 1024).toFixed(2)} MB`,
    '========================================',
    '',
  ];
  return lines.join('\n');
}
