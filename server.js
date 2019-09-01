'use strict';
const env = require('./getenv.js');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');
const db = require('./db');
const fs = require('fs');
let models = require('./models');

const winston = require('winston');

const myFormat = winston.format.printf(log => {
    return `[${log.level}] ${log.message}`;
});

const logger = winston.createLogger({
    level: 'silly',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), myFormat)
        })
    ]
});

let app = express();
let http = require(env.HTTPS ? 'https' : 'http');
if (env.HTTPS) {
    logger.info('HTTPS enabled, reading key and cert files');
    let key  = fs.readFileSync(env.HTTPS_KEYPATH, 'utf8');
    let cert = fs.readFileSync(env.HTTPS_CERTPATH, 'utf8');
    http = http.createServer({key, cert}, app);
} else {
    http = http.createServer(app);
}
let io = socketio(http);

app.use(cors());

db.connect(err => {
    if (err) {
        logger.error('Error while trying to connect to database: ' + err);
        process.exit(1);
    } else {
        logger.info('Connected to database');
        models = models(db.mongoose);
        // Only register routes now to prevent it trying to access the db before it has loaded
        require('./routes/routes.js')({app, db, models, logger, env});
    }
});

const users = [];

function addMessage(msg, user) {
    if (!msg.text || !msg.text.trim() || !msg.channel) return;
    msg = new models.Message({
        text: msg.text.trim(),
        author: user._id,
        timestamp: new Date(),
        channel: msg.channel
    });
    msg.save((err, result) => {
        if (err) {
            logger.error('Error while trying to add a message: ' + err);
            msg = null;
        } else {
            msg = result;
        }
    });
    return msg;
}

io.on('connection', (socket) => {
    logger.info('New connection');
    let connectedUser;
    socket.on('login', async token => {
        let result;
        try {
            result = await models.User.findOne({ token }).exec();
        } catch (e) {
            logger.error('Error while getting user: ' + e);
            return;
        }
        if (!result || users.includes(result._id.toHexString())) return;
        users.push(result._id.toHexString());
        socket.emit('logged in', {
            name: result.name,
            _id: result._id
        });

        connectedUser = result;

        models.Message.find({}, (err, result) => {
            if (err) {
                logger.error('Error while getting messages: ' + err);
            } else {
                socket.emit('chat messages', result);
                logger.verbose(`Sent ${result.length} messages to new connection`);
            }
        });

        socket.on('chat message', (msg) => {
            logger.info('New message');
            logger.verbose(JSON.stringify(msg, undefined, 4));
            io.emit('chat message', addMessage(msg, connectedUser));
        });
    });

    socket.on('disconnect', () => {
        logger.info('Disconnected');
        // Remove user from list of online users
        if (connectedUser) {
            let i = users.indexOf(connectedUser._id.toHexString());
            if (i > -1) users.splice(i, 1);
        }
    });
});

http.listen(env.PORT, () => {
    logger.info(`Started server on port ${env.PORT}`);
});