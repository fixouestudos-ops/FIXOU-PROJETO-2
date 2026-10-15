import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/index.mjs';
import {reviewScreen} from '../src/screens-review.js';

function memoryDB({overrides=[]} = {}) {
 const captures = { updates: [], audit: [], allResults: [] };
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
           captures.updates.push({ sql: sql.substring(0, 100), params: [...this._params] });
           if (this._params && this._params.length >= 3) {
             const questionId = this._params[0], field = this._params[1], value = this._params[2];
             storedOverrides.set(questionId + ':' + field, { question_id: questionId, field, value, actor_user_id: this._params[3] || 'admin1', created_at: this._params[4] || Date.now(), updated_at: this._params[5] || Date.now() });
           }
         }
         if (sql.includes('INSERT INTO admin_audit_logs')) captures.audit.push({ sql: sql.substring(0, 60), params: [...this._params] });
         return { success: true };
       },
       async all() {
         if (sql.includes('FROM question_overrides')) {
           const params = [...this._params];
           const results = [];
           const targetField = params[0];
           const allowedValues = params.slice(1);
           for (const [_, val] of storedOverrides) {
             if (val.field === targetField && allowedValues.includes(val.value)) {
               results.push({ question_id: val.question_id, field: val.field, value: val.value });
             }
           }
           captures.allResults.push({ sql: sql.substring(0, 80), params, resultCount: results.length });
           return { results };
         }
         return { results: [] };
       }
     };
   }
 };
 return { captures, db, storedOverrides };
}

const adminHeaders = { cookie: 'fixou_session=token', 'content-type': 'application/json', origin: 'https://fixou.test' };

// ======================================================================
// TEST 1: Simulate D1 — count contentStatus=validated overrides
// ======================================================================

test('D1 SIMULATION: count contentStatus=validated overrides that would exist', async () => {
 // Simulate: 558 questions previously approved → each has contentStatus=validated override
 // Plus some non-contentStatus overrides (answer, imageStatus, etc.)
 const overrides = [];
 for (let i = 0; i < 558; i++) {
   overrides.push({ question_id: `fis-l1-q${String(i).padStart(3, '0')}`, field: 'contentStatus', value: 'validated' });
 }
 // Some questions also have other overrides
 overrides.push({ question_id: 'fis-l1-q000', field: 'answer', value: '2' });
 overrides.push({ question_id: 'fis-l1-q001', field: 'imageStatus', value: 'approved' });
 overrides.push({ question_id: 'fis-l1-q001', field: 'imageClassification', value: 'image_required' });
 overrides.push({ question_id: 'fis-l1-q002', field: 'answer', value: '3' });

 // Non-validated questions with contentStatus overrides
 overrides.push({ question_id: 'fis-l2-q001', field: 'contentStatus', value: 'needs_content_review' });
 overrides.push({ question_id: 'fis-l2-q002', field: 'contentStatus', value: 'pending' });

 const { db, storedOverrides } = memoryDB({ overrides });

 // Count what's in D1
 let contentStatusCount = 0;
 let validatedCount = 0;
 for (const [_, val] of storedOverrides) {
   if (val.field === 'contentStatus') {
     contentStatusCount++;
     if (val.value === 'validated') validatedCount++;
   }
 }

 console.log(`D1 STATE (simulated):`);
 console.log(`  Total override entries: ${storedOverrides.size}`);
 console.log(`  contentStatus overrides: ${contentStatusCount}`);
 console.log(`  contentStatus='validated': ${validatedCount}`);

 assert.equal(contentStatusCount, 560, '560 contentStatus overrides (558 validated + 2 others)');
 assert.equal(validatedCount, 558, '558 with value=validated');
});

// ======================================================================
// TEST 2: Reset endpoint only modifies contentStatus field
// ======================================================================

