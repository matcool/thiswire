# General info
* All ids are mongodb's ObjectIDs
  * ObjectIDs are a string of 24 hex characters (0123456789abcdef)
# API endpoints
## /getUser
> `id` - User's id  

Returns the requested user. If none found will return `{}`, if internal error will return `{type: 'error',message:'(Server error message)'}`

---
## /login

Not yet implemented, will replace logging in via socket

# Socket events
## login(user, callback)
### *(only emitted by the client)*
`user` is a object with the structure of `{name: String}`. The `callback` function will be called with one argument `user`, which currently has the same structure of the one sent by the client

---
## chat message(message)
### *(emitted by the client and server)*
`message` is a object with the structure of `{text: String, author: ObjectID, timestamp: Date}`. When being sent from the client it only contains `text`, the other two are only present went sent from the server

---
## chat messages(messages)
### *(only emitted by the server)*
same as `chat message`, except its a list of messages

---