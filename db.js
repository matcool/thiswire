'use strict';
const env = require('./getenv.js');
const mongoose = require('mongoose');
const url = `mongodb://${env.DB_HOST}/${env.DB_NAME}`;
const connOptions = {useNewUrlParser: true};

const state = {
    db: null
};

function connect(callback) {
    if (state.db) callback();
    else {
        mongoose.connect(url, connOptions);
        let db = mongoose.connection;
        state.db = db;
        db.on('error', callback);
        db.once('open', () => callback());
    }
}

function getDB() {
    return state.db;
}
module.exports = {connect, getDB, validID: mongoose.mongo.ObjectID.isValid, mongoose};