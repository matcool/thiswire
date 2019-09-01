const bcrypt = require('bcrypt');

module.exports = vars => {
    const app = vars.app;
    const models = vars.models;
    const logger = vars.logger;
    app.post('/login', async (req, res) => {
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
        models.User.findOne({name: req.query.name}, (err, result) => {
            if (err) {
                res.status(500).json({
                    type: 'error',
                    message: 'Error while getting user'
                });
            } else {
                if (!result) {
                    return res.json({});
                }
                bcrypt.compare(req.query.password, result.password, (err, same) => {
                    if (err) {
                        res.status(500).json({
                            type: 'error',
                            message: 'Error while comparing passwords'
                        });
                    } else if (same) {
                        res.json({
                            name: result.name,
                            _id: result._id,
                            token: result.token
                        });
                    } else {
                        res.json({});
                    }
                });
            }
        });
    });
}