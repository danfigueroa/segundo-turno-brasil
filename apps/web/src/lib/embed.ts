import { selectionPath, type Selection } from './selection';

/** True on the embeddable view, `/?embed#/ba`: just the result card, for other sites. */
export function isEmbed(search: string = window.location.search): boolean {
  return new URLSearchParams(search).has('embed');
}

/** Link to the full site at the same scope and round hash. */
export function fullSiteUrl(hash: string = window.location.hash): string {
  return `/${hash}`;
}

/** The `<iframe>` a blog or portal pastes to show the live result of a scope. */
export function embedCode(origin: string, selection: Selection): string {
  const src = `${origin}/?embed#/${selectionPath(selection)}`;
  return `<iframe src="${src}" title="Apuração ao vivo · Segundo Turno" width="100%" height="620" style="border:0;max-width:640px" loading="lazy"></iframe>`;
}
