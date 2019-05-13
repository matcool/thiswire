const socket = io();
const md = window.markdownit({
    breaks: true,
    linkify: true
});

const imgpfp = 'https://images.unsplash.com/photo-1556220881-df28b44798ce?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=100&h=100&fit=crop&ixid=eyJhcHBfaWQiOjF9';

Vue.component('message', {
    props: ['message'],
    template: `<div class="message-parent"><img class="message-pfp" src="${imgpfp}"><div><span class="message-nickname">{{ message.author.name }}</span>\
<span class="message-time">{{ timestampstr }}</span><br>
<div class="message-text" v-html="content"></div></div></div>`,
    computed: {
        timestampstr: function() {
            return (new Date(this.message.timestamp)).toDateString();
        },
        content: function() {
            return md.renderInline(this.message.text);
        }
    }
});

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

socket.on('chat messages', (msgs) => {
    msgs.map(msg => addMessage(msg));
});

const app = new Vue({
    el: '#message-sender',
    data: {
        message: '',
        loggedIn: false,
        user: {
            name: ''
        }
    },
    methods: {
        sendMessage: function () {
            if (this.message == '') return;
            socket.emit('chat message', {
                text: this.message,
                author: this.user.id
            });
            this.message = '';
        },
        login: function () {
            if (this.user.name == '') return;
            socket.emit('login', this.user);
        }
    }
});

socket.on('login', (user) => {
    if (user == null) return;
    app.loggedIn = true;
    app.user = user;
});