const fs = require('fs');
const path = require('path');
const routes = [];
fs.readdirSync(__dirname).forEach(i => {
    if (i === path.basename(__filename)) return;
    routes.push(require(path.join(__dirname, i)));
});

module.exports = (vars) => {
    routes.forEach(route => route(vars));
};