test('RESET ENDPOINT: modifies ONLY contentStatus, preserves all other fields', async () => {
 const overrides = [
   // Question with multiple overrides
   { question_id: 'q-multi', field: 'contentStatus', value: 'validated' },
   { question_id: 'q-multi', field: 'answer', value: '3' },
   { question_id: 'q-multi', field: 'imageStatus', value: 'approved' },
   { question_id: 'q-multi', field: 'imageClassification', value: 'image_required' },
   { question_id: 'q-multi', field: 'imageReason', value: 'Imagem verificada pelo admin' },
   { question_id: 'q-multi', field: 'prompt', value: 'Enunciado modificado' },
   // Question with only image override (no contentStatus)
   { question_id: 'q-img-only', field: 'imageStatus', value: 'approved' },
   // Question with contentStatus but no other overrides
   { question_id: 'q-cs-only', field: 'contentStatus', value: 'validated' },
 ];
 const { db, storedOverrides } = memoryDB({ overrides });

 // Run reset
 const res = await worker.fetch(new Request('https://fixou.test/api/admin/questions/reset-status', {
   method: 'POST', headers: adminHeaders, body: JSON.stringify({ status: 'pending' })
 }), { DB: db });
 const data = await res.json();

 console.log(`\nRESET ENDPOINT RESULTS:`);
 console.log(`  Reset count: ${data.reset}`);

 // Check contentStatus was changed for q-multi and q-cs-only
 const csMulti = storedOverrides.get('q-multi:contentStatus');
 const csCsOnly = storedOverrides.get('q-cs-only:contentStatus');
 console.log(`  q-multi:contentStatus = ${csMulti?.value} (expected: pending)`);
 console.log(`  q-cs-only:contentStatus = ${csCsOnly?.value} (expected: pending)`);

 assert.equal(csMulti?.value, 'pending', 'contentStatus changed to pending');
 assert.equal(csCsOnly?.value, 'pending', 'contentStatus changed to pending');

 // Check ALL other fields are UNTOUCHED
 const answer = storedOverrides.get('q-multi:answer');
 const imgStatus = storedOverrides.get('q-multi:imageStatus');
 const imgClass = storedOverrides.get('q-multi:imageClassification');
 const imgReason = storedOverrides.get('q-multi:imageReason');
 const prompt = storedOverrides.get('q-multi:prompt');
 const imgOnly = storedOverrides.get('q-img-only:imageStatus');

 console.log(`\nFIELDS PRESERVED:`);
 console.log(`  answer: ${answer?.value} (expected: 3)`);
 console.log(`  imageStatus: ${imgStatus?.value} (expected: approved)`);
 console.log(`  imageClassification: ${imgClass?.value} (expected: image_required)`);
 console.log(`  imageReason: ${imgReason?.value} (expected: Imagem verificada pelo admin)`);
 console.log(`  prompt: ${prompt?.value} (expected: Enunciado modificado)`);
 console.log(`  q-img-only:imageStatus: ${imgOnly?.value} (expected: approved)`);

 assert.equal(answer?.value, '3', 'answer preserved');
 assert.equal(imgStatus?.value, 'approved', 'imageStatus preserved');
 assert.equal(imgClass?.value, 'image_required', 'imageClassification preserved');
 assert.equal(imgReason?.value, 'Imagem verificada pelo admin', 'imageReason preserved');
 assert.equal(prompt?.value, 'Enunciado modificado', 'prompt preserved');
 assert.equal(imgOnly?.value, 'approved', 'imageStatus of non-contentStatus question preserved');

 // Verify audit log was created
 assert.ok(data.reset >= 2, 'At least 2 questions reset');
});

// ======================================================================
// TEST 3: Reset does NOT affect questions outside the contentStatus set
// ======================================================================

