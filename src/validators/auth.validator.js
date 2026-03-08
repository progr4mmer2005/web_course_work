function validateRegister(body) {
  const errors = [];

  if (!body.full_name || body.full_name.trim().length < 2) {
    errors.push('Имя должно содержать минимум 2 символа');
  }

  if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
    errors.push('Введите корректный email');
  }

  if (!body.phone || !/^\+?[0-9\-\s()]{10,20}$/.test(body.phone)) {
    errors.push('Введите корректный телефон');
  }

  if (!body.password || body.password.length < 6) {
    errors.push('Пароль должен быть не короче 6 символов');
  }

  return errors;
}

module.exports = {
  validateRegister
};
