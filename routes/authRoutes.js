const express = require('express'),
      ldap = require('ldapjs'),
      config = require('../config.json'),
      request = require('request');
module.exports = () => {
    var routes = {};
    let ldapClient = ldap.createClient({
      url: config.ldap.url
    });
    let tryLdapBind = (dn, password) => {
        return new Promise((resolve) => {
            ldapClient.bind(dn, password, (err) => {
                if (err) return resolve(false);
                return resolve(true);
            })
        })
    }
    // authentication
    routes.indexPage = (req, res) => {
        if (!req.session.userId) {
            return res.status(403).render('plzlogin');
        }
        res.redirect('/log');
    }
    routes.loginGet = (req, res) => {
        res.render('login', {reCAPTCHA: config.reCAPTCHA});
    }
    routes.loginPost = (req, res) => {
        if (typeof req.body.id !== "string" || req.body.id.length == 0)
            return res.render('login', {
                wrong: true,
                reason: 'Enter id.',
                reCAPTCHA: config.reCAPTCHA
            });
        if (typeof req.body.password !== "string" || req.body.password.length == 0)
            return res.render('login', {
                wrong: true,
                reason: 'Enter password.',
                reCAPTCHA: config.reCAPTCHA
            });
        function doMatch(){ 
            tryLdapBind(config.ldap.dn.replace(/%u/gi, req.body.id), req.body.password)
                .then((matched) => {
                    if (matched) {
                        req.session.userId = req.body.id;
                        req.session.save();
                        res.redirect('/');
                    } else {
                        res.render('login', {
                            wrong: true,
                            reCAPTCHA: config.reCAPTCHA
                        });
                    }
                })
                .catch((err) => {
                    if (err === "id_not_exists") {
                        res.render('login', {
                            wrong: true,
                            reCAPTCHA: config.reCAPTCHA
                        });
                    } else {
                        res.render('login', {
                            wrong: true,
                            reason: 'Interal server error',
                            reCAPTCHA: config.reCAPTCHA
                        });
                        console.error(err);
                    }
                });
        }
        if (config.reCAPTCHA.enabled) {
            request({url:`https://www.google.com/recaptcha/api/siteverify`, method:'POST', form: {
                secret: config.reCAPTCHA.secret,
                response: req.body["g-recaptcha-response"],
                remoteip: req.ip
            }}, (err, _res, reCaptchaBody) => {
                var reCaptchaResult = JSON.parse(reCaptchaBody);
                if (reCaptchaResult.success) {
                    doMatch();
                } else {
                    res.render('login', {wrong: true, reason: 'Please resolve the reCAPTCHA', reCAPTCHA: config.reCAPTCHA});
                }
            });
        } else {
            doMatch();
        }
    }
    routes.logout = (req, res) => {
        if (req.session.userId)
            req.session.destroy();
        res.redirect('/');
    }
    return routes;
};