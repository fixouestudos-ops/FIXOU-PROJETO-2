import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
execFileSync(process.execPath,[path.join(root,'scripts/validate-bank.mjs')],{stdio:'inherit'});
const bank=JSON.parse(read('content/bank.json')),curriculum=JSON.parse(read('content/curriculum.json')),books=JSON.parse(read('content/books.json'));
if(bank.questions.filter(q=>q.discipline==='biologia').length!==0)throw new Error('As questões de Biologia foram removidas do banco.');
if(new Set(bank.questions.map(q=>q.id)).size!==bank.questions.length)throw new Error('IDs duplicados encontrados no banco.');
for(const c of bank.concepts)if(!c.officialIds.every(id=>curriculum.objects.some(o=>o.id===id)))throw new Error('Origem curricular inválida: '+c.id);
const catalog=`export const BANK=${JSON.stringify(bank)};\nexport const CURRICULUM=${JSON.stringify(curriculum)};\nexport const BOOKS=${JSON.stringify(books)};\n`;
fs.writeFileSync(path.join(root,'src/catalog.js'),catalog);
const files=['src/catalog.js','src/config.js','src/utils.js','src/save.js','src/account.js','src/reviews.js','src/mastery.js','src/gamification.js','src/statistics.js','src/training.js','src/components.js','src/session-builder.js','src/screens.js','src/screens-library.js','src/screens-profile.js','src/screens-settings.js','src/session-view.js','src/controller.js','src/main.js'];
const bundled=new Set(files.map(f=>path.normalize(f)));
for(const file of files){
 const imports=[...read(file).matchAll(/from\s+['"](.+?)['"]/g)].map(match=>match[1]).filter(specifier=>specifier.startsWith('.'));
 for(const specifier of imports){
  const dependency=path.normalize(path.join(path.dirname(file),specifier));
  if(!bundled.has(dependency))throw new Error(`Módulo importado não incluído no bundle: ${file} → ${dependency}`);
 }
}
const code=files.map(f=>read(f).replace(/^import\s+.*?;\s*$/gm,'').replace(/^export\s+/gm,'')).join('\n');
const bundle=`(()=>{'use strict';\n${code}\n})();`;new vm.Script(bundle,{filename:'fuvest-mastery.js'});
const css=read('styles/app.css');const html=read('index.html').replace('<link rel="stylesheet" href="styles/app.css">',()=>`<style>${css}</style>`).replace('<script type="module" src="src/main.js"></script>',()=>`<script>${bundle.replace(/<\/script/gi,'<\\/script')}</script>`);
fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist/index.html'),html);
fs.mkdirSync(path.join(root,'dist/assets'),{recursive:true});fs.copyFileSync(path.join(root,'assets/fixou-logo.png'),path.join(root,'dist/assets/fixou-logo.png'));
if(fs.existsSync(path.join(root,'assets/question-images'))){
 fs.mkdirSync(path.join(root,'dist/assets/question-images'),{recursive:true});
 for(const file of fs.readdirSync(path.join(root,'assets/question-images'))){
  if(file.endsWith('.png'))fs.copyFileSync(path.join(root,'assets/question-images',file),path.join(root,'dist/assets/question-images',file));
 }
}
fs.mkdirSync(path.join(root,'dist/server'),{recursive:true});const logoBase64=fs.readFileSync(path.join(root,'assets/fixou-logo.png')).toString('base64');const worker=read('server/index.mjs').replace("'__FIXOU_INDEX_HTML__'",JSON.stringify(html)).replace("'__FIXOU_LOGO_BASE64__'",JSON.stringify(logoBase64));fs.writeFileSync(path.join(root,'dist/server/index.js'),worker);
console.log('Build OK · '+bank.questions.length+' questões · '+bank.concepts.length+' conceitos · '+curriculum.objects.length+' registros curriculares · '+Math.round(Buffer.byteLength(html)/1024)+' KB');

