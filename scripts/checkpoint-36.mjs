import fs from 'node:fs';
import path from 'node:path';
const DEST = 'reports/physics-scientific-review/lote-14-revisao-assistida';
const checkpoint = {
  etapa: 'investigacao-36-pendencias',
  branch: 'review/ia-auditoria-explanations-only',
  base: 'dc80695',
  recuperadas_17: [
    'fis-lic-l2-f1-c6-bncc-em-foco-q1',
    'fis-lic-l2-f1-c6-bncc-em-foco-q2',
    'fis-lic-l2-f1-c6-exercicios-complementares-q36',
    'fis-lic-l2-f1-c6-exercicios-complementares-q48',
    'fis-lic-l2-f1-c6-exercicios-propostos-q40',
    'fis-lic-l2-f1-c7-exercicios-complementares-q13',
    'fis-lic-l2-f1-c7-exercicios-complementares-q18',
    'fis-lic-l2-f1-c7-exercicios-complementares-q31',
    'fis-lic-l2-f1-c8-exercicios-complementares-q16',
    'fis-lic-l2-f1-c8-exercicios-complementares-q55',
    'fis-lic-l2-f1-c8-exercicios-complementares-q72',
    'fis-lic-l2-f3-c7-revisando-q1',
    'fis-lic-l2-f3-c8-bncc-em-foco-q1',
    'fis-lic-l2-f3-c8-bncc-em-foco-q2',
    'fis-lic-l2-f3-c8-exercicios-propostos-q37',
    'fis-lic-l2-f3-c8-exercicios-propostos-q42',
    'fis-lic-l2-f3-c8-exercicios-propostos-q47'
  ],
  bloqueadas_19: {
    missing_visual_evidence: [
      'fis-lic-l2-f1-c6-exercicios-complementares-q17',
      'fis-lic-l2-f1-c6-exercicios-propostos-q3',
      'fis-lic-l2-f1-c8-exercicios-complementares-q33',
      'fis-lic-l2-f1-c8-exercicios-complementares-q52',
      'fis-lic-l2-f1-c8-exercicios-propostos-q56',
      'fis-lic-l2-f2-c6-exercicios-propostos-q12',
      'fis-lic-l2-f2-c6-exercicios-propostos-q16',
      'fis-lic-l2-f2-c6-revisando-q4',
      'fis-lic-l2-f2-c6-revisando-q6',
      'fis-lic-l2-f2-c7-exercicios-complementares-q23',
      'fis-lic-l2-f3-c7-exercicios-complementares-q7',
      'fis-lic-l2-f3-c7-exercicios-complementares-q8',
      'fis-lic-l2-f3-c9-exercicios-complementares-q4'
    ],
    prompt_corrupt: [
      'fis-lic-l2-f1-c6-exercicios-complementares-q9',
      'fis-lic-l2-f1-c6-exercicios-propostos-q11',
      'fis-lic-l2-f3-c9-bncc-em-foco-q3'
    ],
    answer_mismatch_outra_questao: [
      'fis-lic-l2-f3-c7-bncc-em-foco-q1',
      'fis-lic-l2-f3-c7-bncc-em-foco-q2',
      'fis-lic-l2-f3-c7-exercicios-propostos-q7'
    ]
  },
  qa: '0 pendencias (17/17 conferidas, somente explanation)',
  origem: 'As 36 sao do livro PV Fisica L2 (2025); atribuicoes de vestibular nos enunciados nao verificaveis offline (sem provas oficiais no repositorio)'
};
fs.writeFileSync(path.join(DEST, 'checkpoint-36.json'), JSON.stringify(checkpoint, null, 2), 'utf8');
console.log('checkpoint-36.json gravado');
