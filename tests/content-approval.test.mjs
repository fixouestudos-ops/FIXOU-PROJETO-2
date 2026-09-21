import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/index.mjs';

function memoryDB({overrides=[]} = {}) {
 const captures = { inserts: [], updates: [], deletes: [], audit: [] };
 const storedOverrides = new Map();
 for (const o of overrides) {
   const key = o.question_id + ':' + o.field;
   storedOverrides.set(key, { question_id: o.question_id, field: o.field, value: o.value, actor_user_id: o.actor_user_id || 'admin1', created_at: o.created_at || Date.now(), updated_at: o.updated_at || Date.now() });
 }
 const db = {
   prepare(sql) {
     return {
       bind(...params) { this._params = params; return this; },
       async first() {
         if (sql.includes('FROM auth_sessions')) return { id: 'admin1', role: 'admin', plan: 'free', updated_at: 1, last_activity_at: Date.now() };
         return null;
       },
       async run() {
         if (sql.includes('INSERT INTO question_overrides') || sql.includes('DO UPDATE SET value')) {
           captures.updates.push({ sql });
           if (this._params && this._params.length >= 2) {
             const questionId = this._params[0], field = this._params[1], value = this._params[2];
             storedOverrides.set(questionId + ':' + field, { question_id: questionId, field, value, actor_user_id: this._params[3] || 'admin1', created_at: this._params[4] || Date.now(), updated_at: this._params[5] || Date.now() });
           }
         }
         if (sql.includes('INSERT INTO admin_audit_logs')) captures.audit.push({ sql });
         if (sql.includes('DELETE FROM question_overrides')) {
           captures.deletes.push({ sql });
           if (this._params && this._params.length >= 2) {
             storedOverrides.delete(this._params[0] + ':' + this._params[1]);
           }
         }
         return { success: true };
       },
       async all() {
         if (sql.includes('FROM question_overrides')) return { results: [...storedOverrides.values()] };
         return { results: [] };
       }
     };
   }
 };
 return { captures, db };
}

const adminHeaders = { cookie: 'fixou_session=token', 'content-type': 'application/json', origin: 'https://fixou.test' };

test('PATCH /api/admin/questions/:id accepts contentStatus field', async () => {
 const { db, captures } = memoryDB();
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/physics-l1-q001', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'validated' })
 }), { DB: db });
 const data = await res.json();
 assert.equal(res.status, 200);
 assert.equal(data.ok, true);
 assert.ok(captures.updates.some(u => u.sql.includes('question_overrides')));
 assert.ok(captures.audit.length > 0);
});

test('PATCH /api/admin/questions/:id accepts needsReview field', async () => {
 const { db, captures } = memoryDB();
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/physics-l1-q002', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ needsReview: 'false' })
 }), { DB: db });
 const data = await res.json();
 assert.equal(res.status, 200);
 assert.equal(data.ok, true);
});

test('PATCH /api/admin/questions/:id accepts both contentStatus and needsReview together', async () => {
 const { db } = memoryDB();
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/physics-l1-q003', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'validated', needsReview: 'false' })
 }), { DB: db });
 assert.equal(res.status, 200);
 assert.equal((await res.json()).ok, true);
});

test('PATCH /api/admin/questions/:id rejects invalid contentStatus', async () => {
 const { db } = memoryDB();
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/physics-l1-q001', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'invalid_status' })
 }), { DB: db });
 assert.equal(res.status, 400);
 assert.match((await res.json()).error, /Status de conteúdo inválido/);
});

test('PATCH /api/admin/questions/:id rejects invalid needsReview', async () => {
 const { db } = memoryDB();
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/physics-l1-q001', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ needsReview: 'maybe' })
 }), { DB: db });
 assert.equal(res.status, 400);
 assert.match((await res.json()).error, /needsReview/);
});

test('GET /api/admin/questions/overrides returns contentStatus and needsReview', async () => {
 const overrides = [
   { question_id: 'physics-l1-q001', field: 'contentStatus', value: 'validated' },
   { question_id: 'physics-l1-q001', field: 'needsReview', value: 'false' },
   { question_id: 'physics-l1-q002', field: 'contentStatus', value: 'needs_content_review' }
 ];
 const { db } = memoryDB({ overrides });
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/overrides', {
   headers: adminHeaders
 }), { DB: db });
 const data = await res.json();
 assert.equal(res.status, 200);
 assert.equal(data.ok, true);
 assert.equal(data.overrides['physics-l1-q001'].contentStatus, 'validated');
 assert.equal(data.overrides['physics-l1-q001'].needsReview, 'false');
 assert.equal(data.overrides['physics-l1-q002'].contentStatus, 'needs_content_review');
});

test('content approval persists: PATCH then GET returns approved state', async () => {
 const { db } = memoryDB();
 const patchRes = await worker.fetch(new Request('https://fixou.test/api/admin/questions/physics-l1-q010', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'validated', needsReview: 'false' })
 }), { DB: db });
 assert.equal(patchRes.status, 200);

 const getRes = await worker.fetch(new Request('https://fixou.test/api/admin/questions/overrides', {
   headers: adminHeaders
 }), { DB: db });
 const data = await getRes.json();
 assert.equal(data.overrides['physics-l1-q010'].contentStatus, 'validated');
 assert.equal(data.overrides['physics-l1-q010'].needsReview, 'false');
});

test('non-approved questions remain pending when no overrides exist', async () => {
 const { db } = memoryDB({ overrides: [] });
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/overrides', {
   headers: adminHeaders
 }), { DB: db });
 const data = await res.json();
 assert.equal(data.overrides['physics-l1-q999'], undefined);
});

test('admin audit log records contentStatus and needsReview fields', async () => {
 const { db, captures } = memoryDB();
 await worker.fetch(new Request('https://fixou.test/api/admin/questions/physics-l1-q005', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'validated', needsReview: 'false' })
 }), { DB: db });
 assert.ok(captures.audit.length > 0);
 assert.ok(captures.audit.some(a => a.sql.includes('admin_audit_logs')));
});
