const { expect } = require('chai');
const forAll = require('../for-all');
const _ = require('lodash');
const genericInferType = require('../../src/type-inference-two');

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
        [true, true, false, false, true, false, true],
        ['TRUE', 'false', 'FALSE', 'false', 'TRUE', 'true'],
        ['y', 'n', 'Y', 'n', 'N'],
        ['yes', 'no', 'NO', 'YES'],
        [true, 't', 'true', 'y', 'yes', '1', 1, false, 'f', 'false', 'n', 'no', '0', 0, 'FaLsE']
      ];
      const expectInferredTypeOfBoolean = (example) => expect(inferType(example)).to.equal('BOOLEAN');
      forAll(examples, expectInferredTypeOfBoolean);
    });

    it('correctly infers SMALLINT type from data', () => {
      const examples = [
        [0, 1, 1, 0, 2, 0, 1],
        ['0', 1, '1', 0, 2, 0, 1],
        [32767, -32768, 16, 55, 67],
        ['32767', '-32768', 16, '55', 67],
        [-8, -20, -35],
        ['-8', '-20', '-35'],
        [15e2, 12, 567],
        ['15e2', 12, 567],
        [1500e-2, 54, 66],
        ['1500e-2', 54, 66]
      ];
      const expectInferredTypeOfSmallInt = (example) => expect(inferType(example)).to.equal('SMALLINT');
      forAll(examples, expectInferredTypeOfSmallInt);
    });

    it('correctly infers INTEGER type from data', () => {
      const examples = [
        [1, 1, 0, 567, -32769],
        [32768, 5, 3, 2, 1, 1],
        [-2147483648, -50, -50, 34, 2147483647],
        ['-2147483648', '-50', '-50', '34', 2147483647],
        ['-2147483e3', '-50', '-50', '34', 2147483e3]
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
        ['-9223372036854775808', '-50', '-50', '34', '9223372036854775807'], // can only handle limit as string
        ['-922337203685477E4', '-50', '-50', '34', '922337203685477E4'] // can only handle limit as string, scientific notation
      ];
      const expectInferredTypeOfBigInt = (example) => expect(inferType(example)).to.equal('BIGINT');
      forAll(examples, expectInferredTypeOfBigInt);
    });

    it('correctly infers DECIMAL type from data', () => {
      // http://docs.aws.amazon.com/redshift/latest/dg/r_Numeric_types201.html#r_Numeric_types201-decimal-or-numeric-type
      // means we have extra +1 precision than strictly necessary.
      const examples = [
        [['4.6', '123.4567', '1.3'], 'DECIMAL(8,4)'],
        [['45', '1.3'], 'DECIMAL(4,1)'],
        [['0.000000000045', '111111111111'], 'DECIMAL(25,12)'],
        [['1234e-2', '45.3'], 'DECIMAL(5,2)']
      ];
      const expectInferredTypeOfDecimal = (example) => expect(inferType(example[0])).to.equal(example[1]);
      forAll(examples, expectInferredTypeOfDecimal);
      });
  });
});

