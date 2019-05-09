const socket = io();

const messages = new Vue({
    el: '#messages',
    data: {
        messages: [
        ]
    }
});

function addMessage(msg) {
    messages.messages.push(msg);
}

socket.on('chat message', (msg) => {
    addMessage(msg);
});

const app = new Vue({
    el: '#message-sender',
    data: {
        message: ''
    },
    methods: {
        sendMessage: function () {
            if (this.message == '') return;
            socket.emit('chat message', this.message);
            this.message = '';
        }
    }
});