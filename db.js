'use strict';
const mongoose = require('mongoose');
const dbname = 'thiswire';
const url = 'mongodb://localhost:27017/'+dbname;
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