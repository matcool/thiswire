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

const messages = [];
const users = [];

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
            messages.push(msg);
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
            user = result;
            user.status = StatusEnum.ONLINE;
            users.push(user);
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
        // Get users and messages
        logger.info('Getting users and messages');
        db.getDB().collection('users').find({}).toArray((err, documents) => {
            if (err) {
                logger.error('Error while getting users: '+err);
            } else {
                for (let user of documents) {
                    user.status = StatusEnum.OFFLINE;
                    users.push(user);
                }
                logger.log('verbose', `Found ${documents.length} users`);
            }
        });
        db.getDB().collection('messages').find({}).toArray((err, documents) => {
            if (err) {
                logger.error('Error while getting messages: '+err);
            } else {
                for (let message of documents) {
                    messages.push(message);
                }
                logger.log('verbose', `Found ${documents.length} messages`);
            }
        });
    }
});

app.get('/getUser', (req, res) => {
    if (!db.validID(req.query.id)) {
        res.json({
            type: 'error',
            message: 'Invalid ID'
        });
        return
    }
    db.getDB().collection('users').find({_id: db.getPrimaryKey(req.query.id)}).toArray((err, result) => {
        if (err) {
            logger.warn(`Error while getting user (/getUser?id=${req.query.id}): ${err}`);
            res.status(500).json({
                type: 'error',
                message: 'Error when getting user '+req.query.id
            });
        } else {
            if (result.length === 0) {
                res.json({});
            } else {
                res.json(result[0]);
            }
        }
    });
});

function findUser(atr) {
    for (let i = 0; i < users.length; i++) {
        let temp = true;
        for (let key of Reflect.ownKeys(atr)) {
            if (users[i][key] != atr[key]) {
                temp = false;
                break;
            }
        }
        if (temp) return users[i];
    }
    return null;
}

app.use(express.static('client'));

io.on('connection', (socket) => {
    logger.info('New connection');
    let connectedUser;
    socket.on('login', (user, callback) => {
        // Look for another user with same name and check if logged in
        let usr = findUser({
            name: user.name
        });
        if (usr === null) {
            logger.info('New user')
            logger.log('verbose', JSON.stringify(user, undefined, 4));
            user = addUser(user);
        } else if (usr.status !== StatusEnum.OFFLINE) {
            callback(null);
            return;
        } else if (usr.status === StatusEnum.OFFLINE) {
            logger.info(user.name + ' logged back in');
            user = usr;
        }

        connectedUser = user;
        callback(user);

        io.emit('chat messages', messages);
        socket.on('chat message', (msg) => {
            logger.info('New message');
            logger.verbose(JSON.stringify(msg, undefined, 4));
            io.emit('chat message', addMessage(msg));
        });
    });

    socket.on('disconnect', () => {
        logger.info('Disconnected');
        // Set loggedIn to false when disconnected
        if (connectedUser) {
            connectedUser.status = StatusEnum.OFFLINE;
        }
    });
});

http.listen(3000, () => {
    logger.info('Started server on port 3000');
})