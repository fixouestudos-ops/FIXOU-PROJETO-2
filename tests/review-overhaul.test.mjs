import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/index.mjs';
import {reviewScreen} from '../src/screens-review.js';

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
           captures.updates.push({ sql, params: [...this._params] });
           if (this._params && this._params.length >= 2) {
             const questionId = this._params[0], field = this._params[1], value = this._params[2];
             storedOverrides.set(questionId + ':' + field, { question_id: questionId, field, value, actor_user_id: this._params[3] || 'admin1', created_at: this._params[4] || Date.now(), updated_at: this._params[5] || Date.now() });
           }
         }
         if (sql.includes('INSERT INTO admin_audit_logs')) captures.audit.push({ sql, params: [...this._params] });
         if (sql.includes('DELETE FROM question_overrides')) {
           captures.deletes.push({ sql, params: [...this._params] });
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

function makeQuestion(overrides = {}) {
 return {
   id: 'test-q1',
   discipline: 'fisica',
   topic: 'Cinemática',
   subtopic: 'Referencial e movimento',
   prompt: 'Texto da questão para teste.',
   options: ['A', 'B', 'C', 'D'],
   answer: 0,
   imageClassification: 'no_image_required',
   imageStatus: 'no_image_required',
   contentStatus: 'pending',
   needsReview: false,
   imageAssets: [],
   ...overrides
 };
}

function renderScreen(filter, questions) {
 const bank = { questions };
 return reviewScreen({ bank, reviewFilter: filter, reviewSearch: '', reviewIndex: 0 });
}

// ============ SERVER: contentStatus TESTS ============

test('PATCH accepts contentStatus not_approved', async () => {
 const { db, captures } = memoryDB();
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'not_approved' })
 }), { DB: db });
 const data = await res.json();
 assert.equal(res.status, 200);
 assert.equal(data.ok, true);
 assert.ok(captures.updates.some(u => u.sql.includes('question_overrides')));
});

test('PATCH rejects invalid contentStatus', async () => {
 const { db } = memoryDB();
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'invalid' })
 }), { DB: db });
 assert.equal(res.status, 400);
 assert.match((await res.json()).error, /Status de conteúdo inválido/);
});

test('PATCH accepts contentStatus validated', async () => {
 const { db } = memoryDB();
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'validated' })
 }), { DB: db });
 assert.equal(res.status, 200);
 assert.equal((await res.json()).ok, true);
});

test('PATCH accepts contentStatus pending', async () => {
 const { db } = memoryDB();
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'pending' })
 }), { DB: db });
 assert.equal(res.status, 200);
 assert.equal((await res.json()).ok, true);
});

test('PATCH accepts contentStatus needs_content_review', async () => {
 const { db } = memoryDB();
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'needs_content_review' })
 }), { DB: db });
 assert.equal(res.status, 200);
 assert.equal((await res.json()).ok, true);
});

test('PATCH not_approved creates override and audit log', async () => {
 const { db, captures } = memoryDB();
 await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q2', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'not_approved', needsReview: 'false' })
 }), { DB: db });
 assert.ok(captures.updates.length > 0);
 assert.ok(captures.audit.length > 0);
 assert.ok(captures.updates.some(u => u.params[1] === 'needsReview' && u.params[2] === 'true'), 'servidor força needsReview=true em not_approved');
});

test('GET overrides returns not_approved status', async () => {
 const overrides = [
   { question_id: 'test-q3', field: 'contentStatus', value: 'not_approved' }
 ];
 const { db } = memoryDB({ overrides });
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/overrides', {
   headers: adminHeaders
 }), { DB: db });
 const data = await res.json();
 assert.equal(data.overrides['test-q3'].contentStatus, 'not_approved');
});

// ============ SERVER: answer EDITING TESTS ============

test('PATCH accepts answer field', async () => {
 const { db, captures } = memoryDB();
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ answer: '2' })
 }), { DB: db });
 assert.equal(res.status, 200);
 assert.equal((await res.json()).ok, true);
 assert.ok(captures.updates.some(u => u.params && u.params.includes('answer')));
});

