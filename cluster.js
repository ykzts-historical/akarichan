
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const os = require('os');
const cluster = require('cluster');
const app = require('./app');

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
