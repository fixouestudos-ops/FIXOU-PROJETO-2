import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const controller=read('src/controller.js');
const css=read('styles/app.css');

test('o campo estrelado cobre os três temas com a mesma implementação',()=>{
  assert.match(controller,/const STAR_THEMES=\{/,'o campo estrelado precisa de uma tabela por tema');
  ['nebula','light','rest'].forEach(theme=>{
    assert.ok(new RegExp('\\n\\s*'+theme+':\\{').test(controller),'tema ausente em STAR_THEMES: '+theme);
  });
  assert.match(controller,/colors:\[/,'cada tema precisa de uma paleta própria');
  assert.match(controller,/factor:/,'o movimento precisa ser por tema');
  assert.match(controller,/intensity:/,'a intensidade precisa ser por tema');
  assert.match(controller,/glow:/,'o halo das estrelas precisa ser por tema');
  assert.match(controller,/shotAlpha:/,'a estrela cadente precisa ser por tema');
});

test('o tema Claro usa a paleta azul e lilás aprovada',()=>{
  const block=controller.match(/light:\{([^}]*)\}/)[1];
  assert.match(block,/colors:\['100,135,200','146,112,195','117,138,168','132,105,172'\]/,'a paleta azul/lilás do tema Claro precisa ser preservada');
  assert.match(block,/highlight:'160,200,240'/,'os pontos de brilho em azul-claro precisam ser preservados');
  assert.match(block,/shotAlpha:\.52/,'a estrela cadente do tema Claro precisa de rastro perceptível');
});

test('o tema Descanso usa a paleta cobre e dourado aprovada',()=>{
  const block=controller.match(/rest:\{([^}]*)\}/)[1];
  assert.match(block,/colors:\['185,120,82','174,135,70','183,123,104','168,121,76','144,111,89'\]/,'a paleta cobre/dourado do tema Descanso precisa ser preservada');
  assert.match(block,/highlight:'206,158,92'/,'o destaque dourado do tema Descanso precisa ser preservado');
  assert.match(block,/shotAlpha:\.5/,'a estrela cadente do tema Descanso precisa de rastro perceptível');
});

test('os pontos de brilho claros são minoria e não dominam o campo',()=>{
  assert.match(controller,/palette\.highlight&&i%13===0\?palette\.highlight/,'o ponto de brilho claro precisa ser uma minoria das estrelas');
  assert.match(controller,/palette\.colors\[i%palette\.colors\.length\]/,'as demais estrelas precisam usar a paleta do tema');
});

test('as estrelas ficam acima do brilho de fundo e abaixo do conteúdo',()=>{
  assert.match(css,/#stars\{[^}]*z-index:1/,'o canvas precisa ficar acima do screenGlow para as estrelas não serem lavadas');
  assert.match(css,/\.screenGlow\{[^}]*z-index:0/,'o brilho de fundo precisa ficar abaixo das estrelas');
  assert.match(css,/#stars\{[^}]*pointer-events:none/,'o canvas nunca pode interceptar cliques');
  assert.match(css,/\.content>\*\{position:relative;z-index:1\}/,'o conteúdo precisa continuar acima do céu estrelado');
});

test('o Nebulosa mantém exatamente os valores originais aprovados',()=>{
  const block=controller.match(/nebula:\{([^}]*)\}/)[1];
  assert.match(block,/colors:\['195,216,255'\]/,'a cor original do Nebulosa deve ser preservada');
  assert.match(block,/factor:1,/,'a velocidade original deve ser preservada');
  assert.match(block,/intensity:\.66,/,'a intensidade original deve ser preservada');
  assert.match(block,/glow:\.13,/,'o halo original deve ser preservado');
  assert.match(block,/shotAlpha:\.4,/,'a estrela cadente original deve ser preservada');
  assert.match(block,/shotEvery:13,/,'o intervalo original deve ser preservado');
  assert.match(block,/rgba\(148,191,252,0\)/,'o rastro original deve ser preservado');
  assert.match(block,/rgba\(203,231,255,\.9\)/,'o rastro original deve ser preservado');
});

test('a opacidade do canvas não é mais multiplicada em cima do alpha por estrela',()=>{
  const opacities=[...css.matchAll(/--star-opacity:([\d.]+)/g)].map(m=>Number(m[1]));
  assert.equal(opacities.length,3,'os três temas devem declarar --star-opacity');
  opacities.forEach(value=>assert.equal(value,1,'o canvas precisa ficar opaco: a sutileza vem do alpha por estrela'));
});

test('o halo e a estrela cadente deixam de ser exclusivos do Nebulosa',()=>{
  assert.doesNotMatch(controller,/if\(s\.glow&&theme==='nebula'\)/,'o halo não pode ser exclusivo do Nebulosa');
  assert.doesNotMatch(controller,/moving&&theme==='nebula'&&phase-lastShot/,'a estrela cadente não pode ser exclusiva do Nebulosa');
  assert.match(controller,/if\(s\.glow\)\{/,'o halo precisa existir em todos os temas');
  assert.match(controller,/phase-lastShot>style\.shotEvery/,'a estrela cadente precisa usar o intervalo do tema');
});

test('o campo estrelado respeita preferências de movimento e o tema ativo',()=>{
  assert.match(controller,/moving=!reduced&&!document\.hidden/,'o movimento precisa respeitar reduced motion e aba oculta');
  assert.match(controller,/prefers-reduced-motion: reduce/,'o reduced motion do sistema precisa ser respeitado');
  assert.match(controller,/const theme=document\.documentElement\.dataset\.theme\|\|'nebula'/,'o tema ativo precisa ser lido a cada quadro');
  assert.match(controller,/tint:palette\.highlight&&i%13===0\?palette\.highlight:palette\.colors\[i%palette\.colors\.length\]/,'cada estrela precisa manter uma cor estável');
});
