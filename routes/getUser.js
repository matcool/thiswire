module.exports = (vars) => {
    const app = vars.app;
    const db = vars.db;
    const models = vars.models;
    const logger = vars.logger;
    app.get('/getUser', (req, res) => {
        if (!db.validID(req.query.id)) {
            logger.debug(`/getUser has been called with an invalid ID (${req.query.id})`);
            res.json({
                type: 'error',
                message: 'Invalid ID'
            });
            return
        }
        models.User.findById(req.query.id, (err, result) => {
            if (err) {
                logger.error(`Error while getting user (/getUser?id=${req.query.id}): ${err}`);
                res.status(500).json({
                    type: 'error',
                    message: 'Error when getting user ' + req.query.id
                });
            } else {
                // Filter out important data
                res.json({
                    _id: result._id,
                    name: result.name
                });
            }
        });
    });
};