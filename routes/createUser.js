const bcrypt = require('bcrypt');
const uuid = require('uuid/v4');

module.exports = (vars) => {
    const app = vars.app;
    const models = vars.models;
    const logger = vars.logger;
    const env = vars.env;
    app.post('/createUser', async (req, res) => {
        if (!req.query.name || !req.query.name.trim()) {
            return res.json({
                type: 'error',
                message: 'Invalid name'
            });
        }
        if (!req.query.password || !req.query.password.trim()) {
            return res.json({
                type: 'error',
                message: 'Invalid password'
            });
        }

        let existing;
        try { 
            existing = await models.User.findOne({name: req.query.name}).exec();
        } catch (e) {
            return res.status(500).json({
                type: 'error',
                message: 'Error while accessing db'
            });
        }
        if (existing) {
            return res.status(403).json({
                type: 'error',
                message: 'User already exists'
            })
        }

        let password;
        try {
            password = await bcrypt.hash(req.query.password, env.SALT_ROUNDS);
        } catch (e) {
            logger.error('Error when hashing password: ' + e);
            return res.status(500).json({
                type: 'error',
                message: 'Error while hashing password'
            });
        }
        let user = new models.User({
            name: req.query.name,
            password: password,
            token: uuid()
        });
        
        let saved;
        try {
            saved = await user.save();
        } catch (e) {
            logger.error('Error when saving user: ' + e);
            return res.status(500).json({
                type: 'error',
                message: 'Error when saving user'
            })
        }
        res.json({
            name: saved.name,
            _id: saved._id, // will later be replaced with id
            token: saved.token
        });
    });
};