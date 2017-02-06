var path = require('path');
var findup = require('findup-sync');

module.exports = loadDtkFile;

function loadDtkFile () {
  var dtkFile = findup('g2dtk.js', {
    nocase: true
  });

  if (dtkFile == null) throw new Error('g2dtk.js not found');

  var baseDir = path.dirname(dtkFile);

  // The chdir should perhaps live somewhere else and not be a side effect of
  // this function, or go away entirely
  process.chdir(baseDir);

  return require(dtkFile);
}
