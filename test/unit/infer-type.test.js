const { expect } = require('chai');
const _ = require('lodash');
const genericInferType = require('../../src/type-inference');

describe('RDBMS type inference', () => {
  describe('Redshift', () => {
    const inferType = _.partial(genericInferType, 'REDSHIFT');

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
  });
});

function forAll(iterable, assertion) {
  _.forEach(iterable, assertion);
}
