'use strict';
const open = require('open');
const express = require('express');
const socketio = require('socket.io');
const db = require('./db');
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
let http = require('http').Server(app);
let io = socketio(http);

db.connect(err => {
    if (err) {
        logger.error('Error while trying to connect to database: ' + err);
        process.exit(1);
    } else {
        logger.info('Connected to database');
        models = models(db.mongoose);
    }
});

const users = {};

function addMessage(msg) {
    // Re-define msg incase it has extra attributes
    msg = new models.Message({
        text: msg.text,
        author: msg.author,
        timestamp: new Date()
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

const StatusEnum = {
    OFFLINE: 0,
    ONLINE: 1
};
Object.freeze(StatusEnum);

function addUser(user) {
    // Re-define user incase it has extra attributes
    user = new models.User({
        name: user.name
    });
    user.save((err, result) => {
        if (err) {
            logger.error('Error while trying to add a user: ' + err);
            user = null;
        } else {
            // Local user only stores their ids and status
            // since status dont need to be saved on the db
            user = {
                status: StatusEnum.ONLINE
            };
            users[result._id.toHexString()] = user;
        }
    });
    return user;
}

app.get('/getUser', (req, res) => {
    if (!db.validID(req.query.id)) {
        logger.debug(`/getUser has been called with an invalid ID (${req.query.id})`);
        res.json({
            type: 'error',
            message: 'Invalid ID'
        });
        return
    }
    models.User.findById(req.query.id, (err, result) => {
        if (err) {
            logger.error(`Error while getting user (/getUser?id=${req.query.id}): ${err}`);
            res.status(500).json({
                type: 'error',
                message: 'Error when getting user ' + req.query.id
            });
        } else {
            logger.silly(`(/getUser?id=${req.query.id}) has returned ${JSON.stringify(result)}`);
            res.json(result);
        }
    });
});

app.use(express.static('client'));

io.on('connection', (socket) => {
    logger.info('New connection');
    let connectedUser;
    socket.on('login', (user, callback) => {
        // Look for another user with same name and check if logged in
        models.User.findOne({ name: user.name }, (err, result) => {
            if (err) {
                logger.error(`Error while getting user (${user.name}): ${err}`);
                callback({
                    type: 'error',
                    message: 'Internal error'
                });
            } else {
                let usr = result;
                if (usr === null) {
                    logger.info('New user')
                    logger.verbose(JSON.stringify(user, undefined, 4));
                    user = addUser(user);
                } else {
                    if (users[usr._id.toHexString()]) {
                        callback({
                            type: 'error',
                            message: 'User already connected'
                        });
                        return;
                    } else {
                        logger.info(user.name + ' logged back in');
                        users[usr._id.toHexString()] = {
                            status: StatusEnum.ONLINE
                        };
                        user = usr;
                    }
                }

                connectedUser = user;
                callback(user);

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
                    io.emit('chat message', addMessage(msg));
                });
            }
        });
    });

    socket.on('disconnect', () => {
        logger.info('Disconnected');
        // Remove user from list of online users
        if (connectedUser) {
            delete users[connectedUser._id];
        }
    });
});

http.listen(3000, () => {
    logger.info('Started server on port 3000');
    open(`http://localhost:3000`);
})