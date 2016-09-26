function inferType (dbEngine, data) {
  if (dbEngine != 'REDSHIFT') {
    throw new Error('Unsupported db engine for column type inference');
  }
  return 'BOOLEAN';
}

module.exports = inferType;
