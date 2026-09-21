import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const controllerCode = fs.readFileSync(path.join(root, 'src/controller.js'), 'utf8');

test('hashchange handler chains render after fetchQuestionOverrides for review route', () => {
 const hashchangeBlock = controllerCode.slice(
   controllerCode.indexOf("window.addEventListener('hashchange'"),
   controllerCode.indexOf("window.addEventListener('pagehide'")
 );
 assert.ok(
   hashchangeBlock.includes("fetchQuestionOverrides().then("),
   'hashchange must call fetchQuestionOverrides().then(()=>render()) for review route'
 );
 assert.ok(
   hashchangeBlock.includes("}else{render();}"),
   'hashchange must call render() directly for non-review routes'
 );
});

test('hashchange does not call render() before fetchQuestionOverrides completes', () => {
 const hashchangeBlock = controllerCode.slice(
   controllerCode.indexOf("window.addEventListener('hashchange'"),
   controllerCode.indexOf("window.addEventListener('pagehide'")
 );
 const reviewBlock = hashchangeBlock.slice(
   hashchangeBlock.indexOf("if(ui.route==='review'"),
   hashchangeBlock.indexOf("window.scrollTo")
 );
 const thenIndex = reviewBlock.indexOf('.then(');
 const renderIndex = reviewBlock.indexOf('render()');
 assert.ok(thenIndex < renderIndex, 'render() must be inside .then() callback, not after fetchQuestionOverrides()');
});

test('fetchQuestionOverrides is defined as async function', () => {
 assert.ok(
   controllerCode.includes('async function fetchQuestionOverrides()'),
   'fetchQuestionOverrides must be async'
 );
});

test('applyOverrides is defined as synchronous function', () => {
 assert.ok(
   controllerCode.includes('function applyOverrides()'),
   'applyOverrides must be defined'
 );
 assert.ok(
   !controllerCode.includes('async function applyOverrides()'),
   'applyOverrides must NOT be async'
 );
});

test('review-approve-content handler calls PATCH before updating BANK', () => {
 const approveBlock = controllerCode.slice(
   controllerCode.indexOf("action==='review-approve-content'"),
   controllerCode.indexOf("action==='cards-home'")
 );
 assert.ok(
   approveBlock.includes("api('/api/admin/questions/'+encodeURIComponent(id),{method:'PATCH'"),
   'approve handler must call PATCH endpoint'
 );
 assert.ok(
   approveBlock.includes(".then(()=>{"),
   'approve handler must chain .then() after PATCH'
 );
 const thenBlock = approveBlock.slice(approveBlock.indexOf('.then('));
 assert.ok(
   thenBlock.includes("q.contentStatus='validated'"),
   'contentStatus must be set inside .then() callback'
 );
});

test('review-approve-content handler updates questionOverrides cache', () => {
 const approveBlock = controllerCode.slice(
   controllerCode.indexOf("action==='review-approve-content'"),
   controllerCode.indexOf("action==='cards-home'")
 );
 assert.ok(
   approveBlock.includes("questionOverrides[id].contentStatus='validated'"),
   'must update questionOverrides cache after PATCH'
 );
 assert.ok(
   approveBlock.includes("questionOverrides[id].needsReview=false"),
   'must update needsReview in questionOverrides cache'
 );
});

test('applyOverrides correctly handles string boolean for needsReview', () => {
 const applyBlock = controllerCode.slice(
   controllerCode.indexOf('function applyOverrides()'),
   controllerCode.indexOf('function context()')
 );
 assert.ok(
   applyBlock.includes("o.needsReview==='true'") || applyBlock.includes('o.needsReview===true'),
   'applyOverrides must check needsReview as string or boolean'
 );
});

test('initialization calls await fetchQuestionOverrides before final render', () => {
 const initBlock = controllerCode.slice(
   controllerCode.indexOf('readRoute();if(session?'),
   controllerCode.length
 );
 assert.ok(
   initBlock.includes("await fetchQuestionOverrides()"),
   'initialization must await fetchQuestionOverrides'
 );
 assert.ok(
   initBlock.includes("}render();if(loaded.warning"),
   'render() must be called after await fetchQuestionOverrides'
 );
});
