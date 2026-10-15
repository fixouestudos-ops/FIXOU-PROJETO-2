import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(__dirname, '..', 'styles', 'app.css');
const css = readFileSync(cssPath, 'utf8');
const jsPath = resolve(__dirname, '..', 'src', 'controller.js');
const js = readFileSync(jsPath, 'utf8');

describe('Sidebar CSS: permanently visible on desktop', () => {
  it('base .sidebar has display:flex (visible by default)', () => {
    const rule = css.match(/\.sidebar\{[^}]*display\s*:\s*flex/);
    assert.ok(rule, 'Base .sidebar rule must contain display:flex');
  });

  it('base .sidebar has no display:none!important', () => {
    const rule = css.match(/\.sidebar\{[^}]*display\s*:\s*none\s*!important/);
    assert.ok(!rule, 'Base .sidebar must NOT contain display:none!important');
  });

  it('base .sidebar has no visibility:hidden!important', () => {
    const rule = css.match(/\.sidebar\{[^}]*visibility\s*:\s*hidden\s*!important/);
    assert.ok(!rule, 'Base .sidebar must NOT contain visibility:hidden!important');
  });

  it('base .sidebar has no height:0!important', () => {
    const rule = css.match(/\.sidebar\{[^}]*height\s*:\s*0\s*!important/);
    assert.ok(!rule, 'Base .sidebar must NOT contain height:0!important');
  });

  it('base .sidebar has no pointer-events:none!important', () => {
    const rule = css.match(/\.sidebar\{[^}]*pointer-events\s*:\s*none\s*!important/);
    assert.ok(!rule, 'Base .sidebar must NOT contain pointer-events:none!important');
  });

  it('base .sidebar has no z-index:-1!important', () => {
    const rule = css.match(/\.sidebar\{[^}]*z-index\s*:\s*-1\s*!important/);
    assert.ok(!rule, 'Base .sidebar must NOT contain z-index:-1!important');
  });

  it('base .sidebar has position:fixed', () => {
    const rule = css.match(/\.sidebar\{[^}]*position\s*:\s*fixed/);
    assert.ok(rule, 'Base .sidebar must contain position:fixed');
  });

  it('base .sidebar has width:236px', () => {
    const rule = css.match(/\.sidebar\{[^}]*width\s*:\s*236px/);
    assert.ok(rule, 'Base .sidebar must contain width:236px');
  });

  it('base .sidebar has height:100dvh (full viewport)', () => {
    const rule = css.match(/\.sidebar\{[^}]*height\s*:\s*100dvh/);
    assert.ok(rule, 'Base .sidebar must contain height:100dvh');
  });

  it('base .sidebar has overflow:hidden (no internal scrollbar)', () => {
    const rule = css.match(/\.sidebar\{[^}]*overflow\s*:\s*hidden/);
    assert.ok(rule, 'Base .sidebar must contain overflow:hidden (no internal scrollbar)');
  });

  it('base .sidebar has z-index:30 (above workspace)', () => {
    const rule = css.match(/\.sidebar\{[^}]*z-index\s*:\s*30/);
    assert.ok(rule, 'Base .sidebar must contain z-index:30');
  });

  it('base .sidebar has flex-direction:column', () => {
    const rule = css.match(/\.sidebar\{[^}]*flex-direction\s*:\s*column/);
    assert.ok(rule, 'Base .sidebar must contain flex-direction:column');
  });
});

describe('Sidebar CSS: workspace offset matches sidebar width', () => {
  it('base .workspace has margin-left:236px', () => {
    const rule = css.match(/\.workspace\s*\{\s*margin-left\s*:\s*236px\s*\}/);
    assert.ok(rule, 'Base .workspace must have margin-left:236px');
  });

  it('@media(max-width:1250px) workspace margin-left matches sidebar width (214px)', () => {
    const hasMatch = css.includes('@media(max-width:1250px){') && css.includes('.workspace{margin-left:214px}');
    assert.ok(hasMatch, '@media(max-width:1250px) workspace must have margin-left:214px');
  });

  it('@media(max-width:980px) workspace margin-left matches sidebar width (190px)', () => {
    const hasMatch = css.includes('@media(max-width:980px){') && css.includes('.workspace{margin-left:190px}');
    assert.ok(hasMatch, '@media(max-width:980px) workspace must have margin-left:190px');
  });
});

describe('Sidebar CSS: no internal scrollbar', () => {
  it('no .sidebar rule has overflow-y:auto or overflow-y:scroll', () => {
    const overflowRules = css.match(/\.sidebar\{[^}]*overflow-y\s*:\s*(auto|scroll)/g);
    assert.ok(!overflowRules, '.sidebar must NOT have overflow-y:auto or overflow-y:scroll');
  });

  it('no .sidebar rule has overflow:auto or overflow:scroll', () => {
    const overflowRules = css.match(/\.sidebar\{[^}]*overflow\s*:\s*(auto|scroll)[^-]/g);
    assert.ok(!overflowRules, '.sidebar must NOT have overflow:auto or overflow:scroll');
  });
});

