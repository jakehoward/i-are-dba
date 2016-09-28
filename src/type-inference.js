const _ = require('lodash');
const bigInt = require('big-integer');
const bigDecimal = require('big-decimal');

function inferType (dbEngine, data) {
  if (dbEngine != 'REDSHIFT') {
    throw new Error('Unsupported db engine for column type inference');
  }

  if (isBoolean(data)) {
    return 'BOOLEAN';
  } else if (isSmallInt(data)) {
    return 'SMALLINT';
  } else if (isInteger(data)) {
    return 'INTEGER';
  } else if (isBigInt(data)) {
    return 'BIGINT';
  } else if (isDecimal(data)) {
    return calculateDecimalType(data);
  }
  throw new Error('No type inferred for column');
}

function isBoolean(data) {
  const allowedValues =
        [0, 1, true, false, 'true', 'false', 'yes', 'no', 'y', 'n', '1', '0', 't', 'f'];

  for (let i = 0; i < data.length; ++i) {
    const d = data[i].constructor === String ? data[i].toLowerCase() : data[i];
    if (!contains(allowedValues, d)) {
      return false;
    }
  }
  return true;
}

function isSmallInt(data) {
  const max = 32767;
  const min = -32768;

  return isXInt(min, max, data);
}

function isInteger(data) {
  const max = 2147483647;
  const min = -2147483648;

  return isXInt(min, max, data);
}

function isBigInt(data) {
  const max = bigInt('9223372036854775807');
  const min = bigInt('-9223372036854775808');

  for (let i = 0; i < data.length; ++i) {
    try {
      let n = bigInt(data[i]);
      if (n.greater(max) || n.lesser(min)) {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
  return true;
}

function isXInt(min, max, data) {
  for (let i = 0; i < data.length; ++i) {
    let n = Number(data[i]);
    if (!Number.isInteger(n) || n > max || n < min) {
      return false;
    }
  }
  return true;
}

// Would pass for integer too, but not important in this context
// as we're assuming it will only be called after all integer options
// are exhausted
// TODO: improve this, almost certainly can be simplified
function isDecimal(data) {
  let maxLen = 0;
  let pointPositions = [];
  for(let i = 0; i < data.length; ++i) {
    if (Number.isNaN(Number(data[i]))) {
      return false;
    }
    const bigN = new bigDecimal(data[i]);
    pointPositions.push(max(bigN.mant.length + bigN.exp, 0));
    maxLen = max(bigN.mant.length, Math.abs(bigN.mant.length + bigN.exp), maxLen);
  }
  let maxPoint = _.reduce(pointPositions, (max, p) => p > max ? p : max, 0);
  let minPoint = _.reduce(pointPositions, (min, p) => p < min ? p : min, maxLen);
  const maxRedshiftPrecision = 37; // being conservative as it can't deal with a full 38
  if ((maxPoint - minPoint) > (maxRedshiftPrecision / 2)) {
    return false;
  }
  // Being a bit lazy here as that is a whole order of magnitide less than it can deal with.
  // But it won't go all the way up to 9999.... so too hard to bother for v0.0.1
  return maxLen < maxRedshiftPrecision;
}

function calculateDecimalType(data) {
  // Assume isDecimal has been called, so no belts and braces checks
  let maxRHS = 0;
  let maxLHS = 0;
  for (let i = 0; i < data.length; ++i) {
    const bigN = new bigDecimal(data[i]);
    const lenLHS = bigN.mant.length + bigN.exp;
    maxLHS = max(lenLHS, maxLHS);
    const lenRHS = -bigN.exp;
    maxRHS = max(lenRHS, maxRHS);
  }
  if (maxRHS + maxLHS > 37) { throw new Error("Attempt to make larger decimal than possible"); }
  const precision = maxLHS + maxRHS;
  const scale = maxRHS;
  return `DECIMAL(${precision},${scale})`;
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

module.exports = inferType;
