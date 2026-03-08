require('dotenv').config();
const path = require('path');
const express = require('express');
const fileUpload = require('express-fileupload');
const { engine } = require('express-handlebars');

const hbsHelpers = require('./config/hbsHelpers');
const sessionMiddleware = require('./config/session');
const attachCurrentUser = require('./middlewares/currentUser.middleware');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  helpers: hbsHelpers
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());
app.use(sessionMiddleware);
app.use(attachCurrentUser);

app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use(routes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
