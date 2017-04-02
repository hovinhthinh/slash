import rewire from 'rewire';

describe('zing', function () {
  beforeEach(function () {
    this.zing = new (rewire('../zing.js'))();
  });

  it ('#isWhitelisted()', function *() {
    let url = 'http://mp3.zing.vn';
    expect(this.zing.isWhitelisted(url)).to.equal(false);

    url = 'http://mp3.zing.vn/bai-hat/Khuon-Mat-Dang-Thuong-Son-Tung-M-TP/' +
      'ZW70UUZF.html';
    expect(this.zing.isWhitelisted(url)).to.equal(true);
  });

  it ('#isBlacklisted()', function *() {
    let url = 'http://mp3.zing.vn';
    expect(this.zing.isBlacklisted(url)).to.equal(false);

    url = 'http://api.mp3.zing.vn/api/mobile/song/getsonginfo?' +
    'requestdata=%7B%22id%22:%22ZW70UWO6%22%7D' +
    '&keycode=b319bd16be6d049fdb66c0752298ca30&fromvn=true';
    expect(this.zing.isBlacklisted(url)).to.equal(true);

    url = 'http://vnexpress.net';
    expect(this.zing.isBlacklisted(url)).to.equal(true);
  });
});
