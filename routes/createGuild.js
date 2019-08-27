module.exports = (vars) => {
    const app = vars.app;
    const db = vars.db;
    const models = vars.models;
    const logger = vars.logger;
    app.get('/createGuild', (req, res) => {
        if (!req.query.name || !req.query.name.trim()) {
            res.json({
                type: 'error',
                message: 'Invalid name'
            });
            return;
        }
        let guild = new models.Guild({
            name: req.query.name
        });
        guild.save((err, result) => {
            if (err) {
                res.status(500).json({
                    type: 'error',
                    message: 'Error when saving guild'
                });
            } else {
                res.json(result);
            }
        });
    });
};