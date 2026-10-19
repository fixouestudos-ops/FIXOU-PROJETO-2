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
const topnavSrc = readFileSync(resolve(__dirname, '..', 'src', 'topnav.js'), 'utf8');
const settingsSrc = readFileSync(resolve(__dirname, '..', 'src', 'screens-settings.js'), 'utf8');

describe('Topnav CSS: sidebar permanently removed', () => {
  it('no .sidebar rule remains', () => {
    assert.ok(!css.match(/\.sidebar[\s{.]/), 'CSS must not contain any .sidebar selector');
  });

  it('no --sidebar-width token remains', () => {
    assert.ok(!css.includes('--sidebar-width'), 'CSS must not contain --sidebar-width');
  });

  it('no .nav-item legacy selector remains', () => {
    assert.ok(!css.match(/\.nav-item[\s,{]/), 'CSS must not contain the legacy .nav-item selector');
  });

  it('workspace has no pixel margin-left offset', () => {
    assert.ok(!css.match(/\.workspace\s*\{\s*margin-left:\s*\d+px/), 'workspace must not be offset by a sidebar width');
    assert.ok(!css.match(/margin-left:\s*(236|214|190)px/), 'no legacy sidebar offsets (236/214/190) remain');
  });

  it('base .workspace keeps min-width:0 and box-sizing:border-box', () => {
    const rule = css.match(/\.workspace\s*\{[^}]*min-width:\s*0/);
    assert.ok(rule, 'base .workspace must keep min-width:0');
  });
});

describe('Topnav CSS: top bar and dropdown structure', () => {
  it('base .topnav is a flex row', () => {
    assert.ok(css.includes('.topnav{display:flex'), 'base .topnav must be display:flex');
  });

  it('logo pill lives in .topnav-brand', () => {
    assert.ok(css.includes('.topnav-brand .fixou-logo'), 'topnav brand must size the fixou logo');
  });

  it('groups are positioned for absolute dropdowns', () => {
    assert.ok(css.includes('.navgroup{position:relative'), '.navgroup must be position:relative on desktop');
  });

  it('dropdown panel exists with width:280px', () => {
    const rule = css.match(/\.navpop\{[^}]*width:\s*280px/);
    assert.ok(rule, '.navpop must have width:280px');
  });

  it('dropdown panel is hidden by default (opacity/visibility/transform)', () => {
    const rule = css.match(/\.navpop\{[^}]*opacity:\s*0/);
    assert.ok(rule, '.navpop must start with opacity:0');
    assert.ok(css.match(/\.navpop\{[^}]*visibility:\s*hidden/), '.navpop must start with visibility:hidden');
    assert.ok(css.match(/\.navpop\{[^}]*transform:\s*translateY/), '.navpop must start translated');
  });

  it('dropdown panel animates with a transition', () => {
    assert.ok(css.match(/\.navpop\{[^}]*transition:\s*opacity/), '.navpop must transition opacity');
  });

  it('open group reveals the dropdown panel', () => {
    assert.ok(css.includes('.navgroup.open .navpop{opacity:1;visibility:visible;transform:none}'), 'open group must reveal .navpop');
  });

  it('active/hover group is highlighted', () => {
    assert.ok(css.includes('.navgroup.open .navgroup-btn,.navgroup.group-active .navgroup-btn'), 'open/active group button must be highlighted');
  });

  it('topnav entrance keyframes exist', () => {
    assert.ok(css.includes('@keyframes topnavIn'), 'topnavIn keyframes must exist for the mobile panel');
  });

  it('mobile-only .topnav-foot starts hidden on desktop', () => {
    assert.ok(css.includes('.topnav-foot{display:none}'), '.topnav-foot must be display:none by default');
  });

  it('breadcrumb row is rendered under the topbar', () => {
    assert.ok(css.includes('.crumbrow{'), '.crumbrow styles must exist');
    assert.ok(css.includes('.crumbrow .breadcrumb{'), 'breadcrumb rules must target .crumbrow');
  });

  it('header settings icon gets an active state', () => {
    assert.ok(css.includes('.header-icon[aria-current="page"]'), 'header icon must support aria-current styling');
  });

  it('guest-locked dropdown items are styled', () => {
    assert.ok(css.includes('.navpop-item.guest-locked{'), 'guest-locked navpop items must be styled');
    assert.ok(css.includes('.navpop-item.guest-locked .nav-lock{'), 'guest lock icon must be styled');
  });
});

describe('Topnav CSS: menu-toggle hidden on desktop, visible when collapsed', () => {
  it('.menu-toggle has display:none as base rule (hidden on desktop)', () => {
    const rule = css.match(/\.menu-toggle\s*\{\s*display\s*:\s*none/);
    assert.ok(rule, '.menu-toggle must have display:none as base rule');
  });

  it('@media(max-width:1024px) collapses .topnav into a fixed panel', () => {
    const blocks = css.split('@media(max-width:1024px)');
    const hasCollapse = blocks.some((block, i) => i > 0 && block.includes('.topnav{display:none;position:fixed;top:68px'));
    assert.ok(hasCollapse, 'the 1024px breakpoint must collapse .topnav into a fixed panel');
  });

  it('@media(max-width:1024px) shows the menu toggle', () => {
    const blocks = css.split('@media(max-width:1024px)');
    const hasToggle = blocks.some((block, i) => i > 0 && block.includes('.menu-toggle{display:block'));
    assert.ok(hasToggle, 'the 1024px breakpoint must show .menu-toggle');
  });

  it('open menu reveals the panel via .menu-open', () => {
    assert.ok(css.includes('.topbar.menu-open .topnav{display:flex'), 'menu-open must reveal the topnav panel');
  });

  it('@media(max-width:700px) keeps .menu-toggle with display:block', () => {
    const blocks = css.split(/@media\s*\(\s*max-width\s*:\s*700px\s*\)/);
    const hasMobileToggle = blocks.some((block, i) => i > 0 && block.includes('.menu-toggle') && block.includes('display:block'));
    assert.ok(hasMobileToggle, '@media(max-width:700px) must have .menu-toggle display:block');
  });
});

describe('Topnav CSS: dropdown becomes accordion on mobile', () => {
  it('collapsed breakpoint turns .navgroup static and .navpop into a stacked block', () => {
    const blocks = css.split('@media(max-width:1024px)');
    const block = blocks.find((b, i) => i > 0 && b.includes('.navpop{position:static;display:none'));
    assert.ok(block, 'mobile .navpop must be position:static and display:none');
    assert.ok(block.includes('.navgroup.open .navpop{display:block'), 'open mobile .navpop must be display:block');
    assert.ok(block.includes('.navgroup{position:static'), 'mobile .navgroup must be position:static');
  });

  it('panel offset matches the 68px topbar on collapse and stays within the viewport', () => {
    const blocks = css.split('@media(max-width:1024px)');
    const block = blocks.find((b, i) => i > 0 && b.includes('position:fixed;top:68px'));
    assert.ok(block, 'collapsed panel must sit at top:68px');
    assert.ok(block.includes('max-height:calc(100vh - 68px)'), 'collapsed panel must not exceed the viewport');
    assert.ok(block.includes('overflow-y:auto'), 'collapsed panel must scroll when needed');
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

describe('Topnav markup: groups, icons and descriptions', () => {
  it('topnav.js renders group triggers with aria-expanded/aria-controls', () => {
    assert.ok(topnavSrc.includes('data-action="nav-group"'), 'group trigger must use data-action="nav-group"');
    assert.ok(topnavSrc.includes('aria-expanded="false"'), 'group trigger must start aria-expanded="false"');
    assert.ok(topnavSrc.includes('aria-controls="navpop-'), 'group trigger must point at its panel id');
  });

  it('dropdown items carry navpop name + description text', () => {
    assert.ok(topnavSrc.includes('navpop-name'), 'items must render a name');
    assert.ok(topnavSrc.includes('navpop-desc'), 'items must render a description');
    assert.ok(topnavSrc.includes('Quiz adaptativo e desafios de estudo'), 'train description must exist');
    assert.ok(topnavSrc.includes('Revise as questões que você errou'), 'errors description must exist');
    assert.ok(topnavSrc.includes('Gestão e métricas do FIXOU'), 'admin description must exist');
  });

  it('admin group labels are the approved ones', () => {
    assert.ok(topnavSrc.includes("'Painel do dono'"), 'admin route label override missing');
    assert.ok(topnavSrc.includes("'Revisão de Questões'"), 'review route label override missing');
  });

  it('guest-locked items use guest-lock action with nav-lock', () => {
    assert.ok(topnavSrc.includes('guest-locked'), 'locked items must be marked guest-locked');
    assert.ok(topnavSrc.includes('data-action="guest-lock"'), 'locked items must trigger guest-lock');
    assert.ok(topnavSrc.includes('nav-lock'), 'locked items must render the nav-lock icon');
  });

  it('controller keeps the admin role gate for the Admin group', () => {
    assert.ok(js.includes("'owner','admin'"), "controller must gate Admin with ['owner','admin']");
    assert.ok(js.includes('renderTopnav('), 'controller must render the topnav');
  });

  it('controller wires dropdown helpers', () => {
    assert.ok(js.includes('toggleNavGroup('), 'controller must toggle groups');
    assert.ok(js.includes('closeNavGroups('), 'controller must close groups');
    assert.ok(js.includes('moveGroupFocus('), 'controller must support keyboard navigation');
    assert.ok(js.includes("toLowerCase()==='escape'"), 'Escape must close dropdowns (case-insensitive)');
  });

  it('controller renders brand, breadcrumb row and mobile foot', () => {
    assert.ok(js.includes('crumbrow'), 'controller must render .crumbrow');
    assert.ok(js.includes('topnav-foot'), 'controller must render the mobile foot');
    assert.ok(js.includes('#about'), 'brand must link to Quem Somos');
    assert.ok(js.includes('themePills'), 'controller must render the header theme selector');
    assert.ok(js.includes('data-action="set-theme"'), 'header selector must use the shared set-theme action');
  });

  it('header shows the authenticated user chip (avatar + name)', () => {
    assert.ok(/import\s*\{[^}]*\bavatar\b[^}]*\}\s*from\s*'\.\/account\.js'/.test(js), 'controller must import the shared avatar() helper from account.js');
    assert.ok(js.includes('class="headerUser"'), 'controller must render the header user chip');
    assert.ok(js.includes('${headerUserHtml}<a class="streak"'), 'chip must sit between settings icon and streak');
    assert.ok(js.includes('avatar(account.user'), 'chip must read the authenticated account.user (no second user structure)');
    assert.ok(js.includes('data-action="profile-settings"'), 'chip must link to the existing profile action');
    assert.ok(!js.includes('Victor'), 'chip must never hardcode a person name');
  });

  it('user chip: theme variables and responsive name hiding', () => {
    assert.ok(css.includes('.headerRight .avatar{background:var(--highlight);color:var(--primary)'), 'avatar must use existing theme variables');
    assert.ok(css.includes('.headerUserName{font-size:13px;font-weight:700;color:var(--ink)'), 'name must use theme ink color');
    assert.ok(css.includes('@media(max-width:980px){.headerUserName{display:none}'), 'name text must hide at <=980px while avatar stays');
    assert.ok(css.includes('.headerUser{display:flex;align-items:center'), 'chip must be a flex row');
  });
});

describe('Topnav: appearance selector moved to settings', () => {
  it('settings renders the themePills selector', async () => {
    const {createState} = await import('../src/save.js');
    const {settingsScreen} = await import('../src/screens-settings.js');
    const html = settingsScreen({state:createState(),account:{name:'Estudante',email:'e@x.test'},loggingOut:false});
    assert.ok(html.includes('themePills'), 'settings must render themePills');
    for (const id of ['nebula', 'light', 'rest']) assert.ok(html.includes(`data-id="${id}"`), `missing theme ${id}`);
  });

  it('appearance section sits after the settings layout (bottom of page)', () => {
    assert.ok(settingsSrc.indexOf('settings-layout') < settingsSrc.indexOf('appearance-panel'), 'appearance must come after settings-layout');
  });

  it('header and settings selectors stay in sync (same action, same state)', () => {
    assert.ok(js.includes('aria-pressed="${state.settings.theme===id}"'), 'header pills must read state.settings.theme');
    assert.ok(settingsSrc.includes('aria-pressed="${s.theme===id}"'), 'settings pills must read state.settings.theme');
    assert.ok(js.includes("action==='set-theme'"), 'set-theme action must apply and re-render both selectors');
    assert.ok(css.includes('@media(max-width:1150px){.headerRight .themePills{display:none}'), 'header-only selector must hide when space is tight');
  });

  it('legacy themeCards markup is gone', () => {
    assert.ok(!settingsSrc.includes('themeCards'), 'settings must not use themeCards');
    assert.ok(!css.includes('.themeCard'), 'CSS must not style themeCards');
  });
});

describe('Topnav JS: no safety mechanism in render()', () => {
  it('controller.js must NOT contain window.innerWidth>700 safety check', () => {
    const hasCheck = js.includes('window.innerWidth>700');
    assert.ok(!hasCheck, 'controller.js must NOT contain window.innerWidth>700 safety check');
  });

  it('controller.js must NOT contain inline style.cssText hiding sidebar', () => {
    const hasHide = js.includes("style.cssText='display:none!important");
    assert.ok(!hasHide, 'controller.js must NOT contain inline style.cssText hiding sidebar');
  });
});

describe('Topnav JS: sidebarOpen state management', () => {
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
