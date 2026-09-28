/** Resolve `<html class="dark">` on the server from theme cookie (+ system preference hint).
 * App is light-only — always return no dark class.
 */
export async function getServerHtmlThemeClass() {
  return '';
}

export async function getServerInitialTheme() {
  return 'light';
}
