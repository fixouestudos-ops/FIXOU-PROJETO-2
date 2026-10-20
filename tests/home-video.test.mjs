import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('a homepage usa a seção de vídeo existente e serve o MP4 horizontal',()=>{
  const about=read('src/screens-about.js');
  const player=read('src/video-player.js');
  assert.match(about,/homeVideoFigure\(\)/,'a homepage deve renderizar o player na seção existente');
  assert.doesNotMatch(about,/Vídeo em breve/,'o placeholder provisório deve sair do lugar');
  assert.match(about,/<section class="tutorial" id="aprenda">/,'a seção de vídeo existente deve ser preservada');
  assert.match(player,/media\/fixou-apresentacao\.mp4/,'o player deve apontar para o MP4 servido pelo FIXOU');
  assert.doesNotMatch(player,/youtube|youtu\.be|drive\.google|vimeo/i,'o vídeo não pode depender de plataformas externas');
});

test('o player não inicia sozinho, usa playsinline e não baixa o MP4 antes do clique',()=>{
  const player=read('src/video-player.js');
  assert.match(player,/preload="none"/,'o player deve usar preload none');
  assert.match(player,/playsinline/,'o player precisa de playsinline para celulares');
  assert.doesNotMatch(player,/autoplay/i,'o player não pode ter autoplay');
  assert.match(player,/data-src="\$\{VIDEO_SRC\}"/,'o src do vídeo só pode ser atribuído no clique');
  assert.match(player,/video\.setAttribute\('src',video\.dataset\.src\)/,'o MP4 só pode ser requisitado após a decisão do estudante');
  assert.match(player,/video\.controls=true/,'os controles nativos devem ser habilitados na reprodução');
  assert.match(player,/video\.style\.pointerEvents='none'/,'a capa deve ficar inerte antes da reprodução');
});

test('o botão Play preserva o transform no estado ativo para não sair do cursor',()=>{
  const css=read('styles/app.css');
  assert.match(css,/button:active\{transform:translateY\(1px\)\}/,'a regra global que causava o problema deve existir como base do teste');
  assert.match(css,/\.homeVideoPlay:hover,\.homeVideoPlay:active,\.homeVideoPlay:focus,\.homeVideoPlay:focus-visible\{transform:translate\(-50%,-50%\)\}/,'o botão do player precisa preservar o transform de centralização');
  assert.match(css,/\.homeVideoMedia\{display:block;width:100%;height:100%;object-fit:contain/,'o vídeo não pode ser distorcido nem cortado');
  assert.match(css,/\.homeVideoFrame\{position:relative;aspect-ratio:16\/9/,'o player deve manter proporção 16:9');
});

test('o Worker entrega o MP4 com MIME correto e suporte a Range',()=>{
  const worker=read('server/index.mjs');
  assert.match(worker,/'\/media\/fixou-apresentacao\.mp4'/,'o worker deve expor o vídeo do FIXOU');
  assert.match(worker,/content-type':'video\/mp4'/,'o MIME do vídeo deve ser video/mp4');
  assert.match(worker,/accept-ranges':'bytes'/,'o vídeo deve anunciar Accept-Ranges');
  assert.match(worker,/status:206/,'as respostas parciais devem usar 206 Partial Content');
  assert.match(worker,/content-range':`bytes \$\{start\}-\$\{end\}\/\$\{total\}`/,'a resposta parcial deve informar Content-Range');
});

test('o build publica o MP4 e a capa nos assets estáticos',()=>{
  const build=read('scripts/build.mjs');
  assert.match(build,/fixou-apresentacao\.mp4/,'o build deve copiar o MP4');
  assert.match(build,/fixou-apresentacao-poster\.jpg/,'o build deve copiar a capa');
  assert.match(build,/src\/video-player\.js/,'o módulo do player deve entrar no bundle');
  assert.ok(fs.existsSync(new URL('../assets/fixou-apresentacao.mp4',import.meta.url)),'MP4 ausente em assets/');
  assert.ok(fs.existsSync(new URL('../assets/fixou-apresentacao-poster.jpg',import.meta.url)),'capa ausente em assets/');
  const stats=fs.statSync(new URL('../assets/fixou-apresentacao.mp4',import.meta.url));
  assert.ok(stats.size>1000000&&stats.size<8000000,'o MP4 deve ter tamanho coerente com 60s em 720p');
});
