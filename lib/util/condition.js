/**
 * Created by hovinhthinh on 3/20/15.
 */
import { default as Tparser } from '../util/tparser.js';

let condition = {
  or: function () {
    let conditions = arguments;
    return {
      isTrue: function (url) {
        for (let i = 0; i < conditions.length; ++i) {
          if (conditions[i].isTrue(url)) {
            return true;
          }
        }
        return false;
      }
    };
  },

  and: function () {
    let conditions = arguments;
    return {
      isTrue: function (url) {
        for (let i = 0; i < conditions.length; ++i) {
          if (!conditions[i].isTrue(url)) {
            return false;
          }
        }
        return true;
      }
    };
  },

  not: function (condition) {
    return {
      isTrue: function (url) {
        return !condition.isTrue(url);
      }
    };
  },

  alwaysTrue: function () {
    return {
      isTrue: function () {
        return true;
      }
    };
  },

  pathBeginsWithSomeOfPrefixes: function () {
    let prefixes = arguments;
    return {
      isTrue: function (url) {
        let path = url.pathname;
        for (let i = 0; i < prefixes.length; ++i) {
          if (path.indexOf(prefixes[i]) === 0) {
            return true;
          }
        }
        return false;
      }
    };
  },

  pathEndsWithSomeOfSuffixes: function () {
    let suffixes = arguments;
    return {
      isTrue: function (url) {
        let path = url.pathname;
        for (let i = 0; i < suffixes.length; ++i) {
          if (path.indexOf(suffixes[i],
            path.length - suffixes[i].length) !== -1) {
            return true;
          }
        }
        return false;
      }
    };
  },

  pathContainsSomeOfSubstrings: function () {
    let substrings = arguments;
    return {
      isTrue: function (url) {
        let path = url.pathname;
        for (let i = 0; i < substrings.length; ++i) {
          if (path.indexOf(substrings[i]) !== -1) {
            return true;
          }
        }
        return false;
      }
    };
  },

  containsSomeOfParameters: function () {
    let params = {};
    for (let i = 0; i < arguments.length; ++i) {
      params[arguments[i]] = true;
    }
    return {
      isTrue: function (url) {
        if (params.length === 0) {
          return true;
        }
        let query = url.query;
        if (!query) {
          return false;
        }
        let arr = query.split(/[&\\?]+/);
        for (let i = 0; i < arr.length; ++i) {
          if (arr[i]) {
            let pos = arr[i].indexOf('=');
            if (pos !== -1) {
              arr[i] = arr[i].substr(0, pos);
            }
            if (params[arr[i]]) {
              return true;
            }
          }
        }
        return false;
      }
    };
  },

  hostBelongsTo: function () {
    let hosts = {};
    for (let i = 0; i < arguments.length; ++i) {
      hosts[arguments[i]] = true;
    }
    return {
      isTrue: function (url) {
        if (hosts[url.hostname]) {
          return true;
        } else {
          return false;
        }
      }
    };
  },

  isSlashUrl: function () {
    return {
      isTrue: function (url) {
        if (url.query) {
          return false;
        }
        let path = url.pathname;
        if (!path) {
          return true;
        }
        if (path === '' || path === '/') {
          return true;
        }
        return false;
      }
    };
  },

  pathContainsRegex: function (regex) {
    let rg = regex;
    return {
      isTrue: function (url) {
        if (Tparser.getMatch(url.pathname, rg)) {
          return true;
        }
        return false;
      }
    };
  }
};

export default condition;
