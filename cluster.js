
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

var os = require('os');
var cluster = require('cluster');
var app = require('./app');

if (cluster.isMaster) {
  for (var i=0; i<os.cpus().length; i++) {   
    cluster.fork();
  }
  cluster.on('death', function(worker) {
    cluster.fork();
  });
} else {
  app.listen(app.settings.port);
}
