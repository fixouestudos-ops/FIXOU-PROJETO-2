import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.FIXOU_URL || 'https://fixouestudos.com.br';
const ACCOUNT_COUNT = 100;

const errorRate = new Rate('errors');
const conflictRate = new Rate('conflicts');
const totalRequests = new Counter('total_requests');
const homeDuration = new Trend('home_duration', true);
const sessionDuration = new Trend('session_duration', true);
const eventsDuration = new Trend('events_duration', true);
const progressGetDuration = new Trend('progress_get_duration', true);
const progressPutDuration = new Trend('progress_put_duration', true);

export const options = {
  setupTimeout: '120s',
  scenarios: {
    study_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '60s', target: 10 },
        { duration: '30s', target: 50 },
        { duration: '60s', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '60s', target: 100 },
        { duration: '15s', target: 0 },
      ],
      gracefulStop: '15s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    errors: ['rate<0.02'],
  },
};

const TEST_PASSWORD = 'LoadTest123!';

function extractCookie(headers) {
  const setCookie = headers['Set-Cookie'] || headers['set-cookie'];
  if (!setCookie) return '';
  const match = setCookie.match(/fixou_session=[^;]+/);
  return match ? match[0] : '';
}

function authHeaders(cookies) {
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'FIXOU-LoadTest/1.0',
    'Cookie': cookies || '',
  };
}

export function setup() {
  const accounts = [];
  const BATCH = 10;

  for (let batch = 0; batch < ACCOUNT_COUNT; batch += BATCH) {
    const batchEnd = Math.min(batch + BATCH, ACCOUNT_COUNT);
    const batchRequests = [];

    for (let i = batch; i < batchEnd; i++) {
      const idx = String(i + 1).padStart(3, '0');
      const email = `loadtest_v3_${idx}@loadtest.local`;
      batchRequests.push({
        method: 'POST',
        url: `${BASE_URL}/api/auth/login`,
        body: JSON.stringify({ email, password: TEST_PASSWORD }),
        params: {
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'FIXOU-LoadTest/1.0' },
          tags: { endpoint: 'login' },
          timeout: '10s',
        },
      });
    }

    const batchRes = http.batch(batchRequests);

    for (let j = 0; j < batchRes.length; j++) {
      const i = batch + j;
      const idx = String(i + 1).padStart(3, '0');
      const email = `loadtest_v3_${idx}@loadtest.local`;

      if (batchRes[j].status === 200) {
        const cookies = extractCookie(batchRes[j].headers);
        if (cookies) {
          let revision = 0;
          const progRes = http.get(`${BASE_URL}/api/progress`, {
            headers: authHeaders(cookies),
            tags: { endpoint: 'progress_get' },
            timeout: '10s',
          });
          if (progRes.status === 200) {
            try {
              const body = JSON.parse(progRes.body);
              if (body.progress?.revision != null) revision = body.progress.revision;
            } catch {}
          }
          accounts[i] = { email, cookies, revision };
        }
      }
    }

    sleep(0.2);
  }

  if (accounts.filter(Boolean).length < ACCOUNT_COUNT) {
    const missing = [];
    for (let i = 0; i < ACCOUNT_COUNT; i++) {
      if (!accounts[i]) {
        const idx = String(i + 1).padStart(3, '0');
        missing.push(`loadtest_v3_${idx}@loadtest.local`);
      }
    }
    console.error(`FATAL: ${missing.length} accounts not found in D1. Run prepare-accounts.mjs first.`);
    console.error('Missing:', missing.slice(0, 10).join(', '), missing.length > 10 ? '...' : '');
  }

  return { accounts: accounts.filter(Boolean) };
}

