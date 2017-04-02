import { format as formatUrl } from 'url';

import request from 'co-request';
import defaults from 'defaults';

import config from '../../config/connection';

let defaultOpts = {
  gzip: true,
  timeout: config.timeout,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1;' +
      ' +http://www.google.com/bot.html)',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en-us;q=0.7,en;q=0.3',
    'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.7',
    'Connection': 'close'
  }
};

let proxy = config.proxy || {};

if (proxy.host) {
  let auth = (proxy.username || '') +
    (proxy.password ? ':' + proxy.password : '');

  defaultOpts.proxy = formatUrl({
    protocol: 'http',
    hostname: proxy.host,
    port: proxy.port,
    auth: auth
  });
}

export default function *(url) {
  let opts = defaults({ url: url }, defaultOpts);
  let attempt = config.attempt || 1;

  for (let i = attempt; i > 0; --i) {
    try {
      let res = yield request.get(opts);
      return res.body;
    } catch (err) {
      if (i <= 1) {
        throw err;
      }

      // FIXME: Handles errors.
    }
  }
}
