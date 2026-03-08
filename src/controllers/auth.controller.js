const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const { validateRegister } = require('../validators/auth.validator');

function loginForm(req, res) {
  res.render('auth/login', { title: 'Вход' });
}

function registerForm(req, res) {
  res.render('auth/register', { title: 'Регистрация' });
}

async function register(req, res, next) {
  try {
    const errors = validateRegister(req.body);

    const existing = req.body.email ? await userModel.findByEmail(req.body.email.trim().toLowerCase()) : null;
    if (existing) {
      errors.push('Пользователь с таким email уже существует');
    }

    if (errors.length) {
      return res.status(400).render('auth/register', {
        title: 'Регистрация',
        errors,
        values: req.body
      });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const userId = await userModel.createClient({
      fullName: req.body.full_name.trim(),
      email: req.body.email.trim().toLowerCase(),
      phone: req.body.phone.trim(),
      passwordHash
    });

    const user = await userModel.findById(userId);
    req.session.user = user;

    return res.redirect('/');
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(400).render('auth/login', {
        title: 'Вход',
        errors: ['Неверный email или пароль'],
        values: { email }
      });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(400).render('auth/login', {
        title: 'Вход',
        errors: ['Неверный email или пароль'],
        values: { email }
      });
    }

    req.session.user = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      avatar_path: user.avatar_path,
      can_review_product: Number(user.can_review_product || 0),
      can_review_store: Number(user.can_review_store || 0),
      role_code: user.role_code
    };

    return res.redirect('/');
  } catch (error) {
    return next(error);
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/');
  });
}

module.exports = {
  loginForm,
  registerForm,
  register,
  login,
  logout
};
