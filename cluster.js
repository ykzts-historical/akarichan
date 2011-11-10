var os = require('os');
var cluster = require('cluster');

process.env.NODE_PATH = '/usr/local/lib/node_modules';

if (cluster.isMaster) {
  for (var i=0; i<os.cpus().length; i++) {   
    cluster.fork();
  }
  cluster.on('death', function(worker) {
    cluster.fork();
  });
} else {
  require('./app');
}
