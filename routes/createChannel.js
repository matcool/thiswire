module.exports = (vars) => {
    const app = vars.app;
    const db = vars.db;
    const models = vars.models;
    const logger = vars.logger;
    app.post('/createChannel', (req, res) => {
        if (!db.validID(req.query.guildId)) {
            logger.debug(`/createChannel has been called with an invalid ID (${req.query.guildId})`);
            res.json({
                type: 'error',
                message: 'Invalid ID'
            });
            return
        } else if (!req.query.name || !req.query.name.trim()) {
            res.json({
                type: 'error',
                message: 'Invalid channel name'
            });
            return;
        }
        models.Guild.findById(req.query.guildId, (err, guildres) => {
            if (err) {
                logger.error(`Error while getting guild (/createChannel?guildId=${req.query.guildId}): ${err}`);
                res.status(500).json({
                    type: 'error',
                    message: 'Error when getting guild'
                });
            } else if (!guildres) {
                res.json({
                    type: 'error',
                    message: 'Could not find guild'
                });
            } else {
                console.log(guildres);
                let channel = new models.Channel({
                    name: req.query.name,
                    guild: guildres._id
                });
                channel.save((err, result) => {
                    if (err) {
                        res.status(500).json({
                            type: 'error',
                            message: 'Error when saving channel'
                        });
                    } else {
                        guildres.channels.push(result._id);
                        guildres.save();
                        res.json(result);
                    }
                });
            }
        })
    });
};