import { parse as parseUrl, resolve as resolveUrl } from 'url';
import { default as Condition } from '../util/condition.js';
import { load as toDom } from 'cheerio';
import { default as Tparser } from '../util/tparser.js';

import Site from '../models/site';

let NAME = 'zing';

let filterCondition = Condition.or(
  Condition.not(Condition.hostBelongsTo('mp3.zing.vn')),
  Condition.and(
    Condition.hostBelongsTo('mp3.zing.vn'),
    Condition.or(
      Condition.containsSomeOfParameters('st', 'sort', 'filter', 'view'),
      Condition.pathContainsSomeOfSubstrings('/embed/', '/ajax/ca-si/',
        '/ajax/nghe-si/'),
      Condition.pathBeginsWithSomeOfPrefixes('/downloads/song/', '/thong-bao/',
        '/blog/', '/cache/', '/download/', '/html5/', '/log/', '/login/',
        '/test/', '/thongbao/', '/share/', '/suggest/', '/vip-free/', '/xml/',
        '/video-clip/', '/the-loai-video', '/mymusic', '/tim-kiem/')
    )
  )
);

let trackCondition = Condition.and(
  Condition.hostBelongsTo('mp3.zing.vn'),
  Condition.pathContainsRegex('^/bai-hat/[\\w\\-]+/\\w+\\.html$')
);

let artistCondition = Condition.and(
  Condition.hostBelongsTo('mp3.zing.vn'),
  Condition.and(
    Condition.pathBeginsWithSomeOfPrefixes('/nghe-si/'),
    Condition.pathEndsWithSomeOfSuffixes('/tieu-su')
  )
);

let extractId = function (url) {
  let suffix = url.match(/[A-Z\d]+.html/);
  if (suffix) {
    let id = suffix[0].match(/[A-Z\d]+/);
    if (id) {
      return id[0];
    }
  }
  return null;
};

let storeConfigs = [
  {
    condition : trackCondition,
    collection : 'tracks',
    extractAssociatedUrls : function (page) {
      let id = extractId(page.url);
      if (id) {
        let apiUrl = 'http://api.mp3.zing.vn/api/mobile/song/getsonginfo' +
          '?requestdata=%7B%22id%22:%22' + id +
          '%22%7D&keycode=b319bd16be6d049fdb66c0752298ca30&fromvn=true';
        return [ apiUrl ];
      }
      return [];
    },
    extractModel : function (page) {
      try {
        let doc = JSON.parse(page.optionals[0]['content']);

        if (!doc) {
          return null;
        }

        let res = {
          source: 'zing',
          title: doc['title'],
          artist: doc['artist'],
          author: doc['composer'],
          duration: doc['duration'],
          listenCount: doc['total_play'],
          url: page.url,
          genre: doc['genre_name'],
          audio: {},
          image: []
        };
        if (doc['link_download']['128']) {
          res['audio']['128'] = doc['link_download']['128'];
        }
        if (doc['link_download']['320']) {
          res['audio']['320'] = doc['link_download']['320'];
        }
        if (doc['link_download']['lossless']) {
          res['audio']['lossless'] = doc['link_download']['lossless'];
        }

        let album = Tparser.getContent(page.content, '<span>Album:', '</div>');
        if (album) {
          album = Tparser.simpleRemoveTag(album);
        }
        res['album'] = album;

        let lyric = Tparser.getContent(page.content,
          '<p class="fn-wlyrics fn-content"[^>]*>', '</p>');
        if (lyric) {
          lyric = lyric.replace(/<br>/g, '|').replace(/\s+/g, ' ');
        }
        res['lyric'] = lyric;

        let img = Tparser.getContent(page.content,
          '<meta property="og:image" content="', '" />');
        if (img) {
          res.image.push(img);
        }

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
          source: 'zing',
          url: page.url,
          image: [],
        };
        res['name'] = Tparser.simpleRemoveTag(
          Tparser.getContent(page.content, '<h1>', '</h1>'));
        res['realName'] =
          Tparser.getContent(page.content, '<li>Tên thật:\\s+', '</li>');
        res['dob'] =
          Tparser.getContent(page.content, '<li>Ngày sinh:\\s+', '</li>');
        res['country'] =
          Tparser.getContent(page.content, '<li>Quốc Gia:\\s+', '</li>');
        res['genre'] =
          Tparser.simpleRemoveTag(Tparser.getContent(
            page.content, '<li>Thể loại:\\s+', '</li>'));
        res['description'] = Tparser.simpleRemoveTag(
          Tparser.getContent(page.content, '<div class="entry">', '</div>')
          .replace(/<ul[^>]*>.*<\/ul>/, ''));
        let img = Tparser.getContent(page.content,
          '<div class="inside">\\s*<img[^>]*src="', '"');
        if (img) {
          res.image.push(img);
        }

        img = Tparser.getContent(page.content,
          '<img height="350" src="', '"');
        if (img) {
          res.image.push(img);
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
  Condition.pathBeginsWithSomeOfPrefixes('/bang-xep-hang/', '/top100/'),
  Condition.and(
    Condition.pathBeginsWithSomeOfPrefixes('/the-loai-'),
    Condition.not(Condition.containsSomeOfParameters('page'))
  )
);

export default class Zing extends Site {
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
    let extracted = [];

    let $ = toDom(page.content);

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
