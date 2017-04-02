import { load as toDom } from 'cheerio';
import { parse as parseUrl, resolve as resolveUrl } from 'url';
import { default as Condition } from '../util/condition.js';
import { default as crypto } from 'crypto';
import { default as Tparser } from '../util/tparser.js';

import Site from '../models/site';

let NAME = 'nct';

let filterCondition = Condition.or(
  Condition.not(Condition.hostBelongsTo('www.nhaccuatui.com')),
  Condition.and(
    Condition.hostBelongsTo('www.nhaccuatui.com'),
    Condition.or(
      Condition.and(
        Condition.pathBeginsWithSomeOfPrefixes('/bai-hat/top-20.'),
        Condition.pathContainsSomeOfSubstrings('.tuan-')
      ),
      Condition.containsSomeOfParameters('st'),
      Condition.pathBeginsWithSomeOfPrefixes('/user/', '/fb', '/tim_kiem',
        '/video', '/tim-kiem'),
      Condition.pathContainsSomeOfSubstrings('/m/', '/l/', '/xem-clip/'),
      Condition.pathEndsWithSomeOfSuffixes('/tim_nang_cao'),
      Condition.pathContainsRegex('^/[\\w\\-]+$')
    )
  )
);

let trackCondition = Condition.and(
  Condition.hostBelongsTo('www.nhaccuatui.com'),
  Condition.pathContainsRegex('^/bai-hat/[\\w\\-]+\\.\\w+\\.html$')
);
let artistCondition = Condition.and(
  Condition.hostBelongsTo('www.nhaccuatui.com'),
  Condition.and(
    Condition.pathBeginsWithSomeOfPrefixes('/nghe-si-'),
    Condition.pathEndsWithSomeOfSuffixes('tieu-su.html')
  )
);

let extractId = function (pageContent) {
  if (!pageContent) {
    return null;
  }
  let id = pageContent.match(/var songid = "\d+";/);
  if (id) {
    id = id[0].match(/\d+/);
    if (id) {
      return id[0];
    }
  }
  return null;
};

let DEVICE_INFO = '{"DeviceID":"90c18c4cb3c37d442e8386631d46b46f","OsName":' +
  '"ANDROID","OsVersion":"10","AppName":"NhacCuaTui","AppVersion":"5.0.1",' +
  '"UserInfo":"","LocationInfo":""}';

let storeConfigs = [
  {
    condition : trackCondition,
    collection : 'tracks',
    extractAssociatedUrls : function (page) {
      let id = extractId(page.content);
      if (id) {
        let token = crypto.createHash('md5').update('get-song-info' + id +
          'nct@asdgvhfhyth' + '9999999999999').digest('hex');
        let api = 'http://api.m.nhaccuatui.com/mobile/v5.0/api?secretkey=nct' +
          '@mobile_service&action=get-song-info&deviceinfo=' + DEVICE_INFO +
          '&userid=0&songid=' + id + '&time=9999999999999&token=' + token;
        return [ api ];
      }
      return [];
    },
    extractModel : function (page) {
      try {
        let doc = JSON.parse(page.optionals[0].content);

        if (!doc) {
          return null;
        }

        doc = doc['Data'];

        let res = {
          source: 'nct',
          title: doc['SongTitle'],
          artist: doc['Singername'],
          duration: doc['Duration'],
          listenCount: doc['Listened'],
          url: page.url,
          image: [],
          audio: {}
        };

        if (doc['Image']) {
          res.image.push(doc['Image']);
        }
        if (doc['Linkdown']) {
          res['audio']['normal'] = doc['Linkdown'];
        }
        if (doc['LinkdownHQ']) {
          res['audio']['hq'] = doc['LinkdownHQ'];
        }

        let str = Tparser.getMatch(page.content,
          '<meta content="[^>]*" itemprop="genre" />');
        if (str) {
          str = Tparser.getContent(str, '<meta content="', '"');
          if (str) {
            res['genre'] = str;
          }
        }

        let lyric = Tparser.getContent(page.content,
          '<p id="divLyric"[^>]*>', '</p>');
        if (lyric) {
          lyric = lyric.replace(/<br \/>/g, '|').replace(/\s+/g, ' ');
        }
        res['lyric'] = lyric;

        return res;
      } catch (e) {
        return null;
      }
    }
  },
  {
    condition : artistCondition,
    collection : 'artists',
    extractAssociatedUrls : function (page) {
      return [];
    },
    extractModel : function (page) {
      try {
        let res = {
          source: 'nct',
          url: page.url,
          image: [],
        };
        res['name'] =  Tparser.simpleRemoveTag(
          Tparser.getContent(page.content, '<h1>', '</h1>'));
        res['realName'] =
          Tparser.getContent(page.content, 'Tên thật: <strong>', '</strong>');
        res['dob'] =
          Tparser.getContent(page.content, 'Sinh nhật: <strong>', '</strong>');
        res['country'] =
          Tparser.getContent(page.content, 'Quốc gia: <strong>', '</strong>');
        res['description'] = Tparser.simpleRemoveTag(
          Tparser.getContent(page.content,
            '<p class="content_info"[^>]*>', '</p>'));
        let img = Tparser.getContent(page.content,
          '<meta property="og:image" content="', '"/>');
        if (img) {
          res.image.push(img);
        }

        try {
          img = Tparser.getContent(
            toDom(page.content)('.box_cover_singer').html(),
            'src="', '"');
          if (img) {
            res.image.push(img);
          }
        } catch (err) {
        }

        return res;
      } catch (e) {
        return null;
      }
    }
  }
];

let prioritizedUrl = Condition.or(
  Condition.isSlashUrl(),
  Condition.pathBeginsWithSomeOfPrefixes('/bai-hat/top-20.'),
  Condition.pathContainsRegex('^/playlist/[\\w\\-]*-moi(-nhat)?\\.html')
);

export default class Nct extends Site {
  constructor() {
    Site.call(this, NAME);
  }

  getStoreConfig(url) {
    url = parseUrl(url);
    for (let cf of storeConfigs) {
      if (cf.condition.isTrue(url)) {
        return cf;
      }
    }
    return null;
  }

  isBlacklisted(url) {
    return filterCondition.isTrue(parseUrl(url));
  }

  getRecrawlingDelay(url) {
    if (prioritizedUrl.isTrue(parseUrl(url))) {
      return 1 * 24 * 60 * 60 * 1000;
    }
    return 31 * 24 * 60 * 60 * 1000;
  }

  getAssociatedUrls(page) {
    if (!page.config) {
      return [];
    }
    return page.config.extractAssociatedUrls(page);
  }

  _extractUrls(page) {
    let $ = toDom(page.content);
    let extracted = [];

    $('a').each(function () {
      let href = $(this).attr('href');
      if (href) {
        let resolved = resolveUrl(page.url, href);
        extracted.push(resolved);
      }
    });

    return extracted;
  }

  _extractModel(page) {
    return page.config.extractModel(page);
  }
}