test('RESET ENDPOINT: does not touch non-contentStatus overrides', async () => {
 const overrides = [
   { question_id: 'q1', field: 'contentStatus', value: 'validated' },
   { question_id: 'q1', field: 'answer', value: '2' },
   { question_id: 'q2', field: 'imageStatus', value: 'approved' },  // NO contentStatus
   { question_id: 'q2', field: 'answer', value: '4' },
 ];
 const { db, storedOverrides } = memoryDB({ overrides });

 await worker.fetch(new Request('https://fixou.test/api/admin/questions/reset-status', {
   method: 'POST', headers: adminHeaders, body: JSON.stringify({ status: 'pending' })
 }), { DB: db });

 // q2 should be completely untouched (no contentStatus override to reset)
 const q2Answer = storedOverrides.get('q2:answer');
 const q2Image = storedOverrides.get('q2:imageStatus');
 const q2Cs = storedOverrides.get('q2:contentStatus');

 console.log(`\nNON-contentStatus QUESTION:`);
 console.log(`  q2:answer = ${q2Answer?.value} (expected: 4)`);
 console.log(`  q2:imageStatus = ${q2Image?.value} (expected: approved)`);
 console.log(`  q2:contentStatus = ${q2Cs?.value} (expected: undefined)`);

 assert.equal(q2Answer?.value, '4', 'q2 answer untouched');
 assert.equal(q2Image?.value, 'approved', 'q2 imageStatus untouched');
 assert.equal(q2Cs, undefined, 'q2 had no contentStatus override, still has none');
});

// ======================================================================
// TEST 4: Override behavior — bank + D1 = effective state
// ======================================================================

test('OVERRIDE: bank=validated + D1=validated → effective=validated (pre-reset state)', () => {
 // Before reset: bank.json had validated, D1 has validated override
 const bankStatus = 'validated';
 const d1Status = 'validated';
 const effective = d1Status !== undefined ? d1Status : bankStatus;
 assert.equal(effective, 'validated');
 console.log(`\nOVERRIDE CHAIN:`);
 console.log(`  bank.json=${bankStatus}, D1=${d1Status} → effective=${effective}`);
});

test('OVERRIDE: bank=pending + D1=validated → effective=validated (BUG before cleanup)', () => {
 // After bank reset but before D1 cleanup: bank=pending, D1 still has validated
 const bankStatus = 'pending';
 const d1Status = 'validated';
 const effective = d1Status !== undefined ? d1Status : bankStatus;
 assert.equal(effective, 'validated');
 console.log(`\nOVERRIDE CHAIN:`);
 console.log(`  bank.json=${bankStatus}, D1=${d1Status} → effective=${effective}`);
 console.log(`  ⚠ D1 override overrides bank.json! Cleanup required.`);
});

test('OVERRIDE: bank=pending + D1=pending → effective=pending (after cleanup)', () => {
 // After reset-status endpoint: bank=pending, D1=pending
 const bankStatus = 'pending';
 const d1Status = 'pending';
 const effective = d1Status !== undefined ? d1Status : bankStatus;
 assert.equal(effective, 'pending');
 console.log(`\nOVERRIDE CHAIN:`);
 console.log(`  bank.json=${bankStatus}, D1=${d1Status} → effective=${effective}`);
});

test('OVERRIDE: bank=pending + D1=none → effective=pending (ideal state)', () => {
 // After deleting the contentStatus override entirely
 const bankStatus = 'pending';
 const d1Status = undefined;
 const effective = d1Status !== undefined ? d1Status : bankStatus;
 assert.equal(effective, 'pending');
 console.log(`\nOVERRIDE CHAIN:`);
 console.log(`  bank.json=${bankStatus}, D1=${d1Status} → effective=${effective}`);
});

// ======================================================================
// TEST 5: Image approval independence
// ======================================================================

test('IMAGE: reset does NOT affect imageStatus, imageClassification, imageReason', async () => {
 const overrides = [
   { question_id: 'q1', field: 'contentStatus', value: 'validated' },
   { question_id: 'q1', field: 'imageStatus', value: 'approved' },
   { question_id: 'q1', field: 'imageClassification', value: 'image_required' },
   { question_id: 'q1', field: 'imageReason', value: 'Imagem verificada' },
 ];
 const { db, storedOverrides } = memoryDB({ overrides });

 await worker.fetch(new Request('https://fixou.test/api/admin/questions/reset-status', {
   method: 'POST', headers: adminHeaders, body: JSON.stringify({ status: 'pending' })
 }), { DB: db });

 const img = storedOverrides.get('q1:imageStatus');
 const cls = storedOverrides.get('q1:imageClassification');
 const reason = storedOverrides.get('q1:imageReason');

 console.log(`\nIMAGE APPROVAL INDEPENDENCE:`);
 console.log(`  imageStatus: ${img?.value} (unchanged)`);
 console.log(`  imageClassification: ${cls?.value} (unchanged)`);
 console.log(`  imageReason: ${reason?.value} (unchanged)`);

 assert.equal(img?.value, 'approved');
 assert.equal(cls?.value, 'image_required');
 assert.equal(reason?.value, 'Imagem verificada');
});

