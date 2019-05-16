'use strict';
// Big help from this tutorial: https://youtu.be/CyTWPr_WwdI

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;
const dbname = 'thiswire';
const url = 'mongodb://localhost:27017';
const mongoOptions = {useNewUrlParser: true};

const state = {
    db: null
};

function connect(callback) {
    if (state.db) callback();
    else {
        MongoClient.connect(url, mongoOptions, (err, client) => {
            if (err) callback(err);
            else {
                state.db = client.db(dbname);
                callback();
            }
        });
    }
}

function getPrimaryKey(_id) {
    return ObjectID(_id);
}

function getDB() {
    return state.db;
}

function validID(id) {
    return ObjectID.isValid(id);
}

module.exports = {connect, getPrimaryKey, getDB, validID};