function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  return next();
}

function requireGuest(req, res, next) {
  if (req.session.user) {
    return res.redirect('/');
  }
  return next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    if (!roles.includes(req.session.user.role_code)) {
      return res.status(403).render('partials/error', {
        layout: 'main',
        title: 'Нет доступа',
        message: 'Недостаточно прав для просмотра этой страницы'
      });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireGuest,
  requireRole
};
