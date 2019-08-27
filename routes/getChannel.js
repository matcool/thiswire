module.exports = (vars) => {
    const app = vars.app;
    const db = vars.db;
    const models = vars.models;
    const logger = vars.logger;
    app.get('/getChannel', (req, res) => {
        if (!db.validID(req.query.id)) {
            logger.debug(`/getChannel has been called with an invalid ID (${req.query.id})`);
            res.json({
                type: 'error',
                message: 'Invalid ID'
            });
            return
        }
        models.Channel.findById(req.query.id, (err, result) => {
            if (err) {
                logger.error(`Error while getting user (/getChannel?id=${req.query.id}): ${err}`);
                res.status(500).json({
                    type: 'error',
                    message: 'Error when getting channel ' + req.query.id
                });
            } else {
                logger.silly(`(/getChannel?id=${req.query.id}) has returned ${JSON.stringify(result)}`);
                res.json(result);
            }
        });
    });
};