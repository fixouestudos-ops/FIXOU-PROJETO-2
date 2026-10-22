import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const DEST = path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-revisao-assistida');
const pend = JSON.parse(fs.readFileSync(path.join(DEST, 'pending-source.json'), 'utf8'));
const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'bank.json'), 'utf8'));
const byId = new Map(bank.questions.map(q => [q.id, q]));
const dump = pend.map(p => {
  const q = byId.get(p.id);
  return {
    id: p.id, classe: p.classe, motivo: p.motivo,
    type: q.type, exam: q.examMarker, source: q.source, year: q.year,
    prompt: q.prompt,
    options: q.options || null,
    answer: q.answer,
    answerKeyText: q.answerKeyText || null,
    explanation: q.explanation,
    imageAssets: q.imageAssets || null,
    pageTokenCoverage: q.pageTokenCoverage ?? null,
    imageClassification: q.imageClassification || null,
    needsReview: q.needsReview ?? null,
    topics: q.topics || null,
    chapter: q.chapter || null,
    page: q.page ?? null,
    raw: q.raw || null
  };
});
fs.writeFileSync(path.join(DEST, 'pendentes-36-dump.json'), JSON.stringify(dump, null, 2), 'utf8');
console.log('dump gravado:', dump.length, 'registros');
for (const d of dump) console.log(d.id, '|', d.type, '| src:', d.source, '| year:', d.year, '| img:', d.imageAssets ? d.imageAssets.length : 0, '| cov:', d.pageTokenCoverage);
