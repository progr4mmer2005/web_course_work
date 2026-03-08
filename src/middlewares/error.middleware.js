function notFound(req, res) {
  const profileOrderMatch = String(req.path || '').match(/^\/profile\/orders\/(\d+)$/);
  if (profileOrderMatch) {
    return res.redirect(`/profile/order-details/${profileOrderMatch[1]}`);
  }

  return res.status(404).render('partials/error', {
    layout: 'main',
    title: '404',
    message: 'Страница не найдена'
  });
}

function errorHandler(error, req, res, next) {
  console.error(error);
  return res.status(500).render('partials/error', {
    layout: 'main',
    title: 'Ошибка сервера',
    message: 'Внутренняя ошибка сервера'
  });
}

module.exports = {
  notFound,
  errorHandler
};
