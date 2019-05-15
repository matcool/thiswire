'use strict';
const express = require('express');
const socketio = require('socket.io');
const db = require('./db');

let app = express();
let http = require('http').Server(app);
let io = socketio(http);

const messages = [];
const users = [];

function addMessage(msg) {
    msg = {
        text: msg.text,
        author: msg.author,
        timestamp: new Date()
    };
    db.getDB().collection('messages').insertOne(msg, (err, result) => {
        if (err) {
            console.error(err);
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
    user = {
        name: user.name
    };
    db.getDB().collection('users').insertOne(user, (err, result) => {
        if (err) {
            console.error(err);
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
        console.log('Error while conecting to database');
        console.error(err);
        process.exit(1);
    } else {
        console.log('Connected to database');
        // Get users and messages
        db.getDB().collection('users').find({}).toArray((err, documents) => {
            if (err) {
                console.error(err);
            } else {
                for (let user of documents) {
                    user.status = StatusEnum.OFFLINE;
                    users.push(user);
                }
                console.log(`Found ${documents.length} users`);
            }
        });
        db.getDB().collection('messages').find({}).toArray((err, documents) => {
            if (err) {
                console.error(err);
            } else {
                for (let message of documents) {
                    messages.push(message);
                }
                console.log(`Found ${documents.length} messages`);
            }
        });
    }
});

app.get('/getUser', (req, res) => {
    db.getDB().collection('users').find({_id: db.getPrimaryKey(req.query.id)}).toArray((err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({
                type: 'error'
            });
        } else {
            res.json(result[0]);
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
    console.log('New connection');
    let connectedUser;
    socket.on('login', (user, callback) => {
        // Look for another user with same name and check if logged in
        let usr = findUser({
            name: user.name
        });
        if (usr === null) {
            console.log('new user! ' + JSON.stringify(user, undefined, 4));
            user = addUser(user);
        } else if (usr.status !== StatusEnum.OFFLINE) {
            callback(null);
            return;
        } else if (usr.status === StatusEnum.OFFLINE) {
            console.log(user.name + ' logged back in');
            user = usr;
        }

        connectedUser = user;
        callback(user);

        io.emit('chat messages', messages);
        socket.on('chat message', (msg) => {
            console.log('new message! ' + JSON.stringify(msg, undefined, 4));
            io.emit('chat message', addMessage(msg));
        });
    });

    socket.on('disconnect', () => {
        console.log('Disconnected');
        // Set loggedIn to false when disconnected
        if (connectedUser) {
            connectedUser.status = StatusEnum.OFFLINE;
        }
        io.emit('user disconnected');
    });
});

http.listen(3000, () => {
    console.log('Started server on port 3000');
})