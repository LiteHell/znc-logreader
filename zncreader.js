const path = require('path'),
    fs = require('fs'),
    async = require('async');

function getDirectories(dir) {
    return new Promise((resolve, reject) => {
        async.waterfall([
            (callback) => fs.readdir(dir, callback),
            (files, callback) => callback(null, files.filter(n => fs.lstatSync(path.join(dir, n)).isDirectory()))
        ], (err, directories) => {
            if (err)
                return reject(err);
            resolve(directories);
        })
    });
}

function ZncReader(zncpath, useGlobalModdata) {
    let getModDataPath = (user) => path.join(zncpath, useGlobalModdata ? "/moddata/log/" + user.toLowerCase() : "/users/" + user + "/moddata/log");
    this.getNetworks = (username) => getDirectories(getModDataPath(username));
    this.getChannels = (username, network) => getDirectories(path.join(getModDataPath(username), network));
    this.getDatetimes = (username, network, channel) => {
        return new Promise((resolve, reject) => {
            let channelDirectory = path.join(getModDataPath(username), network, channel);
            async.waterfall([
                (callback) => fs.readdir(channelDirectory, callback),
                (files, callback) => callback(null, files.filter(n => !fs.lstatSync(path.join(channelDirectory, n)).isDirectory())),
                (files, callback) => callback(null, files.filter(v => /[0-9]{4}-[0-9]{2}-[0-9]{2}\.log$/.test(v)).map(v => v.replace(/\.log$/i, '')))
            ], (err, logDates) => {
                if (err)
                    return reject(err);
                resolve(logDates);
            })
        });
    }
    this.readLog = (username, network, channel, datetime) => {
        return new Promise((resolve, reject) => {
            let logFilePath = path.join(getModDataPath(username), network, channel, datetime + ".log");
            fs.readFile(logFilePath, {encoding: 'utf8'}, (err, raw) => {
                if (err)
                    return reject(err);
                resolve(raw);
            });
        })
    }
    this.parseLog = (logText) => {
        return new Promise((resolve, reject) => {
            let lines = logText.split('\n').filter(v => v.trim().length != 0);
            let result = [];
            let timestampPattern = /^\[([0-9]{2})\:([0-9]{2})\:([0-9]{2})]/;
            for(var i = 0; i < lines.length; i++) {
                let line = lines[i];
                if(!timestampPattern.test(line)) {
                    result.push({type: "parse_failed", text: line});
                    continue;
                }
                let tsMatches = timestampPattern.exec(line);
                let ts = {hours: tsMatches[1], minutes: tsMatches[2], seconds: tsMatches[3]};
                let content = line.substring(11);
                if(/^\<(.+?)\> (.+)$/.test(content)) {
                    let matches = /^\<(.+?)\> (.+)$/.exec(content);
                    result.push({
                        type: "message",
                        when: ts,
                        nickname: matches[1],
                        text: matches[2]
                    });
                } else if(content.startsWith('***')) {
                    let specialContent = content.substring(4);
                    let joinPattern = /^Joins\: (.+?) \((.*?)\)$/,
                        quitPattern = /^Quits\: (.+?) \((.+?)\) \((.*?)\)$/,
                        partPattern = /^Parts\: (.+?) \((.+?)\) \((.*?)\)$/,
                        modePattern = /^(.+?) sets mode: ([+-][a-zA-Z0-9]+) (.+?)$/,
                        chanModePattern = /^(.+?) sets mode: ([+-][a-zA-Z0-9]+)$/,
                        topicPattern = /^(.+?) changes topic to '(.*)'$/;
                        kickPattern = /^(.+?) was kicked by (.+?) \((.*?)\)$/;
                    if(joinPattern.test(specialContent)) {
                        let matches = joinPattern.exec(specialContent);
                        result.push({
                            type: "join",
                            when: ts,
                            nickname: matches[1],
                            hostname: matches[2]
                        });
                    } else if(quitPattern.test(specialContent)) {
                        let matches = quitPattern.exec(specialContent);
                        result.push({
                            type: "quit",
                            when: ts,
                            nickname: matches[1],
                            hostname: matches[2],
                            reason: matches[3]
                        });
                    } else if(partPattern.test(specialContent)) {
                        let matches = partPattern.exec(specialContent);
                        result.push({
                            type: "part",
                            when: ts,
                            nickname: matches[1],
                            hostname: matches[2],
                            reason: matches[3]
                        });
                    } else if(modePattern.test(specialContent)) {
                        let matches = modePattern.exec(specialContent);
                        result.push({
                            type: "mode",
                            when: ts,
                            setter: matches[1],
                            mode: matches[2],
                            target: matches[3]
                        });
                    } else if(chanModePattern.test(specialContent)) {
                        let matches = chanModePattern.exec(specialContent);
                        result.push({
                            type: "mode",
                            when: ts,
                            setter: matches[1],
                            mode: matches[2]
                        });
                    } else if(topicPattern.test(specialContent)) {
                        let matches = topicPattern.exec(specialContent);
                        result.push({
                            type: "topic",
                            when: ts,
                            setter: matches[1],
                            topic: matches[2]
                        });
                    } else if(kickPattern.test(specialContent)) {
                        let matches = kickPattern.exec(specialContent);
                        result.push({
                            type: "kick",
                            when: ts,
                            kicked: matches[1],
                            kicker: matches[2],
                            reason: matches[3]
                        });
                    } else {
                        result.push({
                            type: "special",
                            when: ts,
                            text: specialContent
                        });
                    }
                } else {
                    result.push({
                        type: "parse_failed",
                        when: ts,
                        text: content
                    })
                }
            }
            resolve(result);
        });
    }
}

module.exports = ZncReader;