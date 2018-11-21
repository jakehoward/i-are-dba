# i-are-dba (beta)

i-are-dba produces CREATE TABLE statements dynamically based on the data to be written to the table. It's been battle tested in a closed source app that allows users to automagically sync google sheets to Amazon Redshift.

## npm

Available on npm: [i-are-dba](https://www.npmjs.com/package/i-are-dba)

```
npm i i-are-dba
```

## Example usage

```javascript
/* example usage - run node example.js to try yourself (uses Node.js 6.3) */
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
```

output:

```
CREATE TABLE players (
  name VARCHAR(9),
  date_of_birth DATE,
  height DECIMAL(4,2),
  num_wins SMALLINT,
  undefeated BOOLEAN
);
```

## Known issues

Due to the Number implementation in node, it's only possible to make the most of the BIGINTEGER type if you pass large numbers as type `String`. This affects numbers above 9007199254740991 or below -9007199254740991.

Because [Redshift does not support the logical maximum value](http://docs.aws.amazon.com/redshift/latest/dg/r_Numeric_types201.html#r_Numeric_types201-decimal-or-numeric-type) for `DECIMAL(19,N)`, all `DECIMAL` values have a precision one greater than is (usually) strictly necessary.

In principle this could be generalised to different RDBMS engines and redesigned to stream data through it rather than only work on what will fit in memory. However, both would probably best be done as a rewrite rather than trying to build on what's here.
