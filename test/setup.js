'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import 'gulp-mocha';
import 'co-mocha';

chai.use(sinonChai);

global.expect = chai.expect;
global.sinon = sinon;
