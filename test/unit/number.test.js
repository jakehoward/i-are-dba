const { expect } = require('chai');
const forAll = require('../for-all');
const _ = require('lodash');
const { calculateLength } = require('../../src/number');

describe('Number - Calculate length', () => {
  it('calculates the correct length of input numbers', () => {
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
    const expectCorrectAnswer = (example) => expect(calculateLength(example.input)).to.equal(example.expected);
    forAll(examples, expectCorrectAnswer);
  });
});


