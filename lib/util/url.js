import normalizeUrl from 'normalize-url';
import { parse as parseUrl, format as formatUrl } from 'url';

export function normalize(url) {
  let normalized = normalizeUrl(url);

  if (url.indexOf('https://www.') === 0) {
    normalized = normalized.replace('https://', 'https://www.');
  } else if (url.indexOf('http://www.') === 0) {
    normalized = normalized.replace('http://', 'http://www.');
  }

  return normalized;
}

export function useHttp(url) {
  url = parseUrl(url);
  url.protocol = 'http';
  url = formatUrl(url);
  return url;
}

export function useHttps(url) {
  url = parseUrl(url);
  url.protocol = 'https';
  url = formatUrl(url);
  return url;
}