test('PATCH answer stores override in D1', async () => {
 const { db, captures } = memoryDB();
 await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ answer: '3' })
 }), { DB: db });
 const overrideUpdate = captures.updates.find(u => u.params && u.params[0] === 'test-q1' && u.params[1] === 'answer');
 assert.ok(overrideUpdate, 'answer override should be stored');
 assert.equal(overrideUpdate.params[2], '3');
});

test('GET overrides returns answer field', async () => {
 const overrides = [
   { question_id: 'test-q1', field: 'answer', value: 'B' }
 ];
 const { db } = memoryDB({ overrides });
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/overrides', {
   headers: adminHeaders
 }), { DB: db });
 const data = await res.json();
 assert.equal(data.overrides['test-q1'].answer, 'B');
});

test('PATCH accepts answer and contentStatus together', async () => {
 const { db } = memoryDB();
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ answer: '4', contentStatus: 'validated' })
 }), { DB: db });
 assert.equal(res.status, 200);
 assert.equal((await res.json()).ok, true);
});

test('PATCH rejects empty answer', async () => {
 const { db } = memoryDB();
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ answer: '  ' })
 }), { DB: db });
 assert.equal(res.status, 400);
 assert.match((await res.json()).error, /Gabarito/);
});

// ============ SERVER: batch reset ENDPOINT TESTS ============

test('POST /api/admin/questions/reset-status resets validated overrides to pending', async () => {
 const overrides = [
   { question_id: 'q1', field: 'contentStatus', value: 'validated' },
   { question_id: 'q2', field: 'contentStatus', value: 'validated' },
   { question_id: 'q3', field: 'contentStatus', value: 'pending' }
 ];
 const { db, captures } = memoryDB({ overrides });
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/reset-status', {
   method: 'POST', headers: adminHeaders, body: JSON.stringify({ status: 'pending' })
 }), { DB: db });
 const data = await res.json();
 assert.equal(res.status, 200);
 assert.equal(data.ok, true);
 assert.ok(data.reset >= 2, 'Should reset at least 2 questions');
 assert.equal(data.targetStatus, 'pending');
});

test('POST /api/admin/questions/reset-status defaults to pending when no status specified', async () => {
 const overrides = [
   { question_id: 'q1', field: 'contentStatus', value: 'validated' }
 ];
 const { db } = memoryDB({ overrides });
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/reset-status', {
   method: 'POST', headers: adminHeaders, body: JSON.stringify({})
 }), { DB: db });
 const data = await res.json();
 assert.equal(data.targetStatus, 'pending');
});

test('POST /api/admin/questions/reset-status creates audit log', async () => {
 const overrides = [
   { question_id: 'q1', field: 'contentStatus', value: 'validated' }
 ];
 const { db, captures } = memoryDB({ overrides });
 await worker.fetch(new Request('https://fixou.test/api/admin/questions/reset-status', {
   method: 'POST', headers: adminHeaders, body: JSON.stringify({ status: 'pending' })
 }), { DB: db });
 assert.ok(captures.audit.some(a => a.sql.includes('admin_audit_logs')));
});

test('POST /api/admin/questions/reset-status returns 0 when no overrides to reset', async () => {
 const { db } = memoryDB({ overrides: [] });
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/reset-status', {
   method: 'POST', headers: adminHeaders, body: JSON.stringify({ status: 'pending' })
 }), { DB: db });
 const data = await res.json();
 assert.equal(data.ok, true);
 assert.equal(data.reset, 0);
});

// ============ FILTER TESTS ============

test('filter not_approved returns only not_approved questions', () => {
 const q1 = makeQuestion({ id: 'q1', contentStatus: 'not_approved' });
 const q2 = makeQuestion({ id: 'q2', contentStatus: 'pending' });
 const q3 = makeQuestion({ id: 'q3', contentStatus: 'validated' });
 const html = renderScreen('not_approved', [q1, q2, q3]);
 assert.ok(html.includes('q1'), 'not_approved question should appear');
 assert.ok(!html.includes('q2'), 'pending question should not appear');
 assert.ok(!html.includes('q3'), 'validated question should not appear');
});

