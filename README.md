# i-are-dba

I are DBA produces CREATE TABLE SQL statements based on the data to be written to the table. 

## Example usage

```javascript
/* example usage - run node index.js to try yourself */
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
)
```

## Known issues

Due to a shortcoming in node, it is only possible to make the most of the BIGINTEGER type if you pass large numbers as type `String`. This affects numbers above 9007199254740991 or below -9007199254740991.
