'use strict';
const express = require('express');
const socketio = require('socket.io');
const db = require('./db');

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

const users = {};

function addMessage(msg) {
    // Re-define msg incase it has extra attributes
    msg = {
        text: msg.text,
        author: msg.author,
        timestamp: new Date()
    };
    db.getDB().collection('messages').insertOne(msg, (err, result) => {
        if (err) {
            logger.error('Error while trying to add a message: '+err);
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
    user = {
        name: user.name
    };
    db.getDB().collection('users').insertOne(user, (err, result) => {
        if (err) {
            logger.error('Error while trying to add a user: '+err);
            user = null;
        } else {
            // Local user only stores their ids and status
            // since status dont need to be saved on the db
            result = result.ops[0];
            user = {
                status: StatusEnum.ONLINE
            };
            users[result._id.toHexString()] = user;
        }
    });
    return user;
}

db.connect(err => {
    if (err) {
        logger.error('Error while trying to connect to database: '+err);
        process.exit(1);
    } else {
        logger.info('Connected to database');
    }
});

app.get('/getUser', (req, res) => {
    if (!db.validID(req.query.id)) {
        logger.debug(`/getUser has been called with an invalid ID (${req.query.id})`);
        res.json({
            type: 'error',
            message: 'Invalid ID'
        });
        return
    }
    db.getDB().collection('users').find({_id: db.getPrimaryKey(req.query.id)}).toArray((err, result) => {
        if (err) {
            logger.error(`Error while getting user (/getUser?id=${req.query.id}): ${err}`);
            res.status(500).json({
                type: 'error',
                message: 'Error when getting user '+req.query.id
            });
        } else {
            logger.silly(`(/getUser?id=${req.query.id}) has returned ${JSON.stringify(result[0])}`);
            if (result.length === 0) {
                res.json({});
            } else {
                res.json(result[0]);
            }
        }
    });
});

app.use(express.static('client'));

io.on('connection', (socket) => {
    logger.info('New connection');
    let connectedUser;
    socket.on('login', (user, callback) => {
        // Look for another user with same name and check if logged in
        db.getDB().collection('users').find({name: user.name}).toArray((err, result) => {
            if (err) {
                logger.error(`Error while getting user (${user.name}): ${err}`);
                callback({
                    type: 'error',
                    message: 'Internal error'
                });
            } else {
                let usr = result[0];
                if (usr === undefined) {
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

                db.getDB().collection('messages').find({}).toArray((err, result) => {
                    if (err) {
                        logger.error('Error while getting messages: '+err);
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
})