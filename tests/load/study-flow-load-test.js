import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.FIXOU_URL || 'https://fixouestudos.com.br';

const errorRate = new Rate('errors');
const totalRequests = new Counter('total_requests');

export const options = {
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
      ],
      gracefulStop: '15s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    errors: ['rate<0.02'],
  },
};

function createUser() {
  const id = `loadtest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const email = `${id}@loadtest.local`;
  const password = 'LoadTest123!';

  const registerRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    name: 'Load Test User',
    email,
    password,
  }), {
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'FIXOU-LoadTest/1.0' },
    tags: { endpoint: 'register' },
    timeout: '10s',
  });

  if (registerRes.status === 201 || registerRes.status === 200) {
    const cookies = registerRes.headers['Set-Cookie'];
    return { email, password, cookies };
  }

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email,
    password,
  }), {
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'FIXOU-LoadTest/1.0' },
    tags: { endpoint: 'login' },
    timeout: '10s',
  });

  if (loginRes.status === 200) {
    const cookies = loginRes.headers['Set-Cookie'];
    return { email, password, cookies };
  }

  return null;
}

function getHeaders(user) {
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'FIXOU-LoadTest/1.0',
    'Cookie': user?.cookies || '',
  };
}

export function setup() {
  return {};
}

export default function () {
  group('Study Flow Simulation', () => {
    group('1. Load Home', () => {
      const res = http.get(`${BASE_URL}/`, {
        headers: { 'User-Agent': 'FIXOU-LoadTest/1.0' },
        tags: { endpoint: 'home' },
        timeout: '10s',
      });
      totalRequests.add(1);
      check(res, {
        'home status 2xx': (r) => r.status >= 200 && r.status < 300,
      });
      if (res.status >= 400) errorRate.add(1);
      else errorRate.add(0);
    });

    sleep(Math.random() * 2 + 1);

    group('2. Check Session', () => {
      const res = http.get(`${BASE_URL}/api/auth/session`, {
        headers: { 'User-Agent': 'FIXOU-LoadTest/1.0' },
        tags: { endpoint: 'session' },
        timeout: '10s',
      });
      totalRequests.add(1);
      check(res, {
        'session status 2xx': (r) => r.status >= 200 && r.status < 300,
      });
      if (res.status >= 400) errorRate.add(1);
      else errorRate.add(0);
    });

    sleep(Math.random() * 1 + 0.5);

    group('3. Health Check', () => {
      const res = http.get(`${BASE_URL}/api/health`, {
        headers: { 'User-Agent': 'FIXOU-LoadTest/1.0' },
        tags: { endpoint: 'health' },
        timeout: '10s',
      });
      totalRequests.add(1);
      check(res, {
        'health status 2xx': (r) => r.status >= 200 && r.status < 300,
      });
      if (res.status >= 400) errorRate.add(1);
      else errorRate.add(0);
    });

    sleep(Math.random() * 2 + 1);

    group('4. Load Static Assets', () => {
      const assets = [
        '/index.html',
        '/assets/fixou-logo.png',
      ];
      for (const asset of assets) {
        const res = http.get(`${BASE_URL}${asset}`, {
          headers: { 'User-Agent': 'FIXOU-LoadTest/1.0' },
          tags: { endpoint: 'static' },
          timeout: '10s',
        });
        totalRequests.add(1);
        check(res, {
          [`${asset} status 2xx`]: (r) => r.status >= 200 && r.status < 300,
        });
        if (res.status >= 400) errorRate.add(1);
        else errorRate.add(0);
      }
    });

    sleep(Math.random() * 3 + 2);

    group('5. Simulate Study Session', () => {
      for (let i = 0; i < 3; i++) {
        const qStart = http.get(`${BASE_URL}/api/auth/session`, {
          headers: { 'User-Agent': 'FIXOU-LoadTest/1.0' },
          tags: { endpoint: 'session_view' },
          timeout: '10s',
        });
        totalRequests.add(1);
        if (qStart.status >= 400) errorRate.add(1);
        else errorRate.add(0);

        sleep(Math.random() * 8 + 5);

        const eventRes = http.post(`${BASE_URL}/api/events`, JSON.stringify({
          eventType: 'question_viewed',
          metadata: {
            sessionId: `loadtest_${Date.now()}`,
            questionId: `loadtest_q${i}`,
          },
        }), {
          headers: getHeaders(),
          tags: { endpoint: 'events' },
          timeout: '10s',
        });
        totalRequests.add(1);
        if (eventRes.status >= 400) errorRate.add(1);
        else errorRate.add(0);

        sleep(Math.random() * 3 + 1);

        const answerRes = http.post(`${BASE_URL}/api/events`, JSON.stringify({
          eventType: 'question_answered',
          metadata: {
            sessionId: `loadtest_${Date.now()}`,
            questionId: `loadtest_q${i}`,
            correct: Math.random() > 0.5,
          },
        }), {
          headers: getHeaders(),
          tags: { endpoint: 'events' },
          timeout: '10s',
        });
        totalRequests.add(1);
        if (answerRes.status >= 400) errorRate.add(1);
        else errorRate.add(0);

        sleep(Math.random() * 2 + 1);
      }
    });
  });

  sleep(Math.random() * 5 + 3);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data.metrics, null, 2),
  };
}