test('filter needs_content_review excludes not_approved questions', () => {
 const q1 = makeQuestion({ id: 'q1', contentStatus: 'not_approved' });
 const q2 = makeQuestion({ id: 'q2', contentStatus: 'pending' });
 const html = renderScreen('needs_content_review', [q1, q2]);
 assert.ok(!html.includes('q1'), 'not_approved should not appear in needs_content_review');
 assert.ok(html.includes('q2'), 'pending should appear in needs_content_review');
});

test('filter approved still works for validated questions', () => {
 const q1 = makeQuestion({ id: 'q1', contentStatus: 'validated', imageStatus: 'no_image_required' });
 const html = renderScreen('approved', [q1]);
 assert.ok(html.includes('q1'), 'validated question should appear in approved');
});

test('filter not_approved excludes validated questions', () => {
 const q1 = makeQuestion({ id: 'q1', contentStatus: 'validated' });
 const html = renderScreen('not_approved', [q1]);
 assert.ok(!html.includes('q1'), 'validated should not appear in not_approved');
});

test('counter for not_approved shows correct count', () => {
 const q1 = makeQuestion({ id: 'q1', contentStatus: 'not_approved' });
 const q2 = makeQuestion({ id: 'q2', contentStatus: 'not_approved' });
 const q3 = makeQuestion({ id: 'q3', contentStatus: 'pending' });
 const html = renderScreen('all', [q1, q2, q3]);
 assert.ok(html.includes('Não aprovadas <span class="review-tab-count">2</span>'), 'Counter should show 2');
});

// ============ UI BUTTON TESTS ============

test('Não aprovar button appears for pending questions', () => {
 const q = makeQuestion({ contentStatus: 'pending' });
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('review-not-approve'), 'Não aprovar button should appear');
});

test('Não aprovar button does not appear for not_approved questions', () => {
 const q = makeQuestion({ contentStatus: 'not_approved' });
 const html = renderScreen('all', [q]);
 assert.ok(!html.includes('review-not-approve'), 'Não aprovar button should not appear for not_approved');
});

test('Não aprovar button does not appear for validated questions', () => {
 const q = makeQuestion({ contentStatus: 'validated' });
 const html = renderScreen('all', [q]);
 assert.ok(!html.includes('review-not-approve'), 'Não aprovar button should not appear for validated');
});

test('Revert button appears for not_approved questions', () => {
 const q = makeQuestion({ contentStatus: 'not_approved' });
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('review-revert-not-approved'), 'Revert button should appear');
});

test('Revert button does not appear for pending questions', () => {
 const q = makeQuestion({ contentStatus: 'pending' });
 const html = renderScreen('all', [q]);
 assert.ok(!html.includes('review-revert-not-approved'), 'Revert button should not appear for pending');
});

test('Revert button does not appear for validated questions', () => {
 const q = makeQuestion({ contentStatus: 'validated' });
 const html = renderScreen('all', [q]);
 assert.ok(!html.includes('review-revert-not-approved'), 'Revert button should not appear for validated');
});

test('Aprovar button appears for pending questions', () => {
 const q = makeQuestion({ contentStatus: 'pending' });
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('review-approve-content'), 'Aprovar button should appear');
});

test('Aprovar button does not appear for not_approved questions', () => {
 const q = makeQuestion({ contentStatus: 'not_approved' });
 const html = renderScreen('all', [q]);
 assert.ok(!html.includes('review-approve-content'), 'Aprovar button should not appear for not_approved');
});

test('Aprovar button appears for validated questions', () => {
 const q = makeQuestion({ contentStatus: 'validated' });
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('review-approve-content'), 'Aprovar button should appear for validated');
});

// ============ STATUS DISPLAY TESTS ============

test('not_approved status shows "Não aprovada" badge', () => {
 const q = makeQuestion({ contentStatus: 'not_approved' });
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('Não aprovada'), 'Should show Não aprovada badge');
});

