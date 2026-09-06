import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=process.env.SERVE_DIST==='1'?path.join(project,'dist'):project;
const port=Number(process.env.PORT||4187);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf','.woff2':'font/woff2'};
http.createServer((req,res)=>{let route;try{route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end('Caminho inválido');}if(route.endsWith('/'))route+='index.html';const file=path.resolve(root,'.'+route);if(!file.startsWith(root+path.sep)||route.split('/').some(x=>x.startsWith('.'))){res.writeHead(403);return res.end('Acesso negado');}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Arquivo não encontrado');}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);});}).listen(port,'127.0.0.1',()=>console.log('FUVEST Mastery: http://127.0.0.1:'+port));
