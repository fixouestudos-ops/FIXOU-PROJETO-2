import fs from 'node:fs';
const p = 'reports/physics-scientific-review/lote-14-revisao-assistida/correcoes-propostas-36.json';
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
const i = j.bloqueadas_evidencia_faltante.findIndex(x => x.id === 'fis-lic-l2-f1-c8-exercicios-complementares-q72');
if (i >= 0) {
  j.bloqueadas_evidencia_faltante.splice(i, 1);
  j.correcoes_de_gabarito_propostas.push({
    id: 'fis-lic-l2-f1-c8-exercicios-complementares-q72',
    situacao: 'explanation aplicada (a2=(F1-M1*a1)/M2 por eliminacao); texto das alternativas permanece corrompido no OCR',
    proposta: 'reconstruir o texto da alternativa A na fonte (atualmente aparece como F Ma M 11 2 2)',
    evidencia: 'derivacao fisica completa: Fmola = F1 - M1*a1 = M2*a2'
  });
}
fs.writeFileSync(p, JSON.stringify(j, null, 2), 'utf8');
console.log('gabarito propostas:', j.correcoes_de_gabarito_propostas.length, '| bloqueadas:', j.bloqueadas_evidencia_faltante.length);