describe('Sidebar CSS: menu-toggle hidden on desktop, visible on mobile', () => {
  it('.menu-toggle has display:none as base rule (hidden on desktop)', () => {
    const rule = css.match(/\.menu-toggle\s*\{\s*display\s*:\s*none/);
    assert.ok(rule, '.menu-toggle must have display:none as base rule');
  });

  it('@media(max-width:700px) has .menu-toggle with display:block (visible on mobile)', () => {
    const blocks = css.split(/@media\s*\(\s*max-width\s*:\s*700px\s*\)/);
    const hasMobileToggle = blocks.some((block, i) => i > 0 && block.includes('.menu-toggle') && block.includes('display:block'));
    assert.ok(hasMobileToggle, '@media(max-width:700px) must have .menu-toggle display:block');
  });
});

describe('Sidebar CSS: mobile toggle preserved', () => {
  it('@media(max-width:700px) .sidebar.open has display:flex!important', () => {
    const blocks = css.split(/@media\s*\(\s*max-width\s*:\s*700px\s*\)/);
    const hasOpen = blocks.some((block, i) => i > 0 && block.includes('.sidebar.open') && block.includes('display:flex!important'));
    assert.ok(hasOpen, '@media(max-width:700px) .sidebar.open must have display:flex!important');
  });

  it('@media(max-width:700px) .sidebar.open has visibility:visible!important', () => {
    const blocks = css.split(/@media\s*\(\s*max-width\s*:\s*700px\s*\)/);
    const hasVisible = blocks.some((block, i) => i > 0 && block.includes('.sidebar.open') && block.includes('visibility:visible!important'));
    assert.ok(hasVisible, '@media(max-width:700px) .sidebar.open must have visibility:visible!important');
  });

  it('@media(max-width:700px) .sidebar.open has z-index:20!important', () => {
    const blocks = css.split(/@media\s*\(\s*max-width\s*:\s*700px\s*\)/);
    const hasZindex = blocks.some((block, i) => i > 0 && block.includes('.sidebar.open') && block.includes('z-index:20!important'));
    assert.ok(hasZindex, '@media(max-width:700px) .sidebar.open must have z-index:20!important');
  });

  it('@media(max-width:700px) .sidebar.open has pointer-events:auto!important', () => {
    const blocks = css.split(/@media\s*\(\s*max-width\s*:\s*700px\s*\)/);
    const hasPointer = blocks.some((block, i) => i > 0 && block.includes('.sidebar.open') && block.includes('pointer-events:auto!important'));
    assert.ok(hasPointer, '@media(max-width:700px) .sidebar.open must have pointer-events:auto!important');
  });

  it('@media(max-width:700px) .workspace has margin-left:0 (no offset when sidebar hidden)', () => {
    const hasMobileZero = css.includes('@media(max-width:700px){') && css.includes('.workspace{margin-left:0}');
    assert.ok(hasMobileZero, '@media(max-width:700px) .workspace must have margin-left:0');
  });

  it('.nav-backdrop exists with display:none base', () => {
    const rule = css.match(/\.nav-backdrop\s*\{\s*display\s*:\s*none/);
    assert.ok(rule, '.nav-backdrop must have display:none as base');
  });

  it('.nav-backdrop.visible has display:block', () => {
    const rule = css.match(/\.nav-backdrop\.visible\s*\{[^}]*display\s*:\s*block/);
    assert.ok(rule, '.nav-backdrop.visible must have display:block');
  });
});

describe('Sidebar JS: no safety mechanism in render()', () => {
  it('controller.js must NOT contain window.innerWidth>700 safety check', () => {
    const hasCheck = js.includes('window.innerWidth>700');
    assert.ok(!hasCheck, 'controller.js must NOT contain window.innerWidth>700 safety check');
  });

  it('controller.js must NOT contain inline style.cssText hiding sidebar', () => {
    const hasHide = js.includes("style.cssText='display:none!important");
    assert.ok(!hasHide, 'controller.js must NOT contain inline style.cssText hiding sidebar');
  });
});

describe('Sidebar JS: sidebarOpen state management', () => {
  it('sidebarOpen is only toggled by menu click (action===menu)', () => {
    const menuLines = js.match(/if\(action==='menu'\)\{ui\.sidebarOpen=!ui\.sidebarOpen/g);
    assert.ok(menuLines && menuLines.length === 1, 'sidebarOpen must only be toggled by menu action');
  });

  it('hashchange handler always resets sidebarOpen to false', () => {
    const hashchangeMatch = js.match(/addEventListener\('hashchange'.*ui\.sidebarOpen=false/s);
    assert.ok(hashchangeMatch, 'hashchange handler must set ui.sidebarOpen=false');
  });

  it('Escape key handler resets sidebarOpen to false', () => {
    const escapeMatch = js.match(/key==='Escape'.*ui\.sidebarOpen=false/s);
    assert.ok(escapeMatch, 'Escape key handler must set ui.sidebarOpen=false');
  });

  it('no code sets sidebarOpen=true directly (only toggle)', () => {
    const setTrue = js.match(/ui\.sidebarOpen\s*=\s*true/g);
    assert.ok(!setTrue, 'No code must set sidebarOpen=true directly; only toggle is allowed');
  });
});
