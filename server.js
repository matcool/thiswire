'use strict';
const express = require('express');
const socketio = require('socket.io');

let app = express();
let http = require('http').Server(app);
let io = socketio(http);

let msgid = 0;
const messages = [];
let userid = 0;
const users = [];

function addMessage(msg) {
    msg = {
        id: msgid,
        text: msg.text,
        author: users[msg.author],
        timestamp: new Date()
    };
    messages.push(msg);
    msgid++;
    return msg;
}

const StatusEnum = {
    OFFLINE: 0,
    ONLINE: 1
};
Object.freeze(StatusEnum);

function addUser(user) {
    user = {
        id: userid,
        name: user.name,
        status: StatusEnum.ONLINE
    };
    users.push(user);
    userid++;
    return user;
}

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
    let id;
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

        id = user.id;
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
        if (id !== null) {
            let usr = findUser({
                id: id
            });
            if (usr != null) {
                usr.status = StatusEnum.OFFLINE;
            }
        }
        io.emit('user disconnected');
    });
});

http.listen(3000, () => {
    console.log('Started server on port 3000');
})