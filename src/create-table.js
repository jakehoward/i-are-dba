const _ = require('lodash');
const inferType = _.partial(require('./type-inference'), 'REDSHIFT');
const format = require('pg-format');

module.exports = function createTableStatment(tableName, data) {
  const columns = makeColumns(data);
  const escapedTableName = _.join(_.map(String(tableName).split('.'), (i) => format.ident(i)), '.');
  return `CREATE TABLE ${escapedTableName} (
${_.join(_.map(columns, (c) => format.ident(c.name) + ' ' + c.type), ',\n')}
)`
}

function makeColumns(data) {
  const columnNames = data[0];
  if (!columnNames) {
    return null;
  }
  const columns = _.map(columnNames, (n, i) => ({ name: n, index: i, data: [] }));
  const columnsWithData = _.map(columns, (c) => {
    const columnData = _.filter(_.map(data, (row, index) => {
      if (index === 0) return null;
      return row[c.index];
    }), _.identity);
    return _.assign(c, { data: columnData });
  });

  const columnsWithType = _.map(columnsWithData, (c) => _.assign(c, { type: inferType(c.data) }));

  return columnsWithType;
}