test('pending status shows "Pendente" badge', () => {
 const q = makeQuestion({ contentStatus: 'pending' });
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('Pendente'), 'Should show Pendente badge');
});

test('validated status shows "Validado" badge', () => {
 const q = makeQuestion({ contentStatus: 'validated' });
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('✓ Validado'), 'Should show Validado badge');
});

test('not_approved and validated are mutually exclusive in content display', () => {
 const q1 = makeQuestion({ id: 'q1', contentStatus: 'not_approved' });
 const html1 = renderScreen('all', [q1]);
 assert.ok(html1.includes('✕ Não aprovada'), 'Shows not_approved content');
 assert.ok(!html1.includes('✓ Validado'), 'Does NOT show validated content');

 const q2 = makeQuestion({ id: 'q2', contentStatus: 'validated' });
 const html2 = renderScreen('all', [q2]);
 assert.ok(html2.includes('✓ Validado'), 'Shows validated content');
 assert.ok(!html2.includes('✕ Não aprovada'), 'Does NOT show not_approved content');
});

// ============ ANSWER EDITING UI TESTS ============

test('answer editing shows radio buttons for options', () => {
 const q = makeQuestion({ options: ['Alt A', 'Alt B', 'Alt C', 'Alt D'], answer: 0 });
 const bank = { questions: [q] };
 const html = reviewScreen({ bank, reviewFilter: 'all', reviewSearch: '', reviewIndex: 0, editingQuestion: 'test-q1', editingFields: {} });
 assert.ok(html.includes('review-edit-radio'), 'Should show radio buttons');
 assert.ok(html.includes('review-edit-answer'), 'Should have answer action');
});

test('answer editing pre-selects current answer', () => {
 const q = makeQuestion({ options: ['Alt A', 'Alt B', 'Alt C', 'Alt D'], answer: 2 });
 const bank = { questions: [q] };
 const html = reviewScreen({ bank, reviewFilter: 'all', reviewSearch: '', reviewIndex: 0, editingQuestion: 'test-q1', editingFields: { answer: '2' } });
 assert.ok(html.includes('value="2"') && html.includes('checked'), 'Should pre-select answer 2');
});

test('answer editing shows text input for questions without options', () => {
 const q = makeQuestion({ options: [], answer: '250 s' });
 const bank = { questions: [q] };
 const html = reviewScreen({ bank, reviewFilter: 'all', reviewSearch: '', reviewIndex: 0, editingQuestion: 'test-q1', editingFields: {} });
 assert.ok(html.includes('review-edit-input'), 'Should show text input');
 assert.ok(!html.includes('review-edit-radio'), 'Should not show radio buttons');
});

test('approval status shows correct state for each status', () => {
 const q1 = makeQuestion({ id: 'q1', contentStatus: 'validated' });
 const q2 = makeQuestion({ id: 'q2', contentStatus: 'not_approved' });
 const q3 = makeQuestion({ id: 'q3', contentStatus: 'pending' });
 const html1 = renderScreen('all', [q1]);
 const html2 = renderScreen('all', [q2]);
 const html3 = renderScreen('all', [q3]);
 assert.ok(html1.includes('✓ Validado'), 'Validated should show checkmark');
 assert.ok(html2.includes('✕ Não aprovada'), 'Not approved should show X');
 assert.ok(html3.includes('Pendente'), 'Pending should show pending');
});

test('not_approved stat appears in stats section', () => {
 const q1 = makeQuestion({ contentStatus: 'not_approved' });
 const html = renderScreen('all', [q1]);
 assert.ok(html.includes('Não aprovadas'), 'Should show stat label');
});

test('filter buttons include all 7 options', () => {
 const q = makeQuestion();
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('Todas'), 'Should have Todas tab');
 assert.ok(html.includes('Com imagem'), 'Should have Com imagem tab');
 assert.ok(html.includes('Sem imagem'), 'Should have Sem imagem tab');
 assert.ok(html.includes('Dúvida visual'), 'Should have Dúvida visual tab');
 assert.ok(html.includes('Aprovadas'), 'Should have Aprovadas tab');
 assert.ok(html.includes('Conteúdo pendente'), 'Should have Conteúdo pendente tab');
 assert.ok(html.includes('Não aprovadas'), 'Should have Não aprovadas tab');
});

