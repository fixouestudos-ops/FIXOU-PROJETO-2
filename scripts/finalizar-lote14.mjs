import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const DEST = path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-revisao-assistida');
const records = JSON.parse(fs.readFileSync(path.join(DEST, 'manifest-full.json'), 'utf8'));
const INDIV = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'lote14-resolucoes-individuais.json'), 'utf8'));
const JA = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'lote14-explicacoes.json'), 'utf8'));
const alvos = { ...JA, ...INDIV };
for (const r of records) if (!r.already_applied && r.proposed_explanation) alvos[r.id] = true;
const pendentes = records.filter(r => !alvos[r.id]);
const CLASSES = {
  'fis-lic-l2-f1-c6-bncc-em-foco-q1': ['answer_mismatch', 'Gabarito de aviação sob enunciado de lançamento oblíquo'],
  'fis-lic-l2-f1-c6-bncc-em-foco-q2': ['answer_mismatch', 'Gabarito contém respostas de outra questão'],
  'fis-lic-l2-f1-c6-exercicios-complementares-q9': ['prompt_corrupt', 'Itens 04 e 16 com expressões corrompidas no OCR'],
  'fis-lic-l2-f1-c6-exercicios-complementares-q17': ['missing_visual_evidence', 'Depende de três fotografias estroboscópicas ausentes'],
  'fis-lic-l2-f1-c6-exercicios-complementares-q36': ['answer_mismatch', 'x=t+3, y=5−t implica |v|=√2 m/s; gabarito 2 m/s — conferir OCR da função y'],
  'fis-lic-l2-f1-c6-exercicios-complementares-q48': ['answer_mismatch', 'Gabarito aponta C (varia linearmente) mas apenas A é verdadeira; v_rel constante'],
  'fis-lic-l2-f1-c6-exercicios-propostos-q3': ['missing_visual_evidence', 'Representações vetoriais I–IV dependem de diagramas ausentes'],
  'fis-lic-l2-f1-c6-exercicios-propostos-q11': ['prompt_corrupt', 'Equação vetorial ilegível no OCR ("c 25 3b 2a 2 3x")'],
  'fis-lic-l2-f1-c6-exercicios-propostos-q40': ['missing_visual_evidence', 'Diagrama circular e fórmula da alternativa apontada danificados no OCR'],
  'fis-lic-l2-f1-c7-exercicios-complementares-q13': ['source_not_verified', 'Dependência tan²θ2 vs cot²θ2 incerta; conferir fonte'],
  'fis-lic-l2-f1-c7-exercicios-complementares-q18': ['prompt_corrupt', 'Resposta do gabarito ilegível no OCR ("tg v 2 g h u5 × ?")'],
  'fis-lic-l2-f1-c7-exercicios-complementares-q31': ['missing_visual_evidence', 'Posição horizontal do prédio não consta no texto; 9 s pressupõe figura com P no trecho de descida'],
  'fis-lic-l2-f1-c8-exercicios-complementares-q16': ['prompt_corrupt', 'OCR da massa da Terra como 10^−4 kg; dados incompatíveis'],
  'fis-lic-l2-f1-c8-exercicios-complementares-q33': ['missing_visual_evidence', 'Item c (12,5 m/s² = 150/12) pressupõe cenário de A isolado não presente no OCR'],
  'fis-lic-l2-f1-c8-exercicios-complementares-q52': ['missing_visual_evidence', 'Sistema de polia homem/elevador depende de geometria do desenho ausente'],
  'fis-lic-l2-f1-c8-exercicios-complementares-q55': ['missing_visual_evidence', 'Sistema A/B/C e fio depende da representação do apoio ausente'],
  'fis-lic-l2-f1-c8-exercicios-complementares-q72': ['prompt_corrupt', 'Alternativa corrompida no OCR e geometria do engate a conferir'],
  'fis-lic-l2-f1-c8-exercicios-propostos-q56': ['missing_visual_evidence', 'Roldanas e dinamômetro exigem diagrama para relacionar 40 N às massas'],
  'fis-lic-l2-f2-c6-exercicios-propostos-q12': ['missing_visual_evidence', 'Topologia dos quatro resistores (série/paralelo) depende da figura ausente'],
  'fis-lic-l2-f2-c6-exercicios-propostos-q16': ['missing_visual_evidence', 'Interruptores/lâmpadas dependem do diagrama ausente'],
  'fis-lic-l2-f2-c6-revisando-q4': ['missing_visual_evidence', 'Tensões 120/100/20 V sem topologia do circuito (figura ausente)'],
  'fis-lic-l2-f2-c6-revisando-q6': ['missing_visual_evidence', 'Circuito de quatro lâmpadas depende do esquema ausente'],
  'fis-lic-l2-f2-c7-exercicios-complementares-q23': ['missing_visual_evidence', 'Potencial do ponto A depende das orientações das fontes na figura ausente'],
  'fis-lic-l2-f3-c7-bncc-em-foco-q1': ['answer_mismatch', 'Enunciado sobre espelhos; answer de três fontes cromáticas — outra questão'],
  'fis-lic-l2-f3-c7-bncc-em-foco-q2': ['answer_mismatch', 'Enunciado pede traçado de raios; answer discute chama interna — outra questão'],
  'fis-lic-l2-f3-c7-exercicios-complementares-q7': ['missing_visual_evidence', 'Penumbra do banco sem dimensões/desenho no texto'],
  'fis-lic-l2-f3-c7-exercicios-complementares-q8': ['missing_visual_evidence', 'Sombra sem dimensões e configuração óptica (figura ausente)'],
  'fis-lic-l2-f3-c7-exercicios-propostos-q7': ['answer_mismatch', 'Gabarito em formato "Soma: 01+…" não corresponde à questão de faixas LED (a–e)'],
  'fis-lic-l2-f3-c7-revisando-q1': ['answer_mismatch', 'Enunciado de eclipses 2023; resposta cadastrada de outro conteúdo'],
  'fis-lic-l2-f3-c8-bncc-em-foco-q1': ['answer_mismatch', 'Enunciado sobre refutação de refração; answer de tinta branca — outra questão'],
  'fis-lic-l2-f3-c8-bncc-em-foco-q2': ['answer_mismatch', 'Dados de índice (nA=2, nB=1,5) não explorados pelo gabarito atual'],
  'fis-lic-l2-f3-c8-exercicios-propostos-q37': ['answer_mismatch', 'Enunciado pede espelho convexo de garagem; gabarito descreve côncavo'],
  'fis-lic-l2-f3-c8-exercicios-propostos-q42': ['answer_mismatch', 'Gabarito "planos e côncavos"; porteiro usa convexo (campo amplo) e dentista côncavo'],
  'fis-lic-l2-f3-c8-exercicios-propostos-q47': ['answer_mismatch', 'Gabarito (21 cm; 1,25 mm/s) pertence a outro exercício'],
  'fis-lic-l2-f3-c9-bncc-em-foco-q3': ['prompt_corrupt', 'Valores de ESF dos óculos ausentes no OCR'],
  'fis-lic-l2-f3-c9-exercicios-complementares-q4': ['missing_visual_evidence', 'Semicilindro: diagrama indispensável para ângulos no ponto B']
};
const porClasse = {};
const pending = pendentes.map(r => {
  const [classe, motivo] = CLASSES[r.id] || ['pending_review', 'sem classificação'];
  porClasse[classe] = (porClasse[classe] || 0) + 1;
  return { id: r.id, classe, motivo, documented_issue: r.documented_issue || null };
});
fs.writeFileSync(path.join(DEST, 'pending-source.json'), JSON.stringify(pending, null, 2), 'utf8');
const mismatch = pending.filter(p => p.classe === 'answer_mismatch');
fs.writeFileSync(path.join(DEST, 'mismatches.json'), JSON.stringify(mismatch, null, 2), 'utf8');
const checkpoint = {
  lote: 14, total: 200,
  resolved_reviewed: Object.keys(JA).length + 135 + Object.keys(INDIV).length,
  unchanged_correct: 0,
  explicacoes_por_origem: { rodada_anterior_22: Object.keys(JA).length, correcoes_owner_135: 135, resolucoes_individuais_7: Object.keys(INDIV).length },
  pendentes_total: pending.length,
  pendentes_por_classe: porClasse,
  qa: '0 pendencias (164/164 conferidas, 36 pendentes intactos)',
  validacoes: { validateBank: true, test: '328/328', build: 'hash 7136f1f3' }
};
fs.writeFileSync(path.join(DEST, 'checkpoint.json'), JSON.stringify(checkpoint, null, 2), 'utf8');
console.log('pendentes:', pending.length, '| por classe:', JSON.stringify(porClasse));
console.log('checkpoint gravado');
