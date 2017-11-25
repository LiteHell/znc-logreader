const sqlite3 = require('sqlite3'),
    bcrypt = require('bcryptjs');
var db;

exports.init = (config) => {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(config.authDb, (err) => {
            if (err)
                return reject(err);
            db.exec('CREATE TABLE IF NOT EXISTS accounts (id TEXT UNIQUE NOT NULL, password TEXT NOT NULL)', (err) => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    });
}

// data : {id, passsword, expiresAt=null, admin=false}
exports.createAccount = (data) => {
    var _ht = this;
    return new Promise((resolve, reject) => {
        if (typeof data.id !== 'string') return reject('id is not a string!');
        if (typeof data.password !== 'string') return reject('password is not a string!');
        _ht.hasID(data.id).then((exists) => {
            if (exists)
                return reject("id_already_exists");
            else
                bcrypt.genSalt(10, function (err, salt) {
                    if (err)
                        return reject(err);
                    bcrypt.hash(data.password, salt, function (err, hash) {
                        if (err)
                            return reject(err);
                        db.run('INSERT INTO accounts (id, password) VALUES (?, ?)', [data.id, hash], (err) => {
                            if (err)
                                return reject(err);
                            resolve();
                        })
                    });
                });
        }).catch((err) => {
            reject(err);
        })
    });
}

exports.hasID = (id) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT id FROM accounts WHERE id = ?", id, (err, row) => {
            if (err)
                return reject(err);
            else if (typeof row === "undefined")
                return resolve(false);
            else
                return resolve(true);
        })
    })
}

exports.matchPassword = (id, password) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT password FROM accounts WHERE id = ?", id, (err, row) => {
            if (err)
                return reject(err);
            else if (typeof row === "undefined")
                return reject("id_not_exists");
            else {
                bcrypt.compare(password, row.password, (err, matched) => {
                    if (err)
                        return reject(err);
                    return resolve(matched);
                })
            }
        })
    })
}

exports.changePassword = (id, password) => {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(10, function (err, salt) {
            if (err)
                return reject(err);
            bcrypt.hash(password, salt, function (err, hash) {
                if (err)
                    return reject(err);
                db.run('UPDATE accounts SET password = ? WHERE id = ?', [hash, id], (err) => {
                    if (err)
                        reject(err);
                    if (this.changes == 0)
                        reject("id_not_exists");
                    else
                        resolve();
                })
            });
        });
    })
}

exports.getIds = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT id FROM accounts", (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows.map(v => v.id));
        })
    })
}