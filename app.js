const express = require('express'),
      session = require('express-session'),
      Sequelize = require('sequelize'),
      SequelizeStore = require('connect-session-sequelize')(session.Store),
      config = require('./config.json'),
      path = require('path')
      app = express();

if (config.trustProxy)
    app.set('trust proxy', config.trustProxy);
app.set('views', './views');
app.set('view engine', 'pug');

let sequelize = new Sequelize(config.sessionDbConnectionUrl);

app.use('/css', express.static(path.join(__dirname, 'node_modules/bulma/css'))); // bulma css
app.use(express.static('./static'));
app.use(session({
    secret: config.secretKey,
    cookie: {
        httpOnly: true
    },
    store: new SequelizeStore({db: sequelize}),
    saveUninitialized: false,
    resave: true,
    name: config.sessionName
}))
sequelize.sync();

// authentication routes
const {loginGet, loginPost, indexPage, logout} = require('./routes/authRoutes')();
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

app.listen(config.port, () => {
    console.log('listening on ' + config.port);
});
