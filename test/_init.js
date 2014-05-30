var chai = require("chai");
var chaiGulpHelpers = require("chai-gulp-helpers");

chai.should();
chai.use(chaiGulpHelpers);

global.expect = chai.expect;
