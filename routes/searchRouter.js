const express = require('express'),
    Reader = require('../zncreader'),
    reader = new Reader(require('../config.json').zncpath),
    regexSearchAllowed = require('../config.json').allowRegexSearch,
    wrapAsync = require('express-async-wrap');

module.exports = prefix => {
    let makeLink = (network, channel, datetime) => prefix + [network,channel ? channel : "",datetime ? datetime : ""].filter(v => v != "").map(encodeURIComponent).join("/");
    let router = express.Router();
    router.get('/', wrapAsync(async (req, res) => {
        res.render('search', {
            networks: await reader.getNetworks(req.session.userId)
        });
    }));
    router.post('/', express.urlencoded({extended: false}), wrapAsync(async (req, res) => {
        let userId = req.session.userId, network = req.body.network;
        let channels = await reader.getChannels(userId, network)
        if (req.body.channels && req.body.channels.trim().length > 0)
            channels = channels.filter(v => req.body.channels.trim().split(',').indexOf(v) != -1)
        var result = {}, filterFunc;
        let queryRegex = new RegExp(req.body.query);
        if (req.body.filterType == "nickname" && req.body.regex === "true" && regexSearchAllowed) {
            filterFunc = v => v.type === "message" && queryRegex.test(v.nickname);
        } else if (req.body.filterType === "nickname") {
            filterFunc = v => v.type === "message" && v.nickname.includes(req.body.query);
        } else if (req.body.filterType === "message" && req.body.regex === "true" && regexSearchAllowed) {
            filterFunc = v => v.type === "message" && queryRegex.test(v.text);
        } else if (req.body.filterType === "message") {
            filterFunc = v => v.type === "message" && v.text.includes(req.body.query);
        } else if (req.body.filterType == "nickAndMsg"&& req.body.regex === "true" && regexSearchAllowed) {
            filterFunc = v => v.type === "message" && (v.nickname.includes(req.body.query) || v.nickname.includes(req.body.query));
        } else if (req.body.filterType == "nickAndMsg") {
            filterFunc = v => v.type === "message" && (queryRegex.test(v.nickname) || queryRegex.test(v.query));
        } else {
            return res.redirect('/search');
        }
        for(var channel of channels) {
            result[channel] = [];
            for(var datetime of await reader.getDatetimes(userId, network, channel)) {
                let parsed = await reader.parseLog(await reader.readLog(userId, network, channel, datetime));
                let searchResult = parsed.filter(filterFunc);
                if(searchResult.length > 0) {
                    result[channel].push({datetime: datetime, result: searchResult});
                }
            }
            if(result[channel].length == 0) delete result[channel];
        }
        res.render('search_result', {
            result: result,
            network: network
        })
    }));
    return router;
};