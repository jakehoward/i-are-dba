const { expect } = require('chai');
const _ = require('lodash');
const genericInferType = require('../../src/type-inference');

describe('RDBMS type inference', () => {
  describe('Redshift', () => {
    const inferType = _.partial(genericInferType, 'REDSHIFT');

    it('chooses type BOOLEAN when there is no data', () => { // on the basis this is most space efficient
      expect(inferType([])).to.equal('BOOLEAN');
    });

    it('correctly infers BOOLEAN type from data', () => {
      const examples = [
        ['t', 'f', 't', 't', 'f', 't', 'f'],
        [1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1],
        ['true', 'false', 'true', 'true', 'false'],
        [true, true, false, false, true, false, true]
      ];
      const expectInferredTypeOfBoolean = (example) => expect(inferType(example)).to.equal('BOOLEAN');
      forAll(examples, expectInferredTypeOfBoolean);
    });

    it('correctly infers SMALLINT type from data', () => {
      const examples = [
        [0, 1, 1, 0, 2, 0, 1],
        ['0', 1, '1', 0, 2, 0, 1],
        [32767, -32768, 16, 55, 67],
        [32767, '-32768', 16, '55', 67],
        [-8, -20, -35],
        ['-8', '-20', '-35']
      ];
      const expectInferredTypeOfSmallInt = (example) => expect(inferType(example)).to.equal('SMALLINT');
      forAll(examples, expectInferredTypeOfSmallInt);
    });

    it('correctly infers INTEGER type from data', () => {
      const examples = [
        [1, 1, 0, 567, -32769],
        [32768, 5, 3, 2, 1, 1],
        [-2147483648, -50, -50, 34, 2147483647],
        ['-2147483648', '-50', '-50', '34', 2147483647]
      ];
      const expectInferredTypeOfInteger = (example) => expect(inferType(example)).to.equal('INTEGER');
      forAll(examples, expectInferredTypeOfInteger);
    });

    it('correctly infers BIGINT type from data', () => {
      const examples = [
        [1, 1, 0, 567, 21474836483563, -32769],
        [-2147483649, 5, 3, 2, 1, 1], // one under
        [-2147489, 5, 3, 2, 1, 1, 2147483648], // one over
        [-2147483648876, -50, -50, 34, 214748364799],
        ['-9223372036854775808', '-50', '-50', '34', '9223372036854775807'] // can only handle limit as string
      ];
      const expectInferredTypeOfBigInt = (example) => expect(inferType(example)).to.equal('BIGINT');
      forAll(examples, expectInferredTypeOfBigInt);
    });
  });
});

function forAll(iterable, assertion) {
  _.forEach(iterable, (d) => {
    try {
      assertion(d);
    } catch (e) {
      e.message += ' for: ' + d;
      throw e;
    }
  });
}
