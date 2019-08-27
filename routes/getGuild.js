module.exports = (vars) => {
    const app = vars.app;
    const db = vars.db;
    const models = vars.models;
    const logger = vars.logger;
    app.get('/getGuild', (req, res) => {
        if (!db.validID(req.query.id)) {
            logger.debug(`/getGuild has been called with an invalid ID (${req.query.id})`);
            res.json({
                type: 'error',
                message: 'Invalid ID'
            });
            return
        }
        models.Guild.findById(req.query.id, (err, result) => {
            if (err) {
                logger.error(`Error while getting guild (/getGuild?id=${req.query.id}): ${err}`);
                res.status(500).json({
                    type: 'error',
                    message: 'Error when getting guild ' + req.query.id
                });
            } else {
                logger.silly(`(/getGuild?id=${req.query.id}) has returned ${JSON.stringify(result)}`);
                res.json(result);
            }
        });
    });
};