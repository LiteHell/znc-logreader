const express = require('express'),
    Reader = require('../zncreader'),
    config = require('../config.json'),
    reader = new Reader(config.zncpath, config.useGlobalLog),
    wrapAsync = require('express-async-wrap');

module.exports = (prefix) => {
    let makeLink = (network, channel, datetime) => prefix + [network,channel ? channel : "",datetime ? datetime : ""].filter(v => v != "").map(encodeURIComponent).join("/");
    let validateSelecteds = (userId, selected) => {
        let networks = await reader.getNetworks(userId);
        if(selected.network && !networks.includes(selected.network))
            return false;
        let channels = await reader.getChannels(userId, selected.network);
        if(selected.channel && !channels.includes(selected.channel))
            return false;
        let datetimes = await reader.getDatetimes(userId, selected.network, selected.datetime);
        if(selected.datetime && !datetimes.includes(selected.datetime))
            return false;
        return true;
    };
    async function makeNetAsideMenu(userId, network, selected = {
        network: null
    }) {
        let networks = await reader.getNetworks(userId);
        return networks.map(v =>
            ({
                href: makeLink(v),
                text: v,
                active: selected.network === v
            })
        );
    }
    async function makeNetChanAsideMenu(userId, network, selected = {
        network: null,
        channel: null
    }) {
        let networks = await reader.getNetworks(userId);
        let channels = await reader.getChannels(userId, network);
        return networks.map((n) => {
            let i = {
                href: makeLink(n),
                text: n,
                active: selected.network === n
            }
            if (i.active)
                i.children = channels.map(c => ({
                    href: makeLink(n, c),
                    text: c,
                    active: selected.channel === c
                }));
            return i;
        });
    }
    const router = express.Router();
    router.get('/', wrapAsync(async(req, res) => {
        let userId = req.session.userId
        let networks = await reader.getNetworks(userId);
        let networkLinks = networks.map((v) => {
            return {
                href: makeLink(v),
                text: v
            }
        });
        res.render('list', {
            list: {
                name: 'Networks',
                description: 'list of networks which has logs',
                items: networkLinks
            },
            asideMenus: [{
                title: "Networks",
                hideOnMobile: true,
                items: await makeNetAsideMenu(userId)
            }]
        });
    }));
    router.get('/:network', wrapAsync(async(req, res) => {
        let selected = {
                network: req.params.network
            },
            userId = req.session.userId
        if(!validateSelecteds(userId, selected))
            return res.redirect('../')
        let channels = await reader.getChannels(userId, selected.network);
        let channelLinks = channels.map((v) => {
            return {
                href: makeLink(selected.network, v),
                text: v
            }
        });
        res.render('list', {
            list: {
                name: 'Networks',
                description: 'channels of ' + selected.network + ' network',
                items: channelLinks
            },
            asideMenus: [{
                title: "Networks",
                hideOnMobile: true,
                items: await makeNetChanAsideMenu(userId, selected.network, selected)
            }]
        });
    }));
    router.get('/:network/:channel', wrapAsync(async(req, res) => {
        let selected = {
                network: req.params.network,
                channel: req.params.channel
            },
            userId = req.session.userId;
        if(!validateSelecteds(userId, selected))
            return res.redirect('../')
        let datetimes = await reader.getDatetimes(userId, selected.network, selected.channel);
        let logLinks = datetimes.map((v) => {
            return {
                href: makeLink(selected.network, selected.channel, v),
                text: v
            }
        });
        res.render('list', {
            list: {
                name: 'Log Files',
                description: 'pick datetime you want',
                items: logLinks
            },
            asideMenus: [{
                    title: "Networks",
                    hideOnMobile: true,
                    items: await makeNetChanAsideMenu(userId, selected.network, selected)
                },
                {
                    title: "Datetimes",
                    hideOnMobile: true,
                    items: logLinks
                }
            ]
        });
    }));
    router.get('/:network/:channel/:datetime', wrapAsync(async(req, res) => {
        let selected = {
                network: req.params.network,
                channel: req.params.channel,
                datetime: req.params.datetime
            },
            userId = req.session.userId;
        if(!validateSelecteds(userId, selected))
            return res.redirect('../')
        let rawLog = await reader.readLog(userId, selected.network, selected.channel, selected.datetime);
        let logEntries = await reader.parseLog(rawLog);
        let datetimes = await reader.getDatetimes(userId, selected.network, selected.channel);
        let datetimeLinks = datetimes.map(v => ({
            href: makeLink(selected.network) + '/' + encodeURIComponent(selected.channel) + '/' + v,
            text: v,
            active: v === selected.datetime
        }))
        res.render('irclog', {
            network: selected.network,
            channel: selected.channel,
            datetime: selected.datetime,
            asideMenus: [{
                title: "Datetimes",
                hideOnMobile: true,
                items: datetimeLinks
            }, {
                title: "Networks",
                hideOnMobile: true,
                items: await makeNetChanAsideMenu(userId, selected.network, selected)
            }],
            log: logEntries
        });
    }));
    return router;
}