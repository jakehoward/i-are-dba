const _ = require('lodash');
const bigInt = require('big-integer');

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
  }

  throw new Error('No type inferred for column');
}

function isBoolean(data) {
  const allowedValues =
        [0, 1, true, false, 'TRUE', 'true', 'FALSE', 'false', 'yes', 'YES',
         'no', 'NO', 'Y', 'y', 'N', 'n', '1', '0', 't', 'T', 'f', 'F'];

  for (let i = 0; i < data.length; ++i) {
    if (!contains(allowedValues, data[i])) {
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
    let n = data[i];
    if (bigInt(n).greater(max) || bigInt(n).lesser(min)) {
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

function contains (iterable, value) {
  return _.filter(iterable, (v) => v === value).length > 0;
}

module.exports = inferType;