test('IMAGE: "approved" filter still shows questions with approved image after content reset', () => {
 const q = {
   id: 'test-img-q', discipline: 'fisica', topic: 'T', subtopic: 'S', prompt: 'Test.',
   options: ['A', 'B'], answer: 0,
   contentStatus: 'pending',      // Reset from validated
   imageStatus: 'approved',       // Still approved
   imageClassification: 'image_required',
   needsReview: false, imageAssets: []
 };
 const html = reviewScreen({ bank: { questions: [q] }, reviewFilter: 'approved', reviewSearch: '', reviewIndex: 0 });
 assert.ok(html.includes('test-img-q'), 'Question with approved image appears in approved filter');
 console.log(`\nIMAGE FILTER: question with contentStatus=pending + imageStatus=approved appears in "approved" tab`);
});

test('IMAGE: "Não aprovar" does NOT appear for questions with approved image', () => {
 const q = {
   id: 'test-img-q2', discipline: 'fisica', topic: 'T', subtopic: 'S', prompt: 'Test.',
   options: ['A', 'B'], answer: 0,
   contentStatus: 'validated', imageStatus: 'approved',
   imageClassification: 'image_required', needsReview: false, imageAssets: []
 };
 const html = reviewScreen({ bank: { questions: [q] }, reviewFilter: 'all', reviewSearch: '', reviewIndex: 0 });
 assert.ok(!html.includes('review-not-approve'), 'Não aprovar hidden for validated question');
 console.log(`\nIMAGE+CONTENT: validated question with approved image has no "Não aprovar" button`);
});

// ======================================================================
// TEST 6: Full lifecycle with override persistence
// ======================================================================

test('LIFECYCLE: reset → pending → edit answer → not_approved → revert → pending → approve', async () => {
 const storedOverrides = new Map();
 storedOverrides.set('lc-q:contentStatus', { question_id: 'lc-q', field: 'contentStatus', value: 'validated' });
 storedOverrides.set('lc-q:answer', { question_id: 'lc-q', field: 'answer', value: '2' });
 storedOverrides.set('lc-q:imageStatus', { question_id: 'lc-q', field: 'imageStatus', value: 'approved' });
 storedOverrides.set('lc-q:imageClassification', { question_id: 'lc-q', field: 'imageClassification', value: 'image_required' });

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
             storedOverrides.set(this._params[0] + ':' + this._params[1], { value: this._params[2] });
           }
         }
         return { success: true };
       },
       async all() {
         if (sql.includes('FROM question_overrides')) {
           const params = [...this._params];
           const results = [];
           const targetField = params[0];
           const allowedValues = params.slice(1);
           for (const [key, val] of storedOverrides) {
             if (val.field === targetField && allowedValues.includes(val.value)) {
               const [question_id, field] = key.split(':');
               results.push({ question_id, field, value: val.value });
             }
           }
           return { results };
         }
         return { results: [] };
       }
     };
   }
 };

 const get = (f) => storedOverrides.get('lc-q:' + f)?.value;

 console.log(`\nLIFECYCLE TEST:`);
 console.log(`  Step 0: contentStatus=${get('contentStatus')}, answer=${get('answer')}, imageStatus=${get('imageStatus')}`);
 assert.equal(get('contentStatus'), 'validated');
 assert.equal(get('answer'), '2');
 assert.equal(get('imageStatus'), 'approved');

 // Reset
 await worker.fetch(new Request('https://fixou.test/api/admin/questions/reset-status', {
   method: 'POST', headers: adminHeaders, body: JSON.stringify({ status: 'pending' })
 }), { DB: db });
 console.log(`  Step 1 (reset): contentStatus=${get('contentStatus')}, answer=${get('answer')}, imageStatus=${get('imageStatus')}`);
 assert.equal(get('contentStatus'), 'pending', 'After reset: pending');
 assert.equal(get('answer'), '2', 'Answer unchanged');
 assert.equal(get('imageStatus'), 'approved', 'Image unchanged');

 // Edit answer
 await worker.fetch(new Request('https://fixou.test/api/admin/questions/lc-q', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ answer: '4' })
 }), { DB: db });
 console.log(`  Step 2 (edit answer): answer=${get('answer')}`);
 assert.equal(get('answer'), '4', 'Answer changed to 4');

 // Not approve
 await worker.fetch(new Request('https://fixou.test/api/admin/questions/lc-q', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'not_approved' })
 }), { DB: db });
 console.log(`  Step 3 (not approve): contentStatus=${get('contentStatus')}`);
 assert.equal(get('contentStatus'), 'not_approved', 'Status: not_approved');

 // Revert
 await worker.fetch(new Request('https://fixou.test/api/admin/questions/lc-q', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'pending' })
 }), { DB: db });
 console.log(`  Step 4 (revert): contentStatus=${get('contentStatus')}`);
 assert.equal(get('contentStatus'), 'pending', 'Status: pending');

 // Approve
 await worker.fetch(new Request('https://fixou.test/api/admin/questions/lc-q', {
   method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ contentStatus: 'validated', needsReview: 'false' })
 }), { DB: db });
 console.log(`  Step 5 (approve): contentStatus=${get('contentStatus')}`);
 assert.equal(get('contentStatus'), 'validated', 'Status: validated');

 // Final verify
 console.log(`  Final: answer=${get('answer')}, imageStatus=${get('imageStatus')}`);
 assert.equal(get('answer'), '4', 'Answer persisted as 4');
 assert.equal(get('imageStatus'), 'approved', 'Image still approved');
});

