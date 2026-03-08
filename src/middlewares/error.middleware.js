function notFound(req, res) {
  res.status(404).render('partials/error', {
    layout: 'main',
    title: '404',
    message: 'Страница не найдена'
  });
}

function errorHandler(error, req, res, next) {
  console.error(error);
  res.status(500).render('partials/error', {
    layout: 'main',
    title: 'Ошибка сервера',
    message: 'Внутренняя ошибка сервера'
  });
}

module.exports = {
  notFound,
  errorHandler
};
