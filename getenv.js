let env = require('dotenv').config({});
if (env.error) throw env.error;
env = require('dotenv-parse-variables')(env.parsed);
Object.freeze(env);

module.exports = env;