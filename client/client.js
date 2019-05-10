const socket = io();

Vue.component('message', {
    props: ['message'],
    template: `<div><span class="message-nickname">{{ message.author }}</span>
    <span class="message-time">{{ message.timestampstr }}</span><br>
    <span class="message-text">{{ message.text }}</span></div>`
});

const messages = new Vue({
    el: '#messages',
    data: {
        messages: [
        ]
    }
});

function fancyTime(time) {
    return (new Date(time)).toDateString();
}

function addMessage(msg) {
    msg.timestampstr = fancyTime(msg.timestamp);
    messages.messages.push(msg);
}

socket.on('chat message', (msg) => {
    addMessage(msg);
});

const app = new Vue({
    el: '#message-sender',
    data: {
        message: '',
        nickname: 'Joe'
    },
    methods: {
        sendMessage: function () {
            if (this.message == '' || this.nickname == '') return;
            socket.emit('chat message', {
                text: this.message,
                author: this.nickname
            });
            this.message = '';
        }
    }
});