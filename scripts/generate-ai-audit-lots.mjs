import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const readJson=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));

const definitions=[
 {key:'lot12',id:'lote-12',label:'Lote 12',commit:'e0916cc',manifest:'reports/physics-scientific-review/lote-12-manifest.json',patches:'reports/physics-scientific-review/lote-12-patches.json',expectedIds:150,expectedPatches:144},
 {key:'lot13',id:'lote-13',label:'Lote 13',commit:'b008288',manifest:'reports/physics-scientific-review/lote-13-manifest.json',patches:'reports/physics-scientific-review/lote-13-patches.json',expectedIds:200,expectedPatches:200},
 {key:'lot14',id:'lote-14',label:'Lote 14',commit:'a2512c3',manifest:'reports/physics-scientific-review/lote-14-manifest.json',patches:'reports/physics-scientific-review/lote-14-patches.json',expectedIds:200,expectedPatches:200}
];

const lots={};
for(const definition of definitions){
 const manifest=readJson(definition.manifest);
 const patches=readJson(definition.patches);
 const ids=manifest.map(entry=>entry.id);
 if(ids.length!==definition.expectedIds||new Set(ids).size!==ids.length)throw new Error(`${definition.label}: manifesto inválido`);
 if(patches.length!==definition.expectedPatches||new Set(patches.map(entry=>entry.id)).size!==patches.length)throw new Error(`${definition.label}: patches inválidos`);
 const patchById=Object.fromEntries(patches.map(entry=>[entry.id,entry]));
 for(const patch of patches)if(!ids.includes(patch.id))throw new Error(`${definition.label}: patch fora do manifesto: ${patch.id}`);
 lots[definition.key]={
  id:definition.id,
  label:definition.label,
  commit:definition.commit,
  ids,
  manifestById:Object.fromEntries(manifest.map(entry=>[entry.id,entry])),
  patchById,
  correctedIds:manifest.filter(entry=>entry.result==='corrigida').map(entry=>entry.id),
  unchangedIds:manifest.filter(entry=>entry.result==='verificada_sem_alteracao').map(entry=>entry.id),
  divergenceIds:manifest.filter(entry=>entry.divergence).map(entry=>entry.id)
 };
}

const source=`// Gerado por scripts/generate-ai-audit-lots.mjs a partir dos manifests e patches publicados.\nexport const AI_AUDIT_LOTS=${JSON.stringify(lots)};\n`;
fs.writeFileSync(path.join(root,'src/ai-audit-lots.js'),source);
console.log(Object.values(lots).map(lot=>`${lot.label}: ${lot.ids.length} IDs/${Object.keys(lot.patchById).length} patches`).join(' · '));
