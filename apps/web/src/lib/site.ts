/**
 * The production address, fixed at build time: shared images, texts and embeds point here
 * even when the site is opened from another domain, a preview or localhost.
 */
export const SITE_URL = __SITE_URL__;

/** The production host, as written on shared images ("eleicao.danielfigueroa.dev"). */
export const SITE_HOST = new URL(SITE_URL).host;
