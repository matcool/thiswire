# (WIP) Thiswire
A simple chat app
# Note
As this is WIP, things will change a lot
# Installation
Make sure you have these installed:
* [node.js](https://nodejs.org)
* [Mongodb](https://www.mongodb.com/download-center/community)

You will need a mongodb server running on port 27017, which you can get by doing
```bash
mongod
# Or if you want to change the database folder
mongod --dbpath <path>
```
Now to start the server, run `node server.js` and go to http://localhost:3000

Currently the client is just simple html and js, although it will in the future be changed to use stuff like webpack, vue file components, single page apps, etc