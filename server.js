const express = require('express');
const socketio = require('socket.io');

let app = express();
let http = require('http').Server(app);
let io = socketio(http);

let id = 0;
const messages = [];

function addMessage(msg) {
    msg = {
        id: id,
        text: msg.text,
        author: msg.author,
        timestamp: new Date()
    };
    messages.push(msg);
    id++;
    return msg;
}

app.use(express.static('client'));

io.on('connection', (socket) => {
    console.log('New connection');
    messages.forEach(msg => io.emit('chat message', msg));
    socket.on('chat message', (msg) => {
        console.log('new message!\n'+JSON.stringify(msg, undefined, 4));
        io.emit('chat message', addMessage(msg));
    });
    socket.on('disconnect', () => {
        console.log('Disconnected');
        io.emit('user disconnected');
    });
});

http.listen(3000, () => {
    console.log('Started server on port 3000');
})