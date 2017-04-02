export default class Page {
  constructor(url, content) {
    this.url = url;
    this.content = (content ? new Buffer(content) : null);
  }
}
