import rewire from 'rewire';

describe('url', function () {
  beforeEach(function () {
    this.url = rewire('../url');
  });

  it('#normalize()', function *() {
    let normalized = this.url.normalize('https://mp3.zing.vn/?b=b&a=a');
    expect(normalized).to.equal('https://mp3.zing.vn/?a=a&b=b');

    normalized = this.url.normalize('https://www.nhaccuatui.com');
    expect(normalized).to.equal('https://www.nhaccuatui.com');

    normalized = this.url.normalize('http://www.nhaccuatui.com');
    expect(normalized).to.equal('http://www.nhaccuatui.com');
  });

  it('#useHttp()', function *() {
    expect(this.url.useHttp('https://mp3.zing.vn/'))
      .to.equal('http://mp3.zing.vn/');
  });

  it('#useHttps()', function *() {
    expect(this.url.useHttps('http://mp3.zing.vn/'))
      .to.equal('https://mp3.zing.vn/');
  });
});
