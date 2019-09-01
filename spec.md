# General info
* All ids are mongodb's ObjectIDs
  * ObjectIDs are a string of 24 hex characters (0123456789abcdef)
* Most requests will return an object with the structure `{type: 'error', message: (message)}` when an error occurs, having http status code 500 if internal, or 400 if client's fault
# API endpoints
## `POST` /login
> `name` - User's name \
> `password` - User's password

Returns the user's token, which is used for indentification everywhere else
Returns `{}` if user could not be found or wrong password

---
## /getUser
> `id` - User id  

Returns the requested user

---
## /getChannel
> `id` - Channel id  

Returns the requested channel

---
## /getGuild
> `id` - Guild id  

Returns the requested guild

---
## /getGuilds

Returns all available guilds

---
## `POST` /createChannel
> `guildId` - Guild id \
> `name` - Channel name

Creates a new channel with given name in given guild

---
## `POST` /createGuild
> `name` - Guild name

Creates a new guild with given name

---
## `POST` /createUser
> `name` - Username \
> `password` - User name

Creates an user with given name and password, and returns a object with the structure
```js
{
    _id: String,
    name: String,
    token: String
}
```

# Socket events

## login(token)
### *(only emitted by the client)*
This is so the socket know which user its talking to

## logged in
### *(only emitted by the server)*
This is emitted after successfully logging in

---
## chat message(message)
### *(emitted by the client and server)*
`message` is a object with the structure of `{text: String, author: ObjectID, timestamp: Date}`. When being sent from the client it only contains `text`, the other two are only present went sent from the server

---
## chat messages(messages)
### *(only emitted by the server)*
same as `chat message`, except its a list of messages
