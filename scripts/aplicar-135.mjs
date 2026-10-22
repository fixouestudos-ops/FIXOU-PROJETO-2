import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const BANCO = path.join(ROOT, 'content', 'bank.json');
const BACKUP = path.join(ROOT, 'content', 'bank.json.pre-l14-135');
const DEST = path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-revisao-assistida');
if (fs.existsSync(BANCO) && !fs.existsSync(BACKUP)) fs.copyFileSync(BANCO, BACKUP);
const records = JSON.parse(fs.readFileSync(path.join(DEST, 'manifest-full.json'), 'utf8'));
const alvos = {};
for (const r of records) {
  if (r.already_applied) continue;
  if (r.proposed_explanation) alvos[r.id] = r.proposed_explanation;
}
console.log('propostas a aplicar:', Object.keys(alvos).length);
let raw = fs.readFileSync(BANCO, 'utf8');
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
let alteradas = 0, falhas = 0;
const relatorio = [];
for (const [id, novaExp] of Object.entries(alvos)) {
  const loc = locateQuestion(raw, id);
  if (!loc) { console.log('FALHA localizar: ' + id); falhas++; continue; }
  const bloco = raw.slice(loc.ini, loc.fim + 1);
  const fr = fieldRange(bloco, 'explanation');
  if (!fr) { console.log('FALHA explanation ausente: ' + id); falhas++; continue; }
  const antiga = JSON.parse(bloco.slice(fr.valueStart, fr.valueEnd));
  const novoLiteral = '"' + jsonEscape(novaExp) + '"';
  const novoBloco = bloco.slice(0, fr.valueStart) + novoLiteral + bloco.slice(fr.valueEnd);
  raw = raw.slice(0, loc.ini) + novoBloco + raw.slice(loc.fim + 1);
  alteradas++;
  relatorio.push({ id, antes: antiga.length, depois: novaExp.length, eraGenerica: /Converta primeiro|coincide com o gabarito/.test(antiga) });
}
fs.writeFileSync(BANCO, raw, 'utf8');
console.log('alteradas:', alteradas, '| falhas:', falhas);
const eramGenericas = relatorio.filter(x => x.eraGenerica).length;
console.log('que estavam com template generico:', eramGenericas);
fs.writeFileSync(path.join(DEST, 'aplicacao-135.json'), JSON.stringify(relatorio, null, 2), 'utf8');
