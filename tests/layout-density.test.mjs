import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(__dirname, '..', 'styles', 'app.css');
const css = readFileSync(cssPath, 'utf8');

const BAND = '@media(min-width:701px) and (max-width:1500px)';
const bandIndex = css.indexOf(BAND);
const bandCss = bandIndex === -1 ? '' : css.slice(bandIndex);

describe('Layout density: compact desktop band exists', () => {
  it('compact band 701-1500px is present', () => {
    assert.ok(bandIndex !== -1, 'CSS must contain the compact density media query');
  });

  it('compact band trims topbar height (68px)', () => {
    assert.ok(bandCss.includes('.topbar{height:68px'), 'compact band must set .topbar height to 68px');
  });

  it('compact band trims main padding', () => {
    assert.ok(bandCss.includes('main{padding:26px 28px 36px}'), 'compact band must set main padding to 26px 28px 36px');
  });

  it('compact band trims today-card bulk', () => {
    assert.ok(bandCss.includes('.today-card{padding:24px 26px;min-height:290px}'), 'compact band must trim .today-card');
  });

  it('compact band keeps grids responsive (gaps only)', () => {
    assert.ok(bandCss.includes('.mode-grid{gap:14px}'), 'compact band must only tighten .mode-grid gap');
    assert.ok(bandCss.includes('.subject-grid{gap:14px}'), 'compact band must only tighten .subject-grid gap');
    assert.ok(!bandCss.includes('grid-template-columns'), 'compact band must NOT change grid columns');
  });
});

describe('Layout density: no zoom/scale hacks', () => {
  it('compact band does not use zoom property', () => {
    assert.ok(!bandCss.match(/(^|;|\{)\s*zoom\s*:/), 'compact band must NOT use zoom');
  });

  it('compact band does not use transform scale', () => {
    assert.ok(!bandCss.includes('scale('), 'compact band must NOT use transform scale');
  });

  it('compact band does not hide content', () => {
    assert.ok(!bandCss.includes('display:none'), 'compact band must NOT hide content');
    assert.ok(!bandCss.includes('visibility:hidden'), 'compact band must NOT hide content');
  });

  it('compact band does not change fonts', () => {
    assert.ok(!bandCss.includes('font-size'), 'compact band must NOT change font sizes');
  });
});

describe('Layout density: sidebar and mobile preserved', () => {
  it('sidebar widths untouched', () => {
    assert.ok(css.includes('.sidebar{position:fixed'), 'sidebar must stay fixed');
    assert.ok(css.match(/\.sidebar\{[^}]*width\s*:\s*236px/), 'sidebar base width 236px preserved');
  });

  it('workspace offsets untouched', () => {
    assert.ok(css.match(/\.workspace\s*\{\s*margin-left\s*:\s*236px\s*\}/), 'workspace base offset preserved');
  });

  it('mobile (700px) block keeps workspace margin-left:0', () => {
    assert.ok(css.includes('.workspace{margin-left:0}'), 'mobile workspace offset preserved');
  });

  it('mobile block does not contain the 68px topbar', () => {
    const blocks = [];
    const re = /@media\s*\(\s*max-width\s*:\s*700px\s*\)\{/g;
    let m;
    while ((m = re.exec(css))) {
      let depth = 1, i = re.lastIndex;
      while (i < css.length && depth > 0) {
        if (css[i] === '{') depth++;
        else if (css[i] === '}') depth--;
        i++;
      }
      blocks.push(css.slice(m.index, i));
    }
    assert.ok(blocks.length > 0, 'mobile media blocks must exist');
    const leaked = blocks.some((block) => block.includes('.topbar{height:68px'));
    assert.ok(!leaked, 'compact topbar must NOT leak into mobile');
  });

  it('wide screens (>1500px) keep the airy layout', () => {
    const after1500 = css.slice(css.indexOf('@media(min-width:1600px)'), bandIndex === -1 ? undefined : bandIndex);
    assert.ok(!after1500.includes('height:68px'), 'airy >1500px layout must not get compact topbar');
  });
});
