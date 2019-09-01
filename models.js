'use strict';
module.exports = mongoose => {
    const Types = mongoose.Schema.Types;

    let userSchema = new mongoose.Schema({
        name: String,
        password: String, // bcrypt encrypted
        token: String
    });
    let User = new mongoose.model('User', userSchema);

    let messageSchema = new mongoose.Schema({
        text: String,
        author: Types.ObjectId,
        timestamp: Date,
        channel: Types.ObjectId
    });
    let Message = new mongoose.model('Message', messageSchema);

    let channelSchema = new mongoose.Schema({
        name: String,
        guild: Types.ObjectId
    });
    let Channel = new mongoose.model('Channel', channelSchema);

    let guildSchema = new mongoose.Schema({
        name: String,
        channels: [Types.ObjectId]
    });
    let Guild = new mongoose.model('Guild', guildSchema);

    return {User, Message, Channel, Guild}
};