import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewScreen} from '../src/screens-review.js';

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

test('questão com contentStatus validated aparece no filtro approved', () => {
 const q = makeQuestion({ contentStatus: 'validated', imageStatus: 'no_image_required' });
 const html = renderScreen('approved', [q]);
 assert.ok(html.includes('test-q1'), 'Questão com conteúdo validado deve aparecer na aba Aprovadas');
});

test('questão com imageStatus approved aparece no filtro approved', () => {
 const q = makeQuestion({ contentStatus: 'pending', imageStatus: 'approved' });
 const html = renderScreen('approved', [q]);
 assert.ok(html.includes('test-q1'), 'Questão com imagem aprovada deve aparecer na aba Aprovadas');
});

test('questão com imageStatus approved_manual aparece no filtro approved', () => {
 const q = makeQuestion({ contentStatus: 'pending', imageStatus: 'approved_manual' });
 const html = renderScreen('approved', [q]);
 assert.ok(html.includes('test-q1'), 'Questão com imagem aprovada manual deve aparecer na aba Aprovadas');
});

test('questão com imageStatus no_image_confirmed aparece no filtro approved', () => {
 const q = makeQuestion({ contentStatus: 'pending', imageStatus: 'no_image_confirmed' });
 const html = renderScreen('approved', [q]);
 assert.ok(html.includes('test-q1'), 'Questão com sem imagem confirmada deve aparecer na aba Aprovadas');
});

test('questão sem nenhum status aprovado NÃO aparece no filtro approved', () => {
 const q = makeQuestion({ contentStatus: 'needs_content_review', imageStatus: 'needs_visual_review' });
 const html = renderScreen('approved', [q]);
 assert.ok(html.includes('Nenhuma questão encontrada'), 'Questão sem aprovação não deve aparecer na aba Aprovadas');
});

test('questão com ambos contentStatus e imageStatus aprovados aparece no filtro approved', () => {
 const q = makeQuestion({ contentStatus: 'validated', imageStatus: 'approved' });
 const html = renderScreen('approved', [q]);
 assert.ok(html.includes('test-q1'), 'Questão com conteúdo e imagem aprovados deve aparecer na aba Aprovadas');
});

test('filtro needs_content_review exclui questões com contentStatus validated', () => {
 const q = makeQuestion({ contentStatus: 'validated' });
 const html = renderScreen('needs_content_review', [q]);
 assert.ok(html.includes('Nenhuma questão encontrada'), 'Questão validada não deve aparecer em Conteúdo pendente');
});

test('filtro needs_content_review inclui questões com contentStatus pending', () => {
 const q = makeQuestion({ contentStatus: 'pending' });
 const html = renderScreen('needs_content_review', [q]);
 assert.ok(html.includes('test-q1'), 'Questão pendente deve aparecer em Conteúdo pendente');
});

test('indicador visual mostra "✓ Validado" para contentStatus validated', () => {
 const q = makeQuestion({ contentStatus: 'validated' });
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('✓ Validado'), 'Deve mostrar indicador de conteúdo validado');
});

test('indicador visual mostra "Pendente" para contentStatus pending', () => {
 const q = makeQuestion({ contentStatus: 'pending' });
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('Conteúdo:'), 'Deve mostrar seção de conteúdo');
 assert.ok(!html.includes('✓ Validado'), 'Não deve mostrar validado para conteúdo pendente');
});

test('indicador visual mostra "✓ Aprovada" para imageStatus approved', () => {
 const q = makeQuestion({ imageStatus: 'approved' });
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('✓ Aprovada'), 'Deve mostrar indicador de imagem aprovada');
});

test('indicador visual mostra "Pendente" para imageStatus sem aprovação', () => {
 const q = makeQuestion({ imageStatus: 'needs_visual_review' });
 const html = renderScreen('all', [q]);
 assert.ok(html.includes('Imagem:'), 'Deve mostrar seção de imagem');
 assert.ok(!html.includes('✓ Aprovada'), 'Não deve mostrar aprovada para imagem pendente');
});

test('contagem da aba Aprovadas inclui questões com conteúdo validado', () => {
 const q1 = makeQuestion({ id: 'q-content', contentStatus: 'validated', imageStatus: 'no_image_required' });
 const q2 = makeQuestion({ id: 'q-image', contentStatus: 'pending', imageStatus: 'approved' });
 const q3 = makeQuestion({ id: 'q-neither', contentStatus: 'needs_content_review', imageStatus: 'needs_visual_review' });
 const html = renderScreen('approved', [q1, q2, q3]);
 assert.ok(html.includes('Aprovadas <span class="review-tab-count">2</span>'), 'Contagem de aprovadas deve ser 2');
});

test('botão Aprovar conteúdo não aparece para questões já editando', () => {
 const q = makeQuestion({ contentStatus: 'pending' });
 const bank = { questions: [q] };
 const html = reviewScreen({ bank, reviewFilter: 'all', reviewSearch: '', reviewIndex: 0, editingQuestion: 'test-q1' });
 assert.ok(!html.includes('review-approve-content'), 'Botão de aprovar não deve aparecer durante edição');
});
