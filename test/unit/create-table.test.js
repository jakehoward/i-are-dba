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
)`;
    expect(createTableStatement(tableName, data)).to.equal(expected);
  });

  it('makes a create table statement when table name contains schema', () => {
    const data = [
      ['column_blah'],
      ['value']
    ];
    const tableName = 'bobby.tables';
    const expected = `CREATE TABLE bobby.tables (
column_blah VARCHAR(5)
)`;
    expect(createTableStatement(tableName, data)).to.equal(expected);
  });
});
