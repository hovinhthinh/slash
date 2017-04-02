import cluster from 'cluster';
import os from 'os';

import Promise from 'bluebird';
import co from 'co';
import program from 'commander';

let numCpus = os.cpus().length;

export default function invoke(task, numWorker = 1) {
  prepare(program, task, numWorker)
    .then(done, fail);
}

function prepare(argv, start) {
  return new Promise((resolve, reject) => {
    if (cluster.isMaster) {
      let numWorker = argv['num_worker'] || 1;
      let numProcess = argv['num_process'] || numCpus;
      let numForkWorker = [];

      for (let i = 0; i < numProcess; ++i) {
        if (i < numWorker % numProcess) {
          numForkWorker.push(Math.floor(numWorker / numProcess) + 1);
        } else {
          numForkWorker.push(Math.floor(numWorker / numProcess));
        }
      }

      for (let i = 0; i < numProcess; ++i) {
        if (numForkWorker[i] > 0) {
          let argument = process.argv.slice(2);
          for (let j = 0; j < argument.length - 1; ++j) {
            if (argument[j] === '-w') {
              argument[j + 1] = numForkWorker[i];
              break;
            }
          }
          cluster.setupMaster({ args: argument });
          cluster.fork();
        }
      }

      cluster.on('exit', (worker, code) => {
        if (code) {
          // TODO: Adds error message.
          return reject(new Error());
        }

        if (!--numWorker) {
          resolve();
        }
      });

    } else {
      let n = argv['num_worker'] || 1;
      for (let i = 0; i < n; ++i) {
        co(function *() { return yield start(argv); })
          .then(resolve, reject);
      }
    }
  });
}

function done() {
  process.exit(0);
}

function fail(err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
}
