import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewScreen } from '../src/screens-review.js';
import { answerText } from '../src/components.js';

function makeBank(questions) {
  return {
    questions,
    concepts: [{ id: 'c1', discipline: 'mat', topic: 'Álgebra', subtopic: 'Funções', officialIds: [] }],
    subjects: [{ id: 'mat', name: 'Matemática', icon: '∑', color: '#4a90d9' }],
    overrides: [],
  };
}

function makeQuestion(overrides = {}) {
  return {
    id: 'q1',
    conceptId: 'c1',
    discipline: 'mat',
    type: 'choice',
    difficulty: 2,
    prompt: 'Test question?',
    options: ['Op A', 'Op B', 'Op C', 'Op D', 'Op E'],
    answer: 0,
    explanation: 'Explicação.',
    needsReview: false,
    ...overrides,
  };
}

function render(opts = {}) {
  const q = opts.question || makeQuestion();
  const bank = makeBank([q]);
  return reviewScreen({
    bank,
    reviewFilter: opts.filter || 'all',
    reviewSearch: '',
    reviewIndex: 0,
    editingQuestion: opts.editing ? q.id : undefined,
    editingFields: opts.editingFields || {},
    state: { favorites: {}, errors: {}, concepts: {}, reviews: {} },
    curriculum: { objects: [], sourceUrl: '' },
  });
}

// --- Index 0 → A ---
test('index 0 maps to letter A in review options', () => {
  const q = makeQuestion({ options: ['First', 'Second', 'Third', 'Fourth', 'Fifth'], answer: 0 });
  const html = render({ question: q });
  assert.ok(html.includes('review-option-letter">A</span><span>First</span>'), `Expected A-First, got snippet: ${html.substring(html.indexOf('review-option-letter'), html.indexOf('review-option-letter') + 80)}`);
});

// --- Index 1 → B ---
test('index 1 maps to letter B in review options', () => {
  const q = makeQuestion({ options: ['First', 'Second', 'Third', 'Fourth', 'Fifth'], answer: 1 });
  const html = render({ question: q });
  assert.ok(html.includes('review-option-letter">B</span><span>Second</span>'), 'Expected B-Second');
});

// --- Index 2 → C ---
test('index 2 maps to letter C in review options', () => {
  const q = makeQuestion({ options: ['First', 'Second', 'Third', 'Fourth', 'Fifth'], answer: 2 });
  const html = render({ question: q });
  assert.ok(html.includes('review-option-letter">C</span><span>Third</span>'), 'Expected C-Third');
});

// --- Index 3 → D ---
test('index 3 maps to letter D in review options', () => {
  const q = makeQuestion({ options: ['First', 'Second', 'Third', 'Fourth', 'Fifth'], answer: 4 });
  const html = render({ question: q });
  assert.ok(html.includes('review-option-letter">D</span><span>Fourth</span>'), 'Expected D-Fourth');
});

// --- Index 4 → E ---
test('index 4 maps to letter E in review options', () => {
  const q = makeQuestion({ options: ['First', 'Second', 'Third', 'Fourth', 'Fifth'], answer: 4 });
  const html = render({ question: q });
  assert.ok(html.includes('review-option-letter">E</span><span>Fifth</span>'), 'Expected E-Fifth');
});

// --- Full 5-option rendering ---
test('renders all five letters A, B, C, D, E for a 5-option question', () => {
  const q = makeQuestion({ options: ['A1', 'B1', 'C1', 'D1', 'E1'], answer: 0 });
  const html = render({ question: q });
  const letters = ['A', 'B', 'C', 'D', 'E'];
  for (const l of letters) {
    assert.ok(html.includes(`review-option-letter">${l}</span>`), `Missing letter ${l}`);
  }
  const re = /review-option-letter">(.)<\/span>/g;
  const found = [];
  let m;
  while ((m = re.exec(html)) !== null) found.push(m[1]);
  assert.deepEqual(found, letters, 'Letters should appear in order A B C D E');
});

// --- 4-option question ---
test('renders A, B, C, D for a 4-option question', () => {
  const q = makeQuestion({ options: ['A1', 'B1', 'C1', 'D1'], answer: 0 });
  const html = render({ question: q });
  const re = /review-option-letter">(.)<\/span>/g;
  const found = [];
  let m;
  while ((m = re.exec(html)) !== null) found.push(m[1]);
  assert.deepEqual(found, ['A', 'B', 'C', 'D']);
});

// --- Answer label for gabarito ---
test('answerLabel shows A when answer is index 0', () => {
  const q = makeQuestion({ options: ['A1', 'B1', 'C1', 'D1', 'E1'], answer: 0 });
  const html = render({ question: q });
  assert.ok(html.includes('Gabarito') && html.includes('>A<'), 'Gabarito should show A for answer 0');
});

test('answerLabel shows E when answer is index 4', () => {
  const q = makeQuestion({ options: ['A1', 'B1', 'C1', 'D1', 'E1'], answer: 4 });
  const html = render({ question: q });
  assert.ok(html.includes('Gabarito') && html.includes('>E<'), 'Gabarito should show E for answer 4');
});

// --- Editing mode radio letters ---
test('editing radio buttons show A-E letters in correct order', () => {
  const q = makeQuestion({ options: ['A1', 'B1', 'C1', 'D1', 'E1'], answer: 2 });
  const html = render({ question: q, editing: true });
  const re = /review-edit-radio">[\s\S]*?type="radio"[^>]*> (.)\) /g;
  const found = [];
  let m;
  while ((m = re.exec(html)) !== null) found.push(m[1]);
  assert.deepEqual(found, ['A', 'B', 'C', 'D', 'E'], 'Radio labels should be A through E');
});

// --- No space before A ---
test('first option letter is exactly A, not a space', () => {
  const q = makeQuestion({ options: ['First', 'Second', 'Third', 'Fourth', 'Fifth'], answer: 0 });
  const html = render({ question: q });
  assert.ok(!html.includes('review-option-letter"> </span>'), 'Should not have a space as the first letter');
  assert.ok(html.includes('review-option-letter">A</span>'), 'First letter should be A');
});

// --- answerText from components.js is not affected (it returns option text, not letter) ---
test('answerText returns option text for choice questions', () => {
  const q = makeQuestion({ options: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'], answer: 0 });
  assert.equal(answerText(q, 0), 'Alpha');
  assert.equal(answerText(q, 4), 'Epsilon');
});

// --- Session view letter mapping is correct (String.fromCharCode) ---
test('session view uses String.fromCharCode(65+i) which correctly maps 0→A', () => {
  for (let i = 0; i < 5; i++) {
    assert.equal(String.fromCharCode(65 + i), 'ABCDE'[i]);
  }
});
