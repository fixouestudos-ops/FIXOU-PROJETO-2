export function fixouLogo(className = '') {
  return `<span class="fixou-logo${className ? ' ' + className : ''}">`
    + '<img class="fixou-logo-void" src="assets/fixou-logo-pilula-vazada.png" alt="FIXOU" decoding="async">'
    + '<img class="fixou-logo-fill" src="assets/fixou-logo-pilula.png" alt="FIXOU" decoding="async">'
    + '</span>';
}
