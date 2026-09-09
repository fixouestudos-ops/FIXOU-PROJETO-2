import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.FIXOU_URL || 'https://fixouestudos.com.br';
const ACCOUNT_COUNT = 8;

const errorRate = new Rate('errors');
const totalRequests = new Counter('total_requests');
const homeDuration = new Trend('home_duration', true);
const sessionDuration = new Trend('session_duration', true);
const eventsDuration = new Trend('events_duration', true);
const progressGetDuration = new Trend('progress_get_duration', true);
const progressPutDuration = new Trend('progress_put_duration', true);

export const options = {
  scenarios: {
    study_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '60s', target: 10 },
        { duration: '30s', target: 50 },
        { duration: '90s', target: 50 },
        { duration: '30s', target: 0 },
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
  for (let i = 0; i < ACCOUNT_COUNT; i++) {
    const email = `loadtest_v2_${i}@loadtest.local`;
    const password = TEST_PASSWORD;
    let cookies = '';

    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email,
      password,
    }), {
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'FIXOU-LoadTest/1.0' },
      tags: { endpoint: 'login' },
      timeout: '10s',
    });

    if (loginRes.status === 200) {
      cookies = extractCookie(loginRes.headers);
    } else {
      const regRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
        name: `Load Test ${i}`,
        email,
        password,
      }), {
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'FIXOU-LoadTest/1.0' },
        tags: { endpoint: 'register' },
        timeout: '10s',
      });
      if (regRes.status === 201 || regRes.status === 200) {
        cookies = extractCookie(regRes.headers);
      }
    }

    if (cookies) {
      accounts.push({ email, password, cookies, revision: 0 });
    }
    sleep(1);
  }
  return { accounts };
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
    group(`4.${i+1}. Question viewed`, () => {
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

    group(`4.${i+1}. Question answered`, () => {
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

  group('5. Progress GET', () => {
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

  group('6. Progress PUT', () => {
    const res = http.put(`${BASE_URL}/api/progress`, JSON.stringify({
      state: {
        version: 1,
        profile: { name: 'Load Test' },
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
    check(res, { 'progress PUT 200': (r) => r.status === 200 });
    if (res.status >= 400) errorRate.add(1); else errorRate.add(0);
  });

  sleep(Math.random() * 3 + 2);
}

export function handleSummary(data) {
  return { stdout: '' };
}
