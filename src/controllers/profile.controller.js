const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const orderModel = require('../models/order.model');

function validPhone(phone) {
  return /^\+?[0-9\-\s()]{10,20}$/.test(phone || '');
}

async function profilePage(req, res, next) {
  try {
    const [user, orders] = await Promise.all([
      userModel.findById(req.session.user.id),
      orderModel.listUserOrders(req.session.user.id)
    ]);

    if (!user) {
      return res.redirect('/auth/login');
    }

    return res.render('profile/index', {
      title: 'Профиль',
      user,
      orders
    });
  } catch (error) {
    return next(error);
  }
}

async function passwordPage(req, res, next) {
  try {
    const user = await userModel.findById(req.session.user.id);
    if (!user) return res.redirect('/auth/login');

    return res.render('profile/password', {
      title: 'Смена пароля',
      user
    });
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const fullName = String(req.body.full_name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();

    const errors = [];
    if (fullName.length < 2) errors.push('Имя должно быть не короче 2 символов');
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.push('Введите корректный email');
    if (!validPhone(phone)) errors.push('Введите корректный номер телефона');

    const emailUsed = await userModel.emailExistsForAnotherUser(email, req.session.user.id);
    if (emailUsed) errors.push('Этот email уже используется другим пользователем');

    let avatarPath = '';
    if (req.files && req.files.avatar) {
      const file = req.files.avatar;
      const ext = path.extname(file.name || '').toLowerCase();
      const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
      if (!allowed.includes(ext)) {
        errors.push('Разрешены только изображения jpg, jpeg, png, webp');
      } else {
        const targetDir = path.join(process.cwd(), 'uploads', 'avatars');
        fs.mkdirSync(targetDir, { recursive: true });
        const filename = `user_${req.session.user.id}_${Date.now()}${ext}`;
        const targetPath = path.join(targetDir, filename);
        await file.mv(targetPath);
        avatarPath = `avatars/${filename}`;
      }
    }

    if (errors.length) {
      const [user, orders] = await Promise.all([
        userModel.findById(req.session.user.id),
        orderModel.listUserOrders(req.session.user.id)
      ]);

      return res.status(400).render('profile/index', {
        title: 'Профиль',
        user: {
          ...user,
          full_name: fullName,
          email,
          phone
        },
        orders,
        errors
      });
    }

    await userModel.updateProfile(req.session.user.id, {
      fullName,
      email,
      phone,
      avatarPath
    });

    const user = await userModel.findById(req.session.user.id);
    req.session.user = user;

    return res.redirect('/profile');
  } catch (error) {
    return next(error);
  }
}

async function updatePassword(req, res, next) {
  try {
    const oldPassword = String(req.body.old_password || '');
    const newPassword = String(req.body.new_password || '');
    const newPasswordConfirm = String(req.body.new_password_confirm || '');

    const errors = [];
    if (!oldPassword) errors.push('Введите старый пароль');
    if (!newPassword) errors.push('Введите новый пароль');
    if (newPassword.length > 0 && newPassword.length < 6) {
      errors.push('Новый пароль должен быть не короче 6 символов');
    }
    if (newPassword !== newPasswordConfirm) {
      errors.push('Новый пароль и подтверждение не совпадают');
    }

    const user = await userModel.findById(req.session.user.id);
    if (!user) return res.redirect('/auth/login');

    if (errors.length) {
      return res.status(400).render('profile/password', {
        title: 'Смена пароля',
        user,
        errors
      });
    }

    const currentHash = await userModel.getPasswordHashById(req.session.user.id);
    const oldMatches = currentHash ? await bcrypt.compare(oldPassword, currentHash) : false;
    if (!oldMatches) {
      return res.status(400).render('profile/password', {
        title: 'Смена пароля',
        user,
        errors: ['Старый пароль указан неверно']
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await userModel.updatePasswordHash(req.session.user.id, newHash);

    return res.redirect('/profile/password?changed=1');
  } catch (error) {
    return next(error);
  }
}

async function confirmOrderDelivery(req, res, next) {
  try {
    await orderModel.clientConfirmDelivery(Number(req.params.id), req.session.user.id);
    return res.redirect('/profile');
  } catch (error) {
    return next(error);
  }
}

async function orderDetailsPage(req, res, next) {
  try {
    const orderId = Number(req.params.id);
    const order = await orderModel.getUserOrderDetails(orderId, req.session.user.id, {
      ignoreUserScope: true
    });

    return res.render('profile/order-details', {
      title: order ? `Заказ #${order.id}` : 'Детали заказа',
      order
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  profilePage,
  passwordPage,
  updateProfile,
  updatePassword,
  confirmOrderDelivery,
  orderDetailsPage
};
