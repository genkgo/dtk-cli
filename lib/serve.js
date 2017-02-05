var copyDereferenceSync = require('copy-dereference').sync;
var rimraf = require('rimraf');
var printSlowNodes = require('broccoli-slow-trees');
var tinylr = require('tiny-lr');

exports.serve = serve;

function serve (watcher, outputDir, options) {
  var server = {};

  server.watcher = watcher;
  server.builder = server.watcher.builder;

  var livereloadServer = new tinylr.Server;
  livereloadServer.listen(options.liveReloadPort, function (err) {
    if(err) {
      throw err;
    }
  });

  var liveReload = function() {
    // Chrome LiveReload doesn't seem to care about the specific files as long
    // as we pass something.
    livereloadServer.changed({body: {files: ['livereload_dummy']}});
  };

  function cleanupAndExit() {
    return server.watcher.quit()
  }

  process.on('SIGINT', cleanupAndExit);
  process.on('SIGTERM', cleanupAndExit);

  server.watcher.on('buildSuccess', function() {
    rimraf.sync(outputDir);
    copyDereferenceSync(server.builder.outputPath, outputDir);

    try {
      liveReload();
    } catch (e) {
    }

    printSlowNodes(server.builder.outputNodeWrapper);
    console.log('Built - ' + Math.round(server.builder.outputNodeWrapper.buildState.totalTime) + ' ms @ ' + new Date().toString())
  });

  server.watcher.on('buildFailure', function(err) {
    console.log('Built with error:');
    console.log(err.message);
    if (!err.broccoliPayload || !err.broccoliPayload.location.file) {
      console.log('');
      console.log(err.stack)
    }
    console.log('')
  });

  server.watcher.start()
    .catch(function(err) {
      console.log(err && err.stack || err)
    })
    .finally(function() {
      server.builder.cleanup();
    })
    .catch(function(err) {
      console.log('Cleanup error:');
      console.log(err && err.stack || err);
    })
    .finally(function() {
      process.exit(1)
    });

  return server;
}