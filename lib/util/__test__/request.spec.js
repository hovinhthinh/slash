import rewire from 'rewire';

describe('request', function () {
  beforeEach(function () {
    this.request = rewire('../request');
  });

  it('should retry after failure', function *() {
    let get = sinon.stub();

    get.onCall(0).throws();
    get.onCall(1).throws();
    get.onCall(2).returns({ body: 'Hello world!' });

    this.request.__set__('connection', { attempt: 3 });
    this.request.__set__('request', { get: get });

    let body = yield this.request('http://hello.world');

    expect(get).to.have.been.calledThrice;
    expect(body).to.equal('Hello world!');
  });
});
