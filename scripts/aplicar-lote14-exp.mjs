import fs from 'node:fs';
const BANCO='content/bank.json';
const BACKUP='content/bank.json.pre-lote14-exp';
const CONTEUDO='scripts/lote14-explicacoes.json';
if(fs.existsSync(BANCO)&&!fs.existsSync(BACKUP))fs.copyFileSync(BANCO,BACKUP);
let raw=fs.readFileSync(BANCO,'utf8');
const alvos=JSON.parse(fs.readFileSync(CONTEUDO,'utf8'));
function fieldRange(objText,key){
 const keyToken='"'+key+'":';
 const keyStart=objText.indexOf(keyToken);
 if(keyStart<0)return null;
 let i=keyStart+keyToken.length;
 while(i<objText.length&&/\s/.test(objText[i]))i++;
 let valueStart=i,valueEnd=i;
 if(objText[i]==='"'){
  i++;
  while(i<objText.length){
   if(objText[i]==='\\'){i+=2;continue;}
   if(objText[i]==='"'){i++;break;}
   i++;
  }
  valueEnd=i;
 }else{
  while(i<objText.length&&objText[i]!==','&&objText[i]!=='}'&&objText[i]!==']'){i++;}
  valueEnd=i;
 }
 let end=valueEnd;
 while(end<objText.length&&/\s/.test(objText[end])&&objText[end]!=='\n'&&objText[end]!=='\r')end++;
 if(objText[end]===',')end++;
 return {keyStart,valueStart,valueEnd,end};
}
function jsonEscape(s){return s.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r/g,'\\r').replace(/\n/g,'\\n').replace(/\t/g,'\\t');}
function locateQuestion(objText,id){
 const idToken='"id":  "'+id+'"';
 let p=objText.indexOf(idToken);
 if(p<0){
  const alt='"id":"'+id+'"';
  p=objText.indexOf(alt);
  if(p<0)return null;
 }
 const ini=objText.lastIndexOf('{',p);
 const fr=fieldRange(objText,'id');
 let fim=objText.indexOf('\n                      },',p);
 if(fim<0)fim=objText.indexOf('\n                    },',p);
 if(fim<0){
  let depth=0,i=ini;
  for(;i<objText.length;i++){
   if(objText[i]==='{')depth++;
   else if(objText[i]==='}'){depth--;if(depth===0)break;}
  }
  fim=i;
 }
 return {ini,fim};
}
let alteradas=0,falhas=0;
const relatorio=[];
for(const [id,novaExp] of Object.entries(alvos)){
 const loc=locateQuestion(raw,id);
 if(!loc){console.log('FALHA localizar: '+id);falhas++;continue;}
 const bloco=raw.slice(loc.ini,loc.fim+1);
 const fr=fieldRange(bloco,'explanation');
 if(!fr){console.log('FALHA campo explanation ausente: '+id);falhas++;continue;}
 const antiga=JSON.parse(bloco.slice(fr.valueStart,fr.valueEnd));
 const novoLiteral='"'+jsonEscape(novaExp)+'"';
 const novoBloco=bloco.slice(0,fr.valueStart)+novoLiteral+bloco.slice(fr.valueEnd);
 raw=raw.slice(0,loc.ini)+novoBloco+raw.slice(loc.fim+1);
 alteradas++;
 relatorio.push({id,antesChars:antiga.length,depoisChars:novaExp.length,igual:antiga===novaExp});
 console.log((antiga===novaExp?'IGUAL ':'ALTERA ')+id+' | '+antiga.length+' -> '+novaExp.length+' chars');
}
fs.writeFileSync(BANCO,raw,'utf8');
console.log('\nquestoes alteradas: '+alteradas+' | falhas: '+falhas);
fs.writeFileSync('scripts/lote14-relatorio-aplicacao.json',JSON.stringify(relatorio,null,2),'utf8');
