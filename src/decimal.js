const _ = require('lodash');
const { max } = require('./utils');

function calculatePrecision(value) {
  function deconstructNumber(numAsString) {
    const rawExponent = numAsString.indexOf('e') !== -1 ? Number(numAsString.split('e')[1]) : 0;
    const rawSignificand = _.trimStart(numAsString.indexOf('e') !== -1 ? numAsString.split('e')[0] : numAsString, '0');
    const decimalPosition = rawSignificand.indexOf('.') !== -1 ? rawSignificand.indexOf('.') : rawSignificand.length;
    const lenRHS = decimalPosition != rawSignificand.length ? rawSignificand.split('.')[1].length : 0;
    const normalisedExponent = rawExponent - lenRHS;
    const normalisedSignificand = _.trimStart(_.join(rawSignificand.split('.'), ''), '0');
    return ({ significand: normalisedSignificand, exponent: normalisedExponent });
  }

  if (Number.isNaN(Number(value))) {
    throw new Error('Not possible to calculate precision for NaN');
  }
  const { significand, exponent } = deconstructNumber(String(value));
  if (exponent < 0) {
    return max(significand.length, Math.abs(exponent));
  }

  return significand.length + exponent;
}

module.exports = {
  calculatePrecision
};