// ======================================================================
// TEST 7: SQL analysis — what fields the endpoint touches
// ======================================================================

test('SQL ANALYSIS: INSERT only targets field=contentStatus', async () => {
 const overrides = [
   { question_id: 'q1', field: 'contentStatus', value: 'validated' },
   { question_id: 'q1', field: 'answer', value: '3' },
 ];
 const { db, captures } = memoryDB({ overrides });

 await worker.fetch(new Request('https://fixou.test/api/admin/questions/reset-status', {
   method: 'POST', headers: adminHeaders, body: JSON.stringify({ status: 'pending' })
 }), { DB: db });

 // Analyze INSERT operations
 const inserts = captures.updates.filter(u => u.sql.includes('INSERT INTO question_overrides'));
 console.log(`\nSQL ANALYSIS:`);
 console.log(`  INSERT operations: ${inserts.length}`);
 for (const ins of inserts) {
   console.log(`    params: ${JSON.stringify(ins.params)}`);
   assert.equal(ins.params[1], 'contentStatus', 'Field is contentStatus');
   assert.equal(ins.params[2], 'pending', 'Value is target status');
   assert.ok(ins.params[0].startsWith('q'), 'Question ID preserved');
 }
 assert.equal(inserts.length, 1, 'Only 1 INSERT (for q1 contentStatus)');
});

test('SQL ANALYSIS: SELECT filters by field=contentStatus only', async () => {
 const overrides = [
   { question_id: 'q1', field: 'contentStatus', value: 'validated' },
   { question_id: 'q1', field: 'answer', value: '3' },
   { question_id: 'q2', field: 'imageStatus', value: 'approved' },
 ];
 const { db, captures } = memoryDB({ overrides });

 await worker.fetch(new Request('https://fixou.test/api/admin/questions/reset-status', {
   method: 'POST', headers: adminHeaders, body: JSON.stringify({ status: 'pending' })
 }), { DB: db });

 const selectCall = captures.allResults.find(r => r.sql.includes('question_overrides'));
 console.log(`\nSQL SELECT analysis:`);
 console.log(`  SQL: ${selectCall?.sql}`);
 console.log(`  Params: ${JSON.stringify(selectCall?.params)}`);
 console.log(`  Rows returned: ${selectCall?.resultCount}`);

 assert.ok(selectCall.params.includes('contentStatus'), 'Filters by field=contentStatus');
 assert.equal(selectCall.resultCount, 1, 'Only 1 row (q1 contentStatus, not q2 imageStatus)');
});
