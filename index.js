/* example usage */
const makeCreateTableStatement = require('./src/create-table');

const data = [
  ['name', 'date_of_birth', 'height', 'num_wins', 'undefeated'],
  ['Catherine', '1965-08-01', '1.56', '30', 'no'],
  ['John', '1988-12-21', '1.86', '12', 'yes'],
  ['Anabelle', '1973-02-13', '1.56', '6', true],
  ['Joan', '2001-09-11', '1.56', 15, 0],
];

const createTableStatement = makeCreateTableStatement('players', data);

console.log(createTableStatement);
