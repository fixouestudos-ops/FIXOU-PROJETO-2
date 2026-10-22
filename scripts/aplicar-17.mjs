import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const BANCO = path.join(ROOT, 'content', 'bank.json');
const DEST = path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-revisao-assistida');
const alvos = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'lote14-recuperadas-17.json'), 'utf8'));
console.log('resolucoes a aplicar:', Object.keys(alvos).length);
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
for (const [id, novaExp] of Object.entries(alvos)) {
  const loc = locateQuestion(raw, id);
  if (!loc) { console.log('FALHA localizar: ' + id); falhas++; continue; }
  const bloco = raw.slice(loc.ini, loc.fim + 1);
  const fr = fieldRange(bloco, 'explanation');
  if (!fr) { console.log('FALHA explanation ausente: ' + id); falhas++; continue; }
  const novoLiteral = '"' + jsonEscape(novaExp) + '"';
  const novoBloco = bloco.slice(0, fr.valueStart) + novoLiteral + bloco.slice(fr.valueEnd);
  raw = raw.slice(0, loc.ini) + novoBloco + raw.slice(loc.fim + 1);
  alteradas++;
}
fs.writeFileSync(BANCO, raw, 'utf8');
console.log('alteradas:', alteradas, '| falhas:', falhas);
