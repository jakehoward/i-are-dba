const _ = require('lodash');

function forAll(iterable, assertion) {
  _.forEach(iterable, (d) => {
    try {
      assertion(d);
    } catch (e) {
      e.message += ' for: ' + JSON.stringify(d);
      throw e;
    }
  });
}

module.exports = forAll;
