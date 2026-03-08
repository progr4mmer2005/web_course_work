function attachCurrentUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.isAuth = Boolean(req.session.user);
  next();
}

module.exports = attachCurrentUser;
