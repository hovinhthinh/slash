import Promise from 'bluebird';
import consume from 'stream-consume';
import eos from 'end-of-stream';

export default function (stream) {
  var opts = {
    error: true,
    readable: stream.readable,
    writable: stream.writable && !stream.readable
  };

  return Promise.fromNode(function (cb) {
    eos(stream, opts, cb);
    consume(stream);
  });
}
