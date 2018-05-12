const express = require('express'),
      session = require('express-session'),
      SqliteStore = require('connect-sqlite3')(session),
      config = require('./config.json'),
      auth = require('./auth'),
      path = require('path')
      app = express();

if (config.trustProxy)
    app.set('trust proxy', config.trustProxy);
app.set('views', './views');
app.set('view engine', 'pug');

app.use('/css', express.static(path.join(__dirname, 'node_modules/bulma/css'))); // bulma css
app.use(express.static('./static'));
app.use(session({
    secret: config.secretKey,
    cookie: {
        httpOnly: true
    },
    store: new SqliteStore({table: 'sessions', db: config.sessionDb}),
    saveUninitialized: false,
    resave: true,
    name: config.sessionName
}))

// authentication routes
const {loginGet, loginPost, indexPage, logout} = require('./routes/authRoutes')(auth);
app.get('/login', loginGet);
app.post('/login', express.urlencoded({extended: false}), loginPost);
app.get('/', indexPage);
app.get('/logout', logout);

// log viewer and search
let authenticateReq = (req, res, next) => {if(!req.session.userId) return res.redirect('/'); else next();};
app.use('/log', authenticateReq);
app.use('/log', require('./routes/logRouter')('/log/'));
app.use('/search', authenticateReq);
app.use('/search', require('./routes/searchRouter')('/log/'));
app.use((err, req, res, next) => {
    res.status(500).render('error');
    console.error(err);
});

auth.init(config).then(() => {
    console.log("database initialized");
    app.listen(config.port, () => {
        console.log('listening on ' + config.port);
    });
})
