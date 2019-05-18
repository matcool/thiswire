'use strict';
const socket = io();
const md = window.markdownit({
    breaks: true,
    linkify: true
});

const imgpfp = 'https://images.unsplash.com/photo-1556220881-df28b44798ce?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=100&h=100&fit=crop&ixid=eyJhcHBfaWQiOjF9';
const userCache = {};
const pendingRequests = {};

Vue.component('message', {
    props: ['message'],
    template: `<div class="message-parent"><img class="message-pfp" src="${imgpfp}"><div><span class="message-nickname">{{ author.name }}</span>
<span class="message-time">{{ timestampstr }}</span><br>
<div class="message-text" v-html="content"></div></div></div>`,
    computed: {
        timestampstr() {
            return (new Date(this.message.timestamp)).toDateString();
        },
        content() {
            return md.renderInline(this.message.text);
        }
    },
    asyncComputed: {
        author: {
            get() {
                if (userCache[this.message.author]) return userCache[this.message.author];
                if (pendingRequests[this.message.author]) return pendingRequests[this.message.author];
                let req = axios.get('/getUser', {params: {id: this.message.author}})
                .then(response => {
                    if (response.data.type === 'error') {
                        return 'error';
                    }
                    userCache[this.message.author] = response.data;
                    delete pendingRequests[this.message.author];
                    return response.data;
                });
                pendingRequests[this.message.author] = req;
                return req;
            },
            default: {
                name: 'loading...'
            }
        }
    }
});

const messages = new Vue({
    el: '#messages',
    data: {
        messages: []
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
        sendMessage() {
            if (this.message == '') return;
            socket.emit('chat message', {
                text: this.message,
                author: this.user._id
            });
            this.message = '';
        },
        login() {
            if (this.user.name == '') return;
            socket.emit('login', this.user, (user) => {
                if (user.type === 'error') return;
                this.loggedIn = true;
                this.user = user;
            });
        }
    }
});