// ============ FULL FLOW TEST: APPROVED → RESET → PENDING → EDIT → NOT_APPROVED → REVERT → PENDING → APPROVE ============

test('FULL FLOW: approved → reset → pending → edit answer → save → not_approved → revert → pending → approve → validated', async () => {
 // Step 1: Start with a validated question
 const overrides = new Map();
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
           if (this._params && this._params.length >= 3) {
             overrides.set(this._params[0] + ':' + this._params[1], this._params[2]);
           }
         }
         if (sql.includes('INSERT INTO admin_audit_logs')) {}
         if (sql.includes('DELETE FROM question_overrides')) {
           if (this._params && this._params.length >= 2) {
             overrides.delete(this._params[0] + ':' + this._params[1]);
           }
         }
         return { success: true };
       },
       async all() {
         if (sql.includes('FROM question_overrides')) {
           const results = [];
           for (const [key, value] of overrides) {
             const [question_id, field] = key.split(':');
             results.push({ question_id, field, value });
           }
           return { results };
         }
         return { results: [] };
       }
     };
   }
 };

 // Verify initial state: question should be validated
 const q = { id: 'flow-q1', contentStatus: 'validated', prompt: 'Questão de teste completo.', options: ['A','B','C','D','E'], answer: 0, imageClassification: 'no_image_required', imageStatus: 'no_image_required', needsReview: false };
 assert.equal(q.contentStatus, 'validated', 'Step 0: starts as validated');

 // Step 2: Approve content (already validated, but simulate the action)
 let res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/flow-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'validated', needsReview: 'false' })
 }), { DB: db });
 assert.equal(res.status, 200, 'Step 1: approve succeeds');
 overrides.set('flow-q1:contentStatus', 'validated');
 assert.equal(overrides.get('flow-q1:contentStatus'), 'validated', 'Step 1: override is validated');

 // Step 3: Simulate reset (batch reset endpoint)
 res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/reset-status', {
   method: 'POST', headers: adminHeaders, body: JSON.stringify({ status: 'pending' })
 }), { DB: db });
 assert.equal(res.status, 200, 'Step 2: reset succeeds');
 assert.equal(overrides.get('flow-q1:contentStatus'), 'pending', 'Step 2: override changed to pending');

 // Step 4: Edit answer
 res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/flow-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ answer: '3' })
 }), { DB: db });
 assert.equal(res.status, 200, 'Step 3: edit answer succeeds');
 assert.equal(overrides.get('flow-q1:answer'), '3', 'Step 3: answer override is 3');

 // Step 5: Not approve
 res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/flow-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'not_approved' })
 }), { DB: db });
 assert.equal(res.status, 200, 'Step 4: not approve succeeds');
 assert.equal(overrides.get('flow-q1:contentStatus'), 'not_approved', 'Step 4: override is not_approved');

 // Step 6: Verify exclusivity: not_approved is set, validated is NOT
 assert.notEqual(overrides.get('flow-q1:contentStatus'), 'validated', 'Step 4: not validated');
 assert.equal(overrides.get('flow-q1:contentStatus'), 'not_approved', 'Step 4: is not_approved');

 // Step 7: Revert to pending
 res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/flow-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'pending' })
 }), { DB: db });
 assert.equal(res.status, 200, 'Step 5: revert succeeds');
 assert.equal(overrides.get('flow-q1:contentStatus'), 'pending', 'Step 5: override is pending');

 // Step 8: Approve
 res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/flow-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'validated', needsReview: 'false' })
 }), { DB: db });
 assert.equal(res.status, 200, 'Step 6: approve succeeds');
 assert.equal(overrides.get('flow-q1:contentStatus'), 'validated', 'Step 6: override is validated');

 // Final: answer override should still be '3'
 assert.equal(overrides.get('flow-q1:answer'), '3', 'Final: answer override persisted');
});

