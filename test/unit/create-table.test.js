const { expect } = require('chai');
const createTableStatement = require('../../src/create-table');

describe('CREATE TABLE', () => {
  it('makes a create table statement for a matrix of data', () => {
    const data = [
      ['column_one', 'column_two'],
      ['1.56', 'Hello, world!'],
      ['14.77', ''],
      ['', 'Hey'],
      [],
      ['18.56']
    ];
    const tableName = 'table_one';
    const expected = `CREATE TABLE table_one (
column_one DECIMAL(5,2),
column_two VARCHAR(13)
)`
    expect(createTableStatement(tableName, data)).to.equal(expected);
  });
});
