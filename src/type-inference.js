const _ = require('lodash');
const bigInt = require('big-integer');
const BigDecimal = require('big-decimal');
const moment = require('moment');
const { max, contains } = require('./utils');
const { calculatePrecision, calculateScale, calculateMagnitude } = require('./decimal');

function inferType (dbEngine, column) {
  if (dbEngine !== 'REDSHIFT') {
    throw new Error('Unsupported db engine for column type inference');
  }

  // Type filters is a stack of stacks. When a check fails, it gets popped off.
  // Winning type is best of those left standing, order of preference is top to bottom, left to right.
  // Filters in the same group should be generalisations of each other, with the right hand side being
  // most general (e.g. all INTEGER's can be BIGINT's)
  const treeOfTypeFilters = [
    [{ fn: isBoolean, t: 'BOOLEAN' }],
    [{ fn: isSmallInt, t: 'SMALLINT' }, { fn: isInt, t: 'INTEGER' }, { fn: isBigInt, t: 'BIGINT' }, { fn: isDecimal, t: 'DECIMAL' }],
    [{ fn: isDate, t: 'DATE' }, { fn: isDateTime, t: 'DATETIME' }],
    [{ fn: () => true, t: 'VARCHAR' }]
  ];

  const { filteredTree, decimal, maxStringLen } = _.reduce(column, (acc, value) => {
    const remainingTree = _.map(acc.filteredTree, (typeFilters) => {
      const remainingTypeFilters = _.filter(typeFilters, (tf) => { return tf.fn(value); });

      return remainingTypeFilters;
    });

    const valueIsDecimal = isDecimal(value);
    const decimalMagnitude = valueIsDecimal ? calculateMagnitude(value) : 0;
    const decimalScale = valueIsDecimal ? calculateScale(value) : 0;

    return {
      filteredTree: remainingTree,
      decimal: { maxMagnitude: max(acc.decimal.maxMagnitude, decimalMagnitude), maxScale: max(acc.decimal.maxScale, decimalScale) },
      maxStringLen: max(acc.maxStringLen, String(value).length)
    };
  }, { filteredTree: treeOfTypeFilters, decimal: { maxMagnitude: 0, maxScale: 0 }, maxStringLen: 0 });

  const inferredType = _.head(_.flatten(filteredTree)); // out of the filters left over, take the first one (best match)

  if (inferredType.t === 'DECIMAL') {
    const precision = decimal.maxMagnitude + decimal.maxScale + 1; // head room of 1 because DECIMAL(19,0) does not fully support 19 9's
    const scale = decimal.maxScale;
    return precision <= 38 ? `${inferredType.t}(${precision},${scale})` : `VARCHAR(${maxStringLen})`;
  }

  if (inferredType.t === 'VARCHAR') {
    return `VARCHAR(${maxStringLen})`;
  }

  if (inferredType.t) {
    return inferredType.t;
  }
  throw new Error('No type inferred for column');
}

function isDate(value) {
  const d = value.constructor === Date ? moment.utc(value) : moment.utc(value, 'YYYY-MM-DD', true);
  if (!d.isValid()) {
    return false;
  }
  const hasOnlyDateComponents = d.isSame(moment.utc(d.format('YYYY-MM-DD'), 'YYYY-MM-DD'));
  return hasOnlyDateComponents;
}

function isDateTime(value) {
  const d = value.constructor === Date ? moment.utc(value) : moment.utc(value, 'YYYY-MM-DD:HH:mm:ss', true);
  return d.isValid() || moment.utc(value, 'YYYY-MM-DD', true).isValid() || moment.utc(value, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).isValid();
}

function isBoolean(value) {
  const allowedValues = [0, 1, true, false, 'true', 'false', 'yes', 'no', 'y', 'n', '1', '0', 't', 'f'];

  const v = value.constructor === String ? value.toLowerCase() : value;
  if (!contains(allowedValues, v)) {
    return false;
  }
  return true;
};

function isSmallInt(value) {
  const max = 32767;
  const min = -32768;

  if (isXInt(min, max, value)) {
    return true;
  }
  return false;
}

function isInt(value) {
  const max = 2147483647;
  const min = -2147483648;

  if (isXInt(min, max, value)) {
    return true;
  }
  return false;
}

function isBigInt(value) {
  if (!isInteger(value)) {
    return false;
  }
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

function isDecimal(value) {
  try {
    const bigD = new BigDecimal(String(value));
    if (!bigD) {
      return false
    }
    // Give ourselves headroom of 1 order of magnitude because not all lengths are
    // fully supported (precision 19 doesn't cover values above: 9223372036854775807)
    // http://docs.aws.amazon.com/redshift/latest/dg/r_Numeric_types201.html#r_Numeric_types201-decimal-or-numeric-type
    if (calculatePrecision(value) < 38) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

function isXInt(min, max, value) {
  let n = Number(value);
  if (!isInteger(value) || n > max || n < min) {
    return false;
  }

  return true;
}

// Like Number.isInteger() but when passed string with decimal point, returns false.
function isInteger(value) {
  return Boolean(String(value).indexOf('.') === -1 && Number.isInteger(Number(value)));
}

module.exports = inferType;