export default function (data) {
  const accounts = data.accounts;
  if (!accounts || accounts.length === 0) return;
  const account = accounts[__VU % accounts.length];

  group('1. Home', () => {
    const res = http.get(`${BASE_URL}/`, {
      headers: { 'User-Agent': 'FIXOU-LoadTest/1.0' },
      tags: { endpoint: 'home' },
      timeout: '10s',
    });
    totalRequests.add(1);
    homeDuration.add(res.timings.duration);
    check(res, { 'home 2xx': (r) => r.status >= 200 && r.status < 300 });
    if (res.status >= 400) errorRate.add(1); else errorRate.add(0);
  });

  sleep(Math.random() * 2 + 1);

  group('2. Session check', () => {
    const res = http.get(`${BASE_URL}/api/auth/session`, {
      headers: authHeaders(account.cookies),
      tags: { endpoint: 'session' },
      timeout: '10s',
    });
    totalRequests.add(1);
    sessionDuration.add(res.timings.duration);
    check(res, { 'session 200': (r) => r.status === 200 });
    if (res.status >= 400) errorRate.add(1); else errorRate.add(0);
  });

  sleep(Math.random() * 1 + 0.5);

  const iterationId = `loadtest:${__VU}:${__ITER}`;

  for (let i = 0; i < 3; i++) {
    group(`3.${i+1}. Question viewed`, () => {
      const res = http.post(`${BASE_URL}/api/events`, JSON.stringify({
        eventType: 'question_viewed',
        metadata: {
          sessionId: iterationId,
          questionId: `loadtest_q${i}`,
          subjectId: 'fis',
        },
      }), {
        headers: authHeaders(account.cookies),
        tags: { endpoint: 'events' },
        timeout: '10s',
      });
      totalRequests.add(1);
      eventsDuration.add(res.timings.duration);
      check(res, { 'events 202': (r) => r.status === 202 });
      if (res.status >= 400) errorRate.add(1); else errorRate.add(0);
    });

    sleep(Math.random() * 8 + 5);

    group(`3.${i+1}. Question answered`, () => {
      const correct = Math.random() > 0.5;
      const res = http.post(`${BASE_URL}/api/events`, JSON.stringify({
        eventType: correct ? 'question_correct' : 'question_incorrect',
        metadata: {
          sessionId: iterationId,
          questionId: `loadtest_q${i}`,
          subjectId: 'fis',
          seconds: Math.floor(Math.random() * 60 + 10),
        },
      }), {
        headers: authHeaders(account.cookies),
        tags: { endpoint: 'events' },
        timeout: '10s',
      });
      totalRequests.add(1);
      eventsDuration.add(res.timings.duration);
      check(res, { 'events 202': (r) => r.status === 202 });
      if (res.status >= 400) errorRate.add(1); else errorRate.add(0);
    });

    sleep(Math.random() * 2 + 1);
  }

  group('4. Progress GET', () => {
    const res = http.get(`${BASE_URL}/api/progress`, {
      headers: authHeaders(account.cookies),
      tags: { endpoint: 'progress_get' },
      timeout: '10s',
    });
    totalRequests.add(1);
    progressGetDuration.add(res.timings.duration);
    if (res.status === 200) {
      try {
        const body = JSON.parse(res.body);
        if (body.progress?.revision != null) {
          account.revision = body.progress.revision;
        }
      } catch {}
    }
    check(res, { 'progress GET 200': (r) => r.status === 200 });
    if (res.status >= 400) errorRate.add(1); else errorRate.add(0);
  });

  sleep(Math.random() * 1 + 0.5);

  group('5. Progress PUT', () => {
    const res = http.put(`${BASE_URL}/api/progress`, JSON.stringify({
      state: {
        version: 1,
        profile: { name: `Load Test ${__VU}` },
        settings: { dailyCount: 10 },
        xp: Math.floor(Math.random() * 1000),
        savedAt: Date.now(),
      },
      clientSavedAt: Date.now(),
      baseRevision: account.revision,
    }), {
      headers: authHeaders(account.cookies),
      tags: { endpoint: 'progress_put' },
      timeout: '10s',
    });
    totalRequests.add(1);
    progressPutDuration.add(res.timings.duration);
    if (res.status === 200) {
      try {
        const body = JSON.parse(res.body);
        if (body.revision != null) {
          account.revision = body.revision;
        }
      } catch {}
    }
    if (res.status === 409) {
      conflictRate.add(1);
      try {
        const body = JSON.parse(res.body);
        if (body.revision != null) {
          account.revision = body.revision;
        }
      } catch {}
    }
    check(res, { 'progress PUT 200 or 409': (r) => r.status === 200 || r.status === 409 });
    if (res.status >= 400 && res.status !== 409) errorRate.add(1); else errorRate.add(0);
  });

  sleep(Math.random() * 3 + 2);
}

export function handleSummary(data) {
  const m = data.metrics;
  const summary = {
    timestamp: new Date().toISOString(),
    url: BASE_URL,
    vus_max: m.vus_max?.value || 0,
    iterations: m.iterations?.value || 0,
    http_reqs: m.http_reqs?.value || 0,
    http_req_duration_p50: m.http_req_duration?.values?.['p(50)'] || 0,
    http_req_duration_p90: m.http_req_duration?.values?.['p(90)'] || 0,
    http_req_duration_p95: m.http_req_duration?.values?.['p(95)'] || 0,
    http_req_duration_p99: m.http_req_duration?.values?.['p(99)'] || 0,
    http_req_duration_max: m.http_req_duration?.values?.max || 0,
    http_req_failed: m.http_req_failed?.value || 0,
    errors: m.errors?.value || 0,
    conflicts: m.conflicts?.value || 0,
    http_reqs_per_second: m.http_reqs?.rate || 0,
    data_received: m.data_received?.value || 0,
    data_sent: m.data_sent?.value || 0,
  };

  const summaryPath = `tests/load/results-study-flow-${Date.now()}.json`;
  return {
    stdout: JSON.stringify(summary, null, 2),
    [summaryPath]: JSON.stringify(summary, null, 2),
  };
}
