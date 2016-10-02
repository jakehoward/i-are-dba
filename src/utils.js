const _ = require('lodash');

function max() {
  if (arguments.length === 1) {
    return _.head(arguments);
  }
  return _.reduce(_.tail(arguments), (max, i) => i > max ? i : max, _.head(arguments));
}

function contains (iterable, value) {
  return _.filter(iterable, (v) => v === value).length > 0;
}

module.exports = {
  max,
  contains
};
