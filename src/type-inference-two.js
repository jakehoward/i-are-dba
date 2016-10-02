const _ = require('lodash');
const bigInt = require('big-integer');
const bigDecimal = require('big-decimal');
const { max, contains } = require('./utils');
const { calculatePrecision } = require('./decimal');

function inferType (dbEngine, column) {
  if (dbEngine != 'REDSHIFT') {
    throw new Error('Unsupported db engine for column type inference');
  }

  // Type filters is a stack of stacks. When a check fails, it gets popped off.
  // Winning type is last one left standing, order of preference is top to bottom, left to right.
  // Filters in the same group should be generalisations of each other, with the right hand side being 
  // most general (e.g. all INTEGER's can be VARCHAR's)
  const treeOfTypeFilters = [
    [{ fn: isBoolean, t: 'BOOLEAN' }],
    /*[{ fn: isDate, t: 'DATE' }, { fn: isDateTime, t: 'DATETIME' }],*/
    [{ fn: isSmallInt, t: 'SMALLINT' }, { fn: isInt, t: 'INTEGER' }, { fn: isBigInt, t: 'BIGINT' }] /*, { fn: isDecimal, t: 'DECIMAL' } ]*/
  ];
  
  const filteredTree = _.reduce(column, (acc, value) => {
    const remainingTree = _.map(acc.treeOfTypeFilters, (typeFilters) => {
      const remainingTypeFilters = _.filter(typeFilters, (tf) => { return tf.fn(value); });

      return remainingTypeFilters;
    });

    const valueIsDecimal = isDecimal(value);
    const decimalPrecision = valueIsDecimal ? calculatePrecision(value) : 0;
    const decimalScale = 0; //valueIsDecimal ? calculateDecimalScale(value) : 0;

    return {
      treeOfTypeFilters: remainingTree,
      decimal: { maxPrecision: max(acc.decimal.maxPrecision, decimalPrecision), maxScale: max(acc.decimal.maxScale, decimalScale) }
    };
  }, { treeOfTypeFilters, decimal: { maxPrecision: 0, maxScale: 0 } }).treeOfTypeFilters;

  return _.head(_.flatten(filteredTree)).t; // out of the filters left over, take the first one (best match)
  throw new Error('No type inferred for column');
}

function isBoolean(value) {
  const allowedValues = [0, 1, true, false, 'true', 'false', 'yes', 'no', 'y', 'n', '1', '0', 't', 'f'];

  const v = value.constructor === String ? value.toLowerCase() : value;
  if (!contains(allowedValues, v)) {
    return false ;
  }
  return true;
};

function isSmallInt(value) {
  const max = 32767;
  const min = -32768;

  if(isXInt(min, max, value)) {
    return true;
  }
  return false;
}

function isInt(value) {
  const max = 2147483647;
  const min = -2147483648;

  if(isXInt(min, max, value)) {
    return true;
  }
  return false;
}

function isBigInt(value) {
  const max = bigInt('9223372036854775807');
  const min = bigInt('-9223372036854775808');

  try {
    // will blow up if not a number
    const n = bigInt(value);
    if (n.greater(max) || n.lesser(min)) {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
}

function isDecimal(value) { // TODO: check this won't blow up with numbers that don't have a decimal point
  return false; //type: `DECIMAL(${precision},${scale})`;
}

function isXInt(min, max, value) {
  let n = Number(value);
  if (!Number.isInteger(n) || n > max || n < min) {
    return false;
  }

  return true;
}

module.exports = inferType;
