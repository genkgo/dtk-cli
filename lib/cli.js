var fs = require('fs');
var program = require('commander');
var copyDereferenceSync = require('copy-dereference').sync;
var rimraf = require('rimraf');

var dtk = require('./index');
var Watcher = require('./watcher');


module.exports = genkgoDTK;

function genkgoDTK () {
  var actionPerformed = false;

  program
    .version(JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8')).version)
    .usage('[options] <command> [<args ...>]');

  program.command('serve')
    .description('start a dtk server')
    .option('--live-reload-port <port>', 'the port to start LiveReload on [35729]', 35729)
    .action(function(options) {
      var outputDir = 'public/debug';

      actionPerformed = true;
      if (fs.existsSync(outputDir)) {
        rimraf.sync(outputDir);
      }

      dtk.serve.serve(new Watcher(getBuilder()), outputDir, options);
    });

  program.command('build')
    .description('output files to build directory')
    .action(function() {
      var outputDir = 'public/build';

      actionPerformed = true;
      if (fs.existsSync(outputDir)) {
        rimraf.sync(outputDir);
      }

      var builder = getBuilder();
      builder.build()
        .then(function() {
          copyDereferenceSync(builder.outputPath, outputDir);
        })
        .finally(function () {
          return builder.cleanup();
        })
        .then(function () {
          process.exit(0)
        })
        .catch(function (err) {
          // Should show file and line/col if present
          if (err.file) {
            console.error('File: ' + err.file);
          }
          console.error(err.stack);
          console.error('\nBuild failed');
          process.exit(1);
        })
    });

  program.parse(process.argv);
  if(!actionPerformed) {
    program.outputHelp();
    process.exit(1);
  }
}

function getBuilder () {
  var node = dtk.loadBrocfile();
  return new dtk.Builder(node);
}
