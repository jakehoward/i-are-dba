const { expect } = require('chai');
const forAll = require('../for-all');
const { calculatePrecision, calculateScale, calculateMagnitude } = require('../../src/decimal');

describe('Decimal', () => {
  it('calculates the correct precision for input numbers', () => {
    const examples = [
      { input: 1234, expected: 4 },
      { input: 0.1234, expected: 4 },
      { input: 0, expected: 0 },
      { input: '1e50', expected: 51 },
      { input: '1.234567e+3', expected: 7 },
      { input: '1.234567e+7', expected: 8 },
      { input: '1.234567e-3', expected: 9 },
      { input: '0000.000456', expected: 6 },
      { input: '0000.0004560000', expected: 10 },
      { input: '0000.000456000e3', expected: 6 }
    ];
    const expectCorrectAnswer = (example) => expect(calculatePrecision(example.input)).to.equal(example.expected);
    forAll(examples, expectCorrectAnswer);
  });

  it('calculates the correct scale for input numbers', () => {
    const examples = [
      { input: 1234, expected: 0 },
      { input: 0.1234, expected: 4 },
      { input: 0, expected: 0 },
      { input: '1e50', expected: 0 },
      { input: '1.234567e+3', expected: 3 },
      { input: '1.234567e+7', expected: 0 },
      { input: '1.234567e-3', expected: 9 },
      { input: '0000.000456', expected: 6 },
      { input: '0000.0004560000', expected: 10 },
      { input: '0000.000456000e3', expected: 6 }
    ];
    const expectCorrectAnswer = (example) => expect(calculateScale(example.input)).to.equal(example.expected);
    forAll(examples, expectCorrectAnswer);
  });

  it('calculates the correct magnitude for input numbers', () => {
    const examples = [
      { input: 1234, expected: 4 },
      { input: 0.1234, expected: 0 },
      { input: 0, expected: 0 },
      { input: '1e50', expected: 51 },
      { input: '1.234567e+3', expected: 4 },
      { input: '1.234567e+7', expected: 8 },
      { input: '1.234567e-3', expected: 0 },
      { input: '0000.000456', expected: 0 },
      { input: '0000.0004560000', expected: 0 },
      { input: '0000.000456000e3', expected: 0 }
    ];
    const expectCorrectAnswer = (example) => expect(calculateMagnitude(example.input)).to.equal(example.expected);
    forAll(examples, expectCorrectAnswer);
  });
});
