const _ = require('lodash');
const { max } = require('./utils');

function calculatePrecision(value) {
  if (Number.isNaN(Number(value))) {
    throw new Error('Not possible to calculate precision for NaN');
  }
  const { significand, exponent } = deconstructNumber(String(value));
  if (exponent < 0) {
    return max(significand.length, Math.abs(exponent));
  }

  return significand.length + exponent;
}

// Number of digits to the right of the decimal point
function calculateScale(value) {
  if (Number.isNaN(Number(value))) {
    throw new Error('Not possible to calculate scale for NaN');
  }
  const { exponent } = deconstructNumber(String(value));
  return exponent < 0 ? Math.abs(exponent) : 0;
}

// Number of digits to the left of the decimal point
function calculateMagnitude(value) {
  if (Number.isNaN(Number(value))) {
    throw new Error('Not possible to calculate scale for NaN');
  }
  const { significand, exponent } = deconstructNumber(String(value));
  return max(significand.length + exponent, 0);
}

function deconstructNumber(numAsString) {
  const rawExponent = numAsString.indexOf('e') !== -1 ? Number(numAsString.split('e')[1]) : 0;
  const rawSignificand = _.trimStart(numAsString.indexOf('e') !== -1 ? numAsString.split('e')[0] : numAsString, '0');
  const decimalPosition = rawSignificand.indexOf('.') !== -1 ? rawSignificand.indexOf('.') : rawSignificand.length;
  const lenRHS = decimalPosition !== rawSignificand.length ? rawSignificand.split('.')[1].length : 0;
  const normalisedExponent = rawExponent - lenRHS;
  const normalisedSignificand = _.trimStart(_.join(rawSignificand.split('.'), ''), '0');
  return ({ significand: normalisedSignificand, exponent: normalisedExponent });
}

module.exports = {
  calculatePrecision,
  calculateScale,
  calculateMagnitude
};
