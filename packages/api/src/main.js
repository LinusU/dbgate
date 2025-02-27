const express = require('express');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const http = require('http');
const cors = require('cors');
const io = require('socket.io');
const fs = require('fs');
const findFreePort = require('find-free-port');
const childProcessChecker = require('./utility/childProcessChecker');
const path = require('path');

const useController = require('./utility/useController');
const socket = require('./utility/socket');

const connections = require('./controllers/connections');
const serverConnections = require('./controllers/serverConnections');
const databaseConnections = require('./controllers/databaseConnections');
const metadata = require('./controllers/metadata');
const sessions = require('./controllers/sessions');
const runners = require('./controllers/runners');
const jsldata = require('./controllers/jsldata');
const config = require('./controllers/config');
const archive = require('./controllers/archive');
const uploads = require('./controllers/uploads');
const plugins = require('./controllers/plugins');
const files = require('./controllers/files');
const scheduler = require('./controllers/scheduler');

const { rundir } = require('./utility/directories');
const platformInfo = require('./utility/platformInfo');
const processArgs = require('./utility/processArgs');

function start() {
  // console.log('process.argv', process.argv);

  const app = express();

  const server = http.createServer(app);
  socket.set(io(server));

  if (process.env.LOGIN && process.env.PASSWORD) {
    app.use(
      basicAuth({
        users: {
          [process.env.LOGIN]: process.env.PASSWORD,
        },
        challenge: true,
        realm: 'DbGate Web App',
      })
    );
  }

  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));

  app.use(
    '/uploads',
    fileUpload({
      limits: { fileSize: 4 * 1024 * 1024 },
    })
  );

  useController(app, '/connections', connections);
  useController(app, '/server-connections', serverConnections);
  useController(app, '/database-connections', databaseConnections);
  useController(app, '/metadata', metadata);
  useController(app, '/sessions', sessions);
  useController(app, '/runners', runners);
  useController(app, '/jsldata', jsldata);
  useController(app, '/config', config);
  useController(app, '/archive', archive);
  useController(app, '/uploads', uploads);
  useController(app, '/plugins', plugins);
  useController(app, '/files', files);
  useController(app, '/scheduler', scheduler);

  // if (process.env.PAGES_DIRECTORY) {
  //   app.use('/pages', express.static(process.env.PAGES_DIRECTORY));
  // }

  app.use('/runners/data', express.static(rundir()));

  if (platformInfo.isDocker) {
    // server static files inside docker container
    app.use(express.static('/home/dbgate-docker/public'));
  } else {
    if (!platformInfo.isNpmDist) {
      app.get('/', (req, res) => {
        res.send('DbGate API');
      });
    }
  }

  if (processArgs.dynport) {
    childProcessChecker();

    findFreePort(53911, function (err, port) {
      server.listen(port, () => {
        console.log(`DbGate API listening on port ${port}`);
        process.send({ msgtype: 'listening', port });
      });
    });
  } else if (platformInfo.isNpmDist) {
    app.use(express.static(path.join(__dirname, '../../dbgate-web/public')));
    findFreePort(5000, function (err, port) {
      server.listen(port, () => {
        console.log(`DbGate API listening on port ${port}`);
      });
    });
  } else {
    server.listen(3000);
  }
}

module.exports = { start };
