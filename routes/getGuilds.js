module.exports = (vars) => {
    const app = vars.app;
    const db = vars.db;
    const models = vars.models;
    const logger = vars.logger;
    app.get('/getGuilds', (req, res) => {
        models.Guild.find({}, (err, results) => {
            if (err) {
                logger.error(`Error while getting guild (/getGuilds): ${err}`);
                res.status(500).json({
                    type: 'error',
                    message: 'Error when getting guilds'
                });
            } else {
                res.json(results);
            }
        });
    });
};