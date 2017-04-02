# slash

The web information extraction crawler.
Currently implemented for mp3.zing.vn and nhaccuatui.com

Use Nodejs for crawler, MongoDB for storing crawled data, Redis for urlqueue.
## Installation

```sh
npm install
cp config/connection.js.example config/connection.js
cp config/database.js.example config/database.js
```

## Usage

Start MongoDB, Redis in advance and then:

```sh
npm link
slash push -s zing -u http://mp3.zing.vn/
slash crawl -s zing -w 1
```
