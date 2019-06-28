'use strict';
module.exports = mongoose => {
    const Types = mongoose.Schema.Types;

    let userSchema = new mongoose.Schema({
        name: String
    });
    let User = new mongoose.model('User', userSchema);

    let messageSchema = new mongoose.Schema({
        text: String,
        author: Types.ObjectId,
        timestamp: Date
    });
    let Message = new mongoose.model('Message', messageSchema);

    return {User, Message}
};