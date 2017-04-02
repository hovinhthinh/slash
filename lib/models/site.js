import { parse as parseUrl } from 'url';
import sites from '../sites.json';
import { default as Condition } from '../util/condition.js';

export default class Site {
  constructor(name) {
    this.name = name;
  }

  isWhitelisted(url) {
    return this.getStoreConfig(url) != null;
  }

  isBlacklisted(url) {
    return false;
  }

  getRecrawlingDelay(url) {
    if (Condition.isSlashUrl().isTrue(parseUrl(url))) {
      return 1 * 24 * 60 * 60 * 1000;
    }
    return 31 * 24 * 60 * 60 * 1000;
  }

  getFailRecrawlingDelay(url) {
    return 1 * 24 * 60 * 60 * 1000;
  }

  getStoreConfig(url) {
    return null;
  }

  getAssociatedUrls(page) {
    return [];
  }

  extractUrls(page) {
    if (this.isBlacklisted(page.url) || !page.content) {
      return [];
    }

    return this._extractUrls(page)
      .filter(url => !this.isBlacklisted(url));
  }

  extractModel(page) {
    return this._extractModel(page);
  }

  _extractUrls() {
    throw new Error('Not implemented!');
  }

  _extractModel() {
    throw new Error('Not implemented!');
  }
}

Site.getAll = function () {
  return sites.map(name => this.get(name));
};

Site.get = function (name) {
  return require('../sites/' + name);
};

Site.isWhitelisted = function (url) {
  return this.getAll()
    .some(site => site.isWhitelisted(url));
};

Site.isBlacklisted = function (url) {
  return this.getAll()
    .every(site => site.isBlacklisted(url));
};
