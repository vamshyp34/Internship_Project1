const express = require('express');
const mongoose = require('mongoose');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const MemoryStore = require('memorystore')(expressSession);
const passport = require('passport');
const flash = require('connect-flash');

const app = express();
// register view folder for the frontend side .. we are using ejs here
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.urlencoded({ extended: true }));
// Mongo db configuration
const mongoURI = require('./config/monkoKEY');
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => console.log('Connected !'));
// for generation of random cookie parser
app.use(cookieParser('random'));
// for creating of sesion for the user
app.use(
  expressSession({
    secret: 'random',
    resave: true,
    saveUninitialized: true,
    // setting the max age to longer duration
    maxAge: 24 * 60 * 60 * 1000,
    store: new MemoryStore(),
  })
);
// csrf token for registeration of form security
app.use(csrf());
app.use(passport.initialize());
app.use(passport.session());
// flash messages
app.use(flash());
// Kind of flash messages
app.use(function (req, res, next) {
  res.locals.success_messages = req.flash('success_messages');
  res.locals.error_messages = req.flash('error_messages');
  res.locals.error = req.flash('error');
  next();
});
// redirect to route.js
app.use(require('./controller/routes.js'));
// port no. 8000 or .env port
const PORT = process.env.PORT || 8000;
// listen the
app.listen(PORT, () => console.log('Server Started At ' + PORT));
