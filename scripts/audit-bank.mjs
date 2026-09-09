import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bankPath=path.join(root,'content','bank.json');
const bank=JSON.parse(fs.readFileSync(bankPath,'utf8'));

const IMAGE_SIGNAL_KEYWORDS=[
 'figura','gráfico','diagrama','circuito','mapa','tirinha','ilustração','desenho',
 'representação gráfica','image','img','foto','photograph','tabela','esquema',
 'planta','mapa','carta','régua','ἄβαξ','compasso','maquete',
 'na figura','no gráfico','no diagrama','na imagem','no esquema','na tabela',
 'representado na','mostrado na','ilustrado na','apresentado na',
 'conforme a figura','conforme o gráfico','conforme o diagrama',
 'veja a figura','veja o gráfico','veja o diagrama',
 'alternativas visuais','opções visuais','figuras a seguir',
 'figuras abaixo','imagens a seguir','opções gráficas'
];

function classifyQuestion(q){
 const hasImageAssets=q.imageAssets&&q.imageAssets.length>0;
 const hasDiagram=!!q.diagram;
 const hasRequiresImage=q.reviewReasons&&q.reviewReasons.includes('requires_image');
 const hasImageSignal=IMAGE_SIGNAL_KEYWORDS.some(kw=>q.prompt&&q.prompt.toLowerCase().includes(kw.toLowerCase()));

 let imageClassification='no_image_required';
 let imageReason='Questão puramente textual';
 let contentStatus=q.needsReview?'needs_content_review':'validated';

 if(hasImageAssets){
  imageClassification='image_required';
  imageReason='Possui asset de imagem associado';
 }else if(hasDiagram){
  imageClassification='no_image_required';
  imageReason='Diagrama SVG embutido (não precisa de imagem externa)';
 }else if(hasRequiresImage){
  imageClassification='needs_visual_review';
  imageReason='Revisado como possivelmente necessitando de imagem';
 }else if(hasImageSignal){
  imageClassification='needs_visual_review';
  imageReason='Contém referência visual no enunciado';
 }

 if(hasImageAssets&&!fs.existsSync(path.join(root,q.imageAssets[0]))){
  imageClassification='bad_image_association';
  imageReason='Asset de imagem referenciado não existe no disco';
 }

 return {imageClassification,imageReason,contentStatus};
}

let counts={no_image_required:0,image_required:0,needs_visual_review:0,bad_image_association:0};
let contentValidated=0,contentNeedsReview=0;

for(const q of bank.questions){
 const classification=classifyQuestion(q);
 q.imageClassification=classification.imageClassification;
 q.imageStatus=classification.imageClassification==='no_image_required'?'no_image_required':
  classification.imageClassification==='image_required'?'needs_visual_review':
  classification.imageClassification==='bad_image_association'?'bad_image_association':
  'needs_visual_review';
 q.contentStatus=classification.contentStatus;
 q.imageReason=classification.imageReason;
 counts[classification.imageClassification]++;
 if(classification.contentStatus==='validated')contentValidated++;else contentNeedsReview++;
}

fs.writeFileSync(bankPath,JSON.stringify(bank,null,2),'utf8');

console.log('=== AUDITORIA DO BANCO DE FÍSICA ===');
console.log(`TOTAL DE QUESTÕES PROCESSADAS: ${bank.questions.length}`);
console.log(`CLASSIFICADAS COMO SEM IMAGEM: ${counts.no_image_required}`);
console.log(`CLASSIFICADAS COMO COM IMAGEM: ${counts.image_required}`);
console.log(`CLASSIFICADAS COMO DÚVIDA VISUAL: ${counts.needs_visual_review}`);
console.log(`BAD IMAGE ASSOCIATIONS: ${counts.bad_image_association}`);
console.log(`CONTENT VALIDATED: ${contentValidated}`);
console.log(`CONTENT NEEDS REVIEW: ${contentNeedsReview}`);
console.log(`IMAGE APPROVED: 0`);
console.log(`IMAGE NEEDS REVIEW: ${counts.needs_visual_review}`);
