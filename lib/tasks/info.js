import request from '../util/request';
import Site from '../models/site';

export default function *info(argv) {
  if (!argv.url) {
    return console.log('Please specify url.');
  }
  console.log('Getting info:', argv.url);

  let sites = Site.getAll().map(site => new site());

  let found = false;

  for (let site of sites) {
    let cf = site.getStoreConfig(argv.url);
    if (cf) {
      found = true;
      console.log('Found site:', site.name, '| collection:', cf.collection);
      let page = { url: argv.url, config: cf };

      try {
        console.log('Fetching...');
        page.content = yield request(page.url);
      } catch (err) {
        console.log(err + ' at ' + page.url);
        continue;
      }

      page.optionals = [];
      let optionals = site.getAssociatedUrls(page);
      let currentOpt;
      let flag = true;
      try {
        console.log('Fetching optionals...');
        for (let opt of optionals) {
          currentOpt = opt;
          let oc = yield request(opt);
          if (!oc) {
            flag = false;
          }
          page.optionals.push({
            url: opt,
            content: oc ? oc : null
          });
        }
      } catch (err) {
        console.log(err + ' at optional ' + currentOpt);
        continue;
      }

      page.info = flag ? site.extractModel(page) : null;

      console.log('Info:', page.info);
    }
  }

  if (!found) {
    console.log('Not found any sites for required url.');
  }
}
