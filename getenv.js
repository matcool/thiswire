const exists = require('fs').existsSync;
let path = './.env.local';
if (!exists(path)) path = './.env';
let env = require('dotenv').config({path});
if (env.error) throw env.error;
env = require('dotenv-parse-variables')(env.parsed);
Object.freeze(env);

module.exports = env;