const _ = require('lodash');
const bigInt = require('big-integer');
const bigDecimal = require('big-decimal');

function inferType (dbEngine, column) {
  if (dbEngine != 'REDSHIFT') {
    throw new Error('Unsupported db engine for column type inference');
  }

  // Type filters is a stack of stacks. When a check fails, it gets popped off.
  // Winning type is last one left standing, order of preference is top to bottom, left to right.
  // Filters in the same group should be generalisations of each other, with the right hand side being 
  // most general (e.g. all INTEGER's can be VARCHAR's)
  const treeOfTypeFilters = [[{ fn: isBoolean, t: 'BOOLEAN' }],
                             [{ fn: isSmallInt, t: 'SMALLINT' }, { fn: isInt, t: 'INTEGER' }, { fn: isBigInt, t: 'BIGINT' }] /*, { fn: isDecimal, t: 'DECIMAL(a,b)' } ],*/
                             /*[{ fn: isDate, t: 'DATE' }, { fn: isDateTime, t: 'DATETIME' }]*/
                            ];
  
  const filteredTree = _.reduce(column, (acc, value) => {
    const remainingTree = _.map(acc.treeOfTypeFilters, (typeFilters) => {
      const remainingTypeFilters = _.filter(typeFilters, (tf) => { return tf.fn(value); });

      return remainingTypeFilters;
    });

    // const valueLength = calculateLength(value);
    return {
      treeOfTypeFilters: remainingTree
      // maxLen: max(valueLength, acc.maxLen)
    };
  }, { treeOfTypeFilters, maxLen: 0, decimal: { maxLHS: 0, maxRHS: 0 } }).treeOfTypeFilters;

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
  if (Number.isNaN(Number(value))) {
    return false;
  }
  const bigN = new bigDecimal(value);
  const lenLHS = bigN.mant.length + bigN.exp;
  const lenRHS = -bigN.exp > 0 ? -bigN.exp : 0;
  
  const precision = lenLHS + lenRHS;
  const scale = lenRHS;
  return true; //type: `DECIMAL(${precision},${scale})`;
}

function isXInt(min, max, value) {
  let n = Number(value);
  if (!Number.isInteger(n) || n > max || n < min) {
    return false;
  }

  return true;
}

function contains (iterable, value) {
  return _.filter(iterable, (v) => v === value).length > 0;
}

function max() {
  if (arguments.length === 1) {
    return _.head(arguments);
  }
  return _.reduce(_.tail(arguments), (max, i) => i > max ? i : max, _.head(arguments));
}

// TODO FIX THIS - BROKEN
// function calculateLength(value) {
//   if (!Number.isNaN(Number(value))) {
//     const stringVal = String(value);
//     if (stringVal.indexOf('e') !== -1) {
//       const exponent = Number(stringVal.split('e')[1]);
//       const significand = stringVal.split('e')[0];
//       const decimalPosIndex = significand.indexOf('.') !== -1 ? significand.indexOf('.') : significand.length;
//       const lhsLen = decimalPosIndex;
//       const rhsLen = significand.length - decimalPosIndex;
//       const normalisedExponent = exponent + lhsLen;
//       console.log('Exponent', exponent, 'significand', significand, 'decimalPosIndex', decimalPosIndex, 'lhsLen', lhsLen, 'rhsLen', rhsLen, 'normalisedExponent', normalisedExponent);
//       return _.filter(significand, (c) => c !== '.').length + normalisedExponent;
//     }
//   }
// 
//   return _.filter(String(value), (c) => c !== '.').length;
// }

// for numeric values, calculate the length of the number taking into account e notation and decimal points
// for strings, return length of string
function calculateLength(value) {
  function deconstructNumber(numAsString) {
    if (numAsString.indexOf('e') !== -1) {
      const rawExponent = Number(numAsString.split('e')[1]);
      const rawSignificand = _.trimStart(numAsString.split('e')[0], '0');
      const decimalPosition = rawSignificand.indexOf('.') !== -1 ? rawSignificand.indexOf('.') : rawSignificand.length;
      const lenRHS = decimalPosition != rawSignificand.length ? rawSignificand.split('.')[1].length : 0;
      const normalisedExponent = rawExponent - lenRHS;
      const normalisedSignificand = _.join(rawSignificand.split('.'), '');
      return { normalisedSignificand, normalisedExponent };
    }
  }

  if (!Number.isNaN(Number(value))) {
    const { significand, exponent } = deconstructNumber(String(value));
    if (exponent < 0) {
      return max(significand.length, Math.abs(exponent));
    } else {
      return significand.length, + exponent;
    }
  }
  return String(value).length
}

module.exports = inferType;
