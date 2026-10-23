import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
const ROOT = process.cwd();
const PKG2_PATH = 'C:/Users/victo/Downloads/FIXOU_lote14_pendencias10_ChatGPT_2026-10-22.json';
const BANCO = path.join(ROOT, 'content', 'bank.json');
const PATCHES = path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-patches.json');
const MANIFEST = path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-manifest.json');
const DEST = path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-revisao-assistida');
const pkg2 = JSON.parse(fs.readFileSync(PKG2_PATH, 'utf8'));
const pkg1 = JSON.parse(fs.readFileSync(path.join(DEST, 'pacote-9-chatgpt.json'), 'utf8'));
const alvos = pkg2.corrections.map(c => ({ id: c.id, explanation: c.explanation }));
console.log('correcoes round2:', alvos.length);
// 0) artefato do pacote 2
fs.copyFileSync(PKG2_PATH, path.join(DEST, 'pacote-round2-10-chatgpt.json'));
console.log('artefato pacote-round2-10-chatgpt.json copiado');
// 1) content/bank.json — somente explanation, cirurgico
function fieldRange(objText, key) {
  const keyToken = '"' + key + '":';
  const keyStart = objText.indexOf(keyToken);
  if (keyStart < 0) return null;
  let i = keyStart + keyToken.length;
  while (i < objText.length && /\s/.test(objText[i])) i++;
  let valueStart = i, valueEnd = i;
  if (objText[i] === '"') {
    i++;
    while (i < objText.length) {
      if (objText[i] === '\\') { i += 2; continue; }
      if (objText[i] === '"') { i++; break; }
      i++;
    }
    valueEnd = i;
  } else {
    while (i < objText.length && objText[i] !== ',' && objText[i] !== '}' && objText[i] !== ']') i++;
    valueEnd = i;
  }
  return { keyStart, valueStart, valueEnd };
}
function jsonEscape(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
}
function locateQuestion(objText, id) {
  const idToken = '"id":  "' + id + '"';
  let p = objText.indexOf(idToken);
  if (p < 0) {
    const alt = '"id":"' + id + '"';
    p = objText.indexOf(alt);
    if (p < 0) return null;
  }
  const ini = objText.lastIndexOf('{', p);
  let fim = objText.indexOf('\n                      },', p);
  if (fim < 0) fim = objText.indexOf('\n                    },', p);
  if (fim < 0) {
    let depth = 0, i = ini;
    for (; i < objText.length; i++) {
      if (objText[i] === '{') depth++;
      else if (objText[i] === '}') { depth--; if (depth === 0) break; }
    }
    fim = i;
  }
  return { ini, fim };
}
let raw = fs.readFileSync(BANCO, 'utf8');
let alteradas = 0, falhas = 0;
for (const alvo of alvos) {
  const loc = locateQuestion(raw, alvo.id);
  if (!loc) { console.log('FALHA localizar no banco: ' + alvo.id); falhas++; continue; }
  const bloco = raw.slice(loc.ini, loc.fim + 1);
  const fr = fieldRange(bloco, 'explanation');
  if (!fr) { console.log('FALHA explanation ausente: ' + alvo.id); falhas++; continue; }
  const novoLiteral = '"' + jsonEscape(alvo.explanation) + '"';
  const novoBloco = bloco.slice(0, fr.valueStart) + novoLiteral + bloco.slice(fr.valueEnd);
  raw = raw.slice(0, loc.ini) + novoBloco + raw.slice(loc.fim + 1);
  alteradas++;
}
if (falhas) { console.log('ABORTADO: falhas no banco'); process.exit(1); }
fs.writeFileSync(BANCO, raw, 'utf8');
console.log('banco: explanation alterada em', alteradas, 'IDs');
// 2) lote-14-patches.json — somente after.explanation
const patches = JSON.parse(fs.readFileSync(PATCHES, 'utf8'));
let pAlt = 0, pFalhas = 0;
for (const alvo of alvos) {
  const entry = patches.find(e => e.id === alvo.id);
  if (!entry || !entry.after || typeof entry.after.explanation !== 'string') { console.log('FALHA patch: ' + alvo.id); pFalhas++; continue; }
  entry.after.explanation = alvo.explanation;
  pAlt++;
}
if (pFalhas) { console.log('ABORTADO: falhas nos patches'); process.exit(1); }
fs.writeFileSync(PATCHES, JSON.stringify(patches, null, 2).replace(/\n/g, '\r\n') + '\r\n', 'utf8');
console.log('patches: after.explanation alterada em', pAlt, 'IDs');
// 3) lote-14-manifest.json — divergencias documentadas (somente onde divergence era null)
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const divs = pkg1.prior_recovered_discrepancies;
let dSet = 0, dFalhas = 0;
for (const d of divs) {
  const entry = manifest.find(e => e.id === d.id);
  if (!entry) { console.log('FALHA manifest sem id: ' + d.id); dFalhas++; continue; }
  if (entry.divergence) { console.log('PRESERVADO (ja tinha divergence): ' + d.id); continue; }
  entry.divergence = d.issue;
  dSet++;
}
if (dFalhas) { console.log('ABORTADO: falhas no manifest'); process.exit(1); }
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2).replace(/\n/g, '\r\n') + '\r\n', 'utf8');
console.log('manifest: divergence registrada em', dSet, 'IDs (somente divergencias documentadas do pacote 9)');
// 4) gerar modulo de metadados do painel
execSync('node scripts/generate-ai-audit-meta.mjs', { stdio: 'inherit' });
// 5) regenerar src/ai-audit-lots.js
execSync('node scripts/generate-ai-audit-lots.mjs', { stdio: 'inherit' });
console.log('OK: round2 aplicada | banco', alteradas, '| patches', pAlt, '| divergencias', dSet, '| falhas', falhas + pFalhas + dFalhas);