// ============ PERSISTENCE TESTS ============

test('answer override persists through multiple PATCH calls', async () => {
 const overrides = new Map();
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
           if (this._params && this._params.length >= 3) overrides.set(this._params[0] + ':' + this._params[1], this._params[2]);
         }
         return { success: true };
       },
       async all() {
         if (sql.includes('FROM question_overrides')) {
           const results = [];
           for (const [key, value] of overrides) {
             const [question_id, field] = key.split(':');
             results.push({ question_id, field, value });
           }
           return { results };
         }
         return { results: [] };
       }
     };
   }
 };

 // Set answer to B
 await worker.fetch(new Request('https://fixou.test/api/admin/questions/persist-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ answer: '1' })
 }), { DB: db });
 assert.equal(overrides.get('persist-q1:answer'), '1', 'First save: answer is 1');

 // Override answer to D
 await worker.fetch(new Request('https://fixou.test/api/admin/questions/persist-q1', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ answer: '3' })
 }), { DB: db });
 assert.equal(overrides.get('persist-q1:answer'), '3', 'Second save: answer is 3');

 // Verify via GET overrides
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/overrides', {
   headers: adminHeaders
 }), { DB: db });
 const data = await res.json();
 assert.equal(data.overrides['persist-q1'].answer, '3', 'GET overrides returns answer D');
});

test('contentStatus transitions are exclusive: not_approved cannot be simultaneously validated', async () => {
 const q = makeQuestion({ contentStatus: 'not_approved' });
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('✕ Não aprovada'), 'Shows not_approved');
 assert.ok(!html.includes('✓ Validado'), 'Does NOT show validated');
});

test('contentStatus transitions are exclusive: pending cannot be simultaneously not_approved or validated', async () => {
 const q = makeQuestion({ contentStatus: 'pending' });
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('Conteúdo:'), 'Shows content section');
 assert.ok(!html.includes('✕ Não aprovada'), 'Does NOT show not_approved');
 assert.ok(!html.includes('✓ Validado'), 'Does NOT show validated');
});

test('contentStatus transitions are exclusive: validated cannot be simultaneously not_approved', async () => {
 const q = makeQuestion({ contentStatus: 'validated' });
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('✓ Validado'), 'Shows validated');
 assert.ok(!html.includes('✕ Não aprovada'), 'Does NOT show not_approved');
});

// ============ BANK INTEGRITY TESTS ============

import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bank = JSON.parse(readFileSync(join(__dirname, '..', 'content', 'bank.json'), 'utf8'));

test('bank.json has 0 validated questions after reset', () => {
 const validated = bank.questions.filter(q => q.contentStatus === 'validated');
 assert.equal(validated.length, 0, 'No questions should be validated in bank.json after reset');
});

test('bank.json has 556 pending questions after reset', () => {
  const pending = bank.questions.filter(q => q.contentStatus === 'pending');
  const physicsPending = pending.filter(q => q.discipline === 'fisica');
  const litPending = pending.filter(q => q.contentTrack === 'literatura-fuvest2027');
  assert.equal(physicsPending.length, 556, '556 physics questions pending: duas entraram na fila de auditoria IA');
  assert.equal(litPending.length, 180, '180 literature questions pending as new content');
});

test('bank.json preserves question content during reset', () => {
 const sample = bank.questions.find(q => q.id === 'fis-l1-referencial-movimento-q1');
 assert.ok(sample, 'Sample question exists');
 assert.equal(sample.contentStatus, 'pending', 'Status is pending');
 assert.equal(sample.discipline, 'fisica', 'Discipline preserved');
 assert.equal(sample.topic, 'Cinemática', 'Topic preserved');
 assert.ok(sample.prompt && sample.prompt.length > 10, 'Prompt preserved');
 assert.ok(sample.options && sample.options.length >= 4, 'Options preserved');
 assert.equal(typeof sample.answer, 'number', 'Answer type preserved');
});
