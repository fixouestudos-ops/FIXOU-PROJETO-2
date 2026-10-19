import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright-core');

const VIDEO=path.resolve('assets/fixou-apresentacao.mp4');
const POSTER=path.resolve('assets/fixou-apresentacao-poster.jpg');
const FRAME=3;

const server=http.createServer((req,res)=>{
  if(req.url.startsWith('/video.mp4')){
    const stat=fs.statSync(VIDEO);
    const range=req.headers.range;
    res.setHeader('content-type','video/mp4');
    res.setHeader('accept-ranges','bytes');
    if(range){
      const m=/bytes=(\d+)-(\d*)/.exec(range);
      const start=Number(m[1]);const end=m[2]?Number(m[2]):stat.size-1;
      res.statusCode=206;
      res.setHeader('content-range',`bytes ${start}-${end}/${stat.size}`);
      res.setHeader('content-length',end-start+1);
      fs.createReadStream(VIDEO,{start,end}).pipe(res);
      return;
    }
    res.setHeader('content-length',stat.size);
    fs.createReadStream(VIDEO).pipe(res);
    return;
  }
  res.setHeader('content-type','text/html; charset=utf-8');
  res.end('<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000"><video id="v" src="/video.mp4" playsinline></video></body>');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;

const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:720}});
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(()=>{const v=document.getElementById('v');return v&&v.readyState>=2;},null,{timeout:30000});
const dataUrl=await page.evaluate(async(time)=>{
  const v=document.getElementById('v');
  await new Promise(res=>{v.onseeked=()=>res();v.currentTime=time;});
  await new Promise(r=>setTimeout(r,300));
  const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;
  c.getContext('2d').drawImage(v,0,0,c.width,c.height);
  return c.toDataURL('image/jpeg',0.84);
},FRAME);
fs.writeFileSync(POSTER,Buffer.from(dataUrl.split(',')[1],'base64'));
console.log('POSTER',POSTER,fs.statSync(POSTER).size,'bytes (frame de',FRAME,'s)');
await browser.close();
server.close();
