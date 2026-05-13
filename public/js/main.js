$(function () {
  function getMaxQty(stock) {
    const stockNum = Number(stock || 0);
    return Math.max(1, Math.min(99, stockNum > 0 ? stockNum : 99));
  }

  function clampQty(value, stock) {
    let qty = Number(value);
    if (!Number.isFinite(qty)) qty = 1;
    return Math.max(1, Math.min(getMaxQty(stock), Math.round(qty)));
  }

  function formatCurrency(value) {
    const amount = Number(value || 0);
    return `${amount.toLocaleString('ru-RU')} ₽`;
  }

  function updateCartActionState($action, quantity) {
    const $label = $action.find('.cart-label');
    const $input = $action.find('.qty-input');
    const qty = Number(quantity || 0);
    const max = getMaxQty($action.data('stock'));

    $input.attr('max', max);

    if (qty > 0) {
      $action.addClass('is-in-cart');
      $label.text(`В корзине ${qty} шт.`);
      $input.val(qty);
    } else {
      $action.removeClass('is-in-cart');
      $action.removeClass('open');
      $label.text('Добавить в корзину');
      $input.val(1);
    }
  }

  function requestCartUpdate(productId, quantity, onDone) {
    $.ajax({
      url: '/api/cart/items',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ product_id: productId, quantity })
    })
      .done(function (response) {
        if (response.ok && typeof onDone === 'function') {
          onDone(response);
        }
      })
      .fail(function (xhr) {
        alert(xhr.responseJSON?.message || 'Не удалось обновить корзину');
      });
  }

  function updateCartSummary(pricing) {
    if (!pricing) return;

    $('#cart-subtotal').text(formatCurrency(pricing.subtotal || 0));
    $('#cart-discount').text(formatCurrency(pricing.discountTotal || 0));
    $('#cart-total').text(formatCurrency(pricing.total || 0));
    renderPromoCodes(pricing.promoCodes || []);

    $('.cart-item').each(function () {
      const $item = $(this);
      const productId = Number($item.data('product-id'));
      const found = (pricing.cartItems || []).find((x) => Number(x.product_id) === productId);
      if (found) {
        $item.find('.cart-line-total').text(formatCurrency(found.line_total || 0));
        $item.find('.cart-qty').val(clampQty(found.quantity, found.stock_quantity));
      }
    });
  }

  function renderPromoCodes(codes) {
    const $list = $('#cart-promo-list');
    if (!$list.length) return;

    const safeCodes = Array.isArray(codes) ? codes : [];
    if (!safeCodes.length) {
      $list.html('');
      return;
    }

    const html = safeCodes.map((code) => (
      `<div class="promo-chip" data-code="${code}">
        <span>${code}</span>
        <button type="button" class="promo-chip-remove" data-code="${code}" aria-label="Удалить промокод ${code}">&times;</button>
      </div>`
    )).join('');
    $list.html(html);
  }

  let promoMessageTimer = null;
  function setPromoMessage(text, type) {
    const $message = $('#cart-promo-message');
    if (!$message.length) return;

    $message.removeClass('is-error is-success');
    if (type === 'error') $message.addClass('is-error');
    if (type === 'success') $message.addClass('is-success');

    $message.text(text || '');
    if (!text) {
      $message.hide();
      return;
    }
    $message.show();

    if (promoMessageTimer) clearTimeout(promoMessageTimer);
    promoMessageTimer = setTimeout(function () {
      $message.fadeOut(200);
    }, 3000);
  }

  function triggerCartItemUpdate($card, quantity) {
    const productId = Number($card.data('product-id'));
    if (!productId) return;

    requestCartUpdate(productId, quantity, function (response) {
      if (response.data && response.data.pricing) {
        updateCartSummary(response.data.pricing);
      }
    });
  }

  $(document).on('mouseenter', '.cart-action.is-in-cart .add-to-cart', function () {
    const $action = $(this).closest('.cart-action');
    $action.addClass('open');
  });

  $(document).on('mouseleave', '.cart-action', function () {
    $(this).removeClass('open');
  });

  $(document).on('click', '.add-to-cart', function () {
    const $action = $(this).closest('.cart-action');
    const productId = Number($action.data('product-id'));
    const inCart = $action.hasClass('is-in-cart');
    const isDisabled = $(this).hasClass('is-disabled');

    if (!productId || isDisabled || inCart) return;

    requestCartUpdate(productId, 1, function () {
      updateCartActionState($action, 1);
      $action.addClass('open');
    });
  });

  $(document).on('keydown', '.add-to-cart', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      $(this).trigger('click');
    }
  });

  $(document).on('click', '.qty-plus', function () {
    const $action = $(this).closest('.cart-action');
    const productId = Number($action.data('product-id'));
    const stock = Number($action.data('stock') || 0);
    const current = Number($action.find('.qty-input').val() || 1);
    const next = clampQty(current + 1, stock);

    if (!productId) return;

    requestCartUpdate(productId, next, function () {
      updateCartActionState($action, next);
      $action.addClass('open');
    });
  });

  $(document).on('click', '.qty-minus', function () {
    const $action = $(this).closest('.cart-action');
    const productId = Number($action.data('product-id'));
    const stock = Number($action.data('stock') || 0);
    const current = Number($action.find('.qty-input').val() || 1);
    const next = clampQty(current - 1, stock);

    if (!productId) return;

    requestCartUpdate(productId, next, function () {
      updateCartActionState($action, next);
      $action.addClass('open');
    });
  });

  $(document).on('input', '.qty-input', function () {
    const $input = $(this);
    const stock = Number($input.closest('.cart-action').data('stock') || 0);
    $input.val(clampQty($input.val(), stock));
  });

  $(document).on('change', '.qty-input', function () {
    const $input = $(this);
    const $action = $input.closest('.cart-action');
    const productId = Number($action.data('product-id'));
    const stock = Number($action.data('stock') || 0);
    const next = clampQty($input.val(), stock);
    $input.val(next);

    if (!productId) return;

    requestCartUpdate(productId, next, function () {
      updateCartActionState($action, next);
      $action.addClass('open');
    });
  });

  $(document).on('click', '.qty-remove', function () {
    const $action = $(this).closest('.cart-action');
    const productId = Number($action.data('product-id'));

    if (!productId) return;

    $.ajax({
      url: `/api/cart/items/${productId}`,
      method: 'DELETE'
    })
      .done(function (response) {
        if (response.ok) {
          updateCartActionState($action, 0);
        }
      })
      .fail(function (xhr) {
        alert(xhr.responseJSON?.message || 'Ошибка удаления из корзины');
      });
  });

  function setWishlistState(productId, isWishlisted) {
    $(`.add-to-wishlist[data-id="${productId}"]`).each(function () {
      const $btn = $(this);
      const activeLabel = $btn.attr('data-label-active') || 'В избранном';
      const inactiveLabel = $btn.attr('data-label-inactive') || 'В избранное';

      if (isWishlisted) {
        $btn.addClass('is-active').text(activeLabel);
      } else {
        $btn.removeClass('is-active').text(inactiveLabel);
      }
    });
  }

  $(document).on('click', '.add-to-wishlist', function () {
    const $btn = $(this);
    const productId = Number($btn.data('id'));
    const isActive = $btn.hasClass('is-active');

    if (!productId) return;

    $.ajax({
      url: '/api/wishlist/items/toggle',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ product_id: productId, action: isActive ? 'remove' : 'add' })
    })
      .done(function (response) {
        if (response.ok) {
          setWishlistState(productId, Boolean(response.data && response.data.is_wishlisted));
        }
      })
      .fail(function (xhr) {
        if (xhr.status === 401) {
          window.location.href = '/auth/login';
        }
      });
  });

  $('.cart-remove').on('click', function () {
    const $card = $(this).closest('.cart-item');
    const productId = Number($card.data('product-id'));

    $.ajax({
      url: `/api/cart/items/${productId}`,
      method: 'DELETE'
    })
      .done(function (response) {
        if (!response.ok) return;

        $card.remove();
        if (response.data && response.data.pricing) {
          updateCartSummary(response.data.pricing);
        }
        if (!$('.cart-item').length) {
          window.location.reload();
        }
      })
      .fail(function (xhr) {
        alert(xhr.responseJSON?.message || 'Ошибка удаления из корзины');
      });
  });

  $(document).on('click', '.cart-page-plus', function () {
    const $card = $(this).closest('.cart-item');
    const $input = $card.find('.cart-qty');
    const stock = Number($input.data('stock') || 99);
    const current = Number($input.val() || 1);
    const next = clampQty(current + 1, stock);
    $input.val(next);
    triggerCartItemUpdate($card, next);
  });

  $(document).on('click', '.cart-page-minus', function () {
    const $card = $(this).closest('.cart-item');
    const $input = $card.find('.cart-qty');
    const stock = Number($input.data('stock') || 99);
    const current = Number($input.val() || 1);
    const next = clampQty(current - 1, stock);
    $input.val(next);
    triggerCartItemUpdate($card, next);
  });

  const cartInputTimers = {};

  $(document).on('input', '.cart-qty', function () {
    const $input = $(this);
    const $card = $input.closest('.cart-item');
    const productId = Number($card.data('product-id'));
    const stock = Number($input.data('stock') || 99);
    const clamped = clampQty($input.val(), stock);
    $input.val(clamped);

    if (cartInputTimers[productId]) {
      clearTimeout(cartInputTimers[productId]);
    }

    cartInputTimers[productId] = setTimeout(function () {
      triggerCartItemUpdate($card, clamped);
    }, 220);
  });

  $(document).on('change', '.cart-qty', function () {
    const $input = $(this);
    const $card = $input.closest('.cart-item');
    const stock = Number($input.data('stock') || 99);
    const clamped = clampQty($input.val(), stock);
    $input.val(clamped);
    triggerCartItemUpdate($card, clamped);
  });

  $('.qty-input').each(function () {
    const $input = $(this);
    const stock = Number($input.closest('.cart-action').data('stock') || 99);
    $input.attr('max', getMaxQty(stock));
  });

  $('.cart-qty').each(function () {
    const $input = $(this);
    const stock = Number($input.data('stock') || 99);
    $input.attr('max', getMaxQty(stock));
  });

  function syncFilterSelectState() {
    $('.filters select').each(function () {
      const $select = $(this);
      if (String($select.val() || '') === '') {
        $select.addClass('is-empty');
      } else {
        $select.removeClass('is-empty');
      }
    });
  }

  syncFilterSelectState();
  $(document).on('change', '.filters select', syncFilterSelectState);

  function initCatalogPerPageSlider() {
    const $form = $('#catalog-per-page-form');
    const $range = $('#catalog-per-page-range');
    const $value = $('#catalog-per-page-value');

    if (!$form.length || !$range.length || !$value.length) return;

    function updateView() {
      const min = Number($range.attr('min') || 4);
      const max = Number($range.attr('max') || 32);
      const current = Number($range.val() || min);
      const safeCurrent = Math.max(min, Math.min(max, current));
      const percent = ((safeCurrent - min) / (max - min)) * 100;

      $value.text(safeCurrent);
      $range.css('--range-percent', `${percent}%`);
    }

    updateView();
    $range.on('input', updateView);
    $range.on('change', function () {
      $form.trigger('submit');
    });
  }

  $(document).on('click', '.cart-promo-add', function () {
    const $input = $('#cart-promo-input');
    const code = String($input.val() || '').trim();
    if (!code) {
      setPromoMessage('Введите промокод', 'error');
      return;
    }

    $.ajax({
      url: '/api/cart/promos',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ code })
    }).done(function (response) {
      if (!response.ok) return;
      $input.val('');
      setPromoMessage('Промокод добавлен', 'success');
      if (response.data && response.data.pricing) {
        updateCartSummary(response.data.pricing);
      }
    }).fail(function (xhr) {
      setPromoMessage(xhr.responseJSON?.message || 'Не удалось активировать промокод', 'error');
    });
  });

  $(document).on('keydown', '#cart-promo-input', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('.cart-promo-add').trigger('click');
    }
  });

  $(document).on('click', '.promo-chip-remove', function () {
    const code = String($(this).data('code') || '').trim();
    if (!code) return;

    $.ajax({
      url: `/api/cart/promos/${encodeURIComponent(code)}`,
      method: 'DELETE'
    }).done(function (response) {
      if (!response.ok) return;
      if (response.data && response.data.pricing) {
        updateCartSummary(response.data.pricing);
      }
      setPromoMessage('Промокод удален', 'success');
    }).fail(function (xhr) {
      setPromoMessage(xhr.responseJSON?.message || 'Не удалось удалить промокод', 'error');
    });
  });

  $('.nav-toggle').on('click', function () {
    const $nav = $(this).closest('.main-nav');
    const opened = !$nav.hasClass('is-open');
    $nav.toggleClass('is-open', opened);
    $(this).attr('aria-expanded', opened ? 'true' : 'false');
  });

  $(document).on('click', '.main-nav-menu a, .main-nav-menu .link-btn', function () {
    const $nav = $(this).closest('.main-nav');
    $nav.removeClass('is-open');
    $nav.find('.nav-toggle').attr('aria-expanded', 'false');
  });

  $(window).on('resize', function () {
    if (window.innerWidth > 980) {
      $('.main-nav').removeClass('is-open');
      $('.nav-toggle').attr('aria-expanded', 'false');
    }
  });

  $(document).on('click', '.wishlist-remove', function () {
    const $card = $(this).closest('.wishlist-card');
    const productId = Number($card.data('product-id'));
    const $cancel = $card.find('.wishlist-cancel');
    const $remove = $(this);
    const $cancelFill = $cancel.find('.btn-progress-fill');

    $.ajax({
      url: '/api/wishlist/remove-jobs',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ product_id: productId })
    }).done(function (response) {
      if (!response.ok) return;

      const jobId = response.data.job_id;
      const seconds = response.data.seconds;
      $card.attr('data-job-id', jobId);

      $remove.hide();
      $cancel.show();
      $cancelFill.stop(true);
      $cancelFill.css({ width: '0%' });

      $cancelFill.animate({ width: '100%' }, seconds * 1000, 'linear', function () {
        $.ajax({
          url: `/api/wishlist/remove-jobs/${jobId}/execute`,
          method: 'POST'
        }).done(function (removeResponse) {
          if (removeResponse.ok && removeResponse.data.removed) {
            $card.fadeOut(250, function () { $(this).remove(); });
          }
        });
      });
    }).fail(function (xhr) {
      alert(xhr.responseJSON?.message || 'Ошибка удаления из избранного');
    });
  });

  $(document).on('click', '.wishlist-cancel', function () {
    const $card = $(this).closest('.wishlist-card');
    const jobId = Number($card.attr('data-job-id'));
    const $bar = $(this).find('.btn-progress-fill');
    const $cancel = $(this);
    const $remove = $card.find('.wishlist-remove');

    if (!jobId) return;

    $.ajax({
      url: `/api/wishlist/remove-jobs/${jobId}/cancel`,
      method: 'POST'
    }).done(function (response) {
      if (!response.ok) return;

      $bar.stop(true);
      $bar.css({ width: '0%' });
      $cancel.hide();
      $remove.show();
      $card.removeAttr('data-job-id');
    }).fail(function (xhr) {
      alert(xhr.responseJSON?.message || 'Ошибка отмены удаления');
    });
  });

  $(document).on('submit', 'form[action*="/admin/"][action*="/delete"], form[action*="/admin/"][action*="/hard-delete"]', function (e) {
    const action = $(this).attr('action') || '';
    const hardDelete = action.includes('/hard-delete');
    const message = hardDelete
      ? 'Удалить пользователя полностью? Это действие необратимо.'
      : 'Подтвердите удаление.';
    if (!window.confirm(message)) {
      e.preventDefault();
    }
  });

  function initAdminProductImagesLive() {
    const $form = $('form[data-product-images-live="1"]');
    if (!$form.length) return;

    const $primarySection = $('#admin-primary-image-section');
    const $gallerySection = $('#admin-gallery-image-section');
    const $primaryInput = $('#primary-image-input');
    const $galleryInput = $('#gallery-images-input');

    if (!$primarySection.length || !$gallerySection.length || !$primaryInput.length || !$galleryInput.length) return;

    const state = {
      existingPrimary: null,
      existingGallery: [],
      removedExistingIds: new Set(),
      pendingPrimaryFile: null,
      pendingGalleryFiles: [],
      objectUrls: []
    };

    const placeholderCardHtml = '<article class="admin-image-card"><img src="/public/img/placeholder.svg" alt="Изображение по умолчанию" class="admin-image-thumb" /><p class="hint-text">Установлена картинка по умолчанию. Ее удалить нельзя.</p></article>';
    const emptyGalleryCardHtml = '<article class="admin-image-card"><img src="/public/img/placeholder.svg" alt="Изображение по умолчанию" class="admin-image-thumb" /><p class="hint-text">Картинок в галерее пока нет.</p></article>';

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function collectInitialState() {
      const $existingPrimary = $primarySection.find('.admin-image-card[data-existing="1"]').first();
      if ($existingPrimary.length) {
        state.existingPrimary = {
          id: Number($existingPrimary.attr('data-image-id') || 0),
          image_path: String($existingPrimary.attr('data-image-path') || ''),
          alt_text: String($existingPrimary.attr('data-alt-text') || '')
        };
      }

      $gallerySection.find('.admin-image-card[data-existing="1"]').each(function () {
        state.existingGallery.push({
          id: Number($(this).attr('data-image-id') || 0),
          image_path: String($(this).attr('data-image-path') || ''),
          alt_text: String($(this).attr('data-alt-text') || '')
        });
      });
    }

    function revokeObjectUrls() {
      state.objectUrls.forEach(function (url) {
        URL.revokeObjectURL(url);
      });
      state.objectUrls = [];
    }

    function buildImageCardHtml(params) {
      const imageSrc = params.src;
      const altText = escapeHtml(params.alt || '');
      const buttonHtml = params.button
        ? `<button class="btn btn-secondary js-image-remove" type="button" data-source="${params.button.source}" data-kind="${params.button.kind}" data-image-id="${params.button.imageId || ''}" data-index="${params.button.index ?? ''}">Удалить изображение</button>`
        : '';

      return `<article class="admin-image-card"><img src="${imageSrc}" alt="${altText}" class="admin-image-thumb" onerror="this.onerror=null;this.src='/public/img/placeholder.svg';" />${buttonHtml}</article>`;
    }

    function syncPrimaryInput() {
      const transfer = new DataTransfer();
      if (state.pendingPrimaryFile) transfer.items.add(state.pendingPrimaryFile);
      $primaryInput.get(0).files = transfer.files;
    }

    function syncGalleryInput() {
      const transfer = new DataTransfer();
      state.pendingGalleryFiles.forEach(function (file) {
        transfer.items.add(file);
      });
      $galleryInput.get(0).files = transfer.files;
    }

    function renderImages() {
      revokeObjectUrls();

      let primaryHtml = placeholderCardHtml;
      if (state.pendingPrimaryFile) {
        const previewUrl = URL.createObjectURL(state.pendingPrimaryFile);
        state.objectUrls.push(previewUrl);
        primaryHtml = buildImageCardHtml({
          src: previewUrl,
          alt: state.pendingPrimaryFile.name || 'Основное изображение',
          button: { source: 'pending', kind: 'primary' }
        });
      } else if (state.existingPrimary && !state.removedExistingIds.has(state.existingPrimary.id) && state.existingPrimary.image_path) {
        primaryHtml = buildImageCardHtml({
          src: `/uploads/${encodeURI(state.existingPrimary.image_path)}`,
          alt: state.existingPrimary.alt_text,
          button: { source: 'existing', kind: 'primary', imageId: state.existingPrimary.id }
        });
      }

      const galleryHtmlParts = [];
      state.existingGallery.forEach(function (image) {
        if (state.removedExistingIds.has(image.id)) return;
        if (!String(image.image_path || '').trim()) return;
        galleryHtmlParts.push(buildImageCardHtml({
          src: `/uploads/${encodeURI(image.image_path)}`,
          alt: image.alt_text,
          button: { source: 'existing', kind: 'gallery', imageId: image.id }
        }));
      });

      state.pendingGalleryFiles.forEach(function (file, index) {
        const previewUrl = URL.createObjectURL(file);
        state.objectUrls.push(previewUrl);
        galleryHtmlParts.push(buildImageCardHtml({
          src: previewUrl,
          alt: file.name || 'Изображение галереи',
          button: { source: 'pending', kind: 'gallery', index }
        }));
      });

      const galleryHtml = galleryHtmlParts.length
        ? `<div class="admin-image-stack">${galleryHtmlParts.join('')}</div>`
        : emptyGalleryCardHtml;

      $primarySection.find('.admin-image-card, .admin-image-stack').remove();
      $gallerySection.find('.admin-image-card, .admin-image-stack').remove();
      $primarySection.append(primaryHtml);
      $gallerySection.append(galleryHtml);
    }

    function clearGeneratedRemoveInputs() {
      $form.find('input[type="hidden"][name="remove_image_ids"]').remove();
    }

    collectInitialState();
    renderImages();

    $primaryInput.on('change', function () {
      const file = this.files && this.files[0];
      if (!file) return;
      state.pendingPrimaryFile = file;
      syncPrimaryInput();
      renderImages();
    });

    $galleryInput.on('change', function () {
      const files = Array.from(this.files || []);
      if (!files.length) return;
      state.pendingGalleryFiles = state.pendingGalleryFiles.concat(files);
      syncGalleryInput();
      renderImages();
    });

    $form.on('click', '.js-image-remove', function (event) {
      event.preventDefault();
      const source = String($(this).attr('data-source') || '');
      const kind = String($(this).attr('data-kind') || '');

      if (source === 'existing') {
        const imageId = Number($(this).attr('data-image-id') || 0);
        if (imageId) state.removedExistingIds.add(imageId);
      }

      if (source === 'pending' && kind === 'primary') {
        state.pendingPrimaryFile = null;
        syncPrimaryInput();
      }

      if (source === 'pending' && kind === 'gallery') {
        const index = Number($(this).attr('data-index'));
        if (Number.isInteger(index) && index >= 0) {
          state.pendingGalleryFiles.splice(index, 1);
          syncGalleryInput();
        }
      }

      renderImages();
    });

    $form.on('submit', function () {
      clearGeneratedRemoveInputs();
      state.removedExistingIds.forEach(function (id) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'remove_image_ids';
        input.value = String(id);
        $form.get(0).appendChild(input);
      });
    });
  }

  function initAdminSlugSkuGenerator() {
    const $name = $('input[name="name"]');
    const $slug = $('#slug-input');
    const $sku = $('#sku-input');
    const $slugBtn = $('#generate-slug-btn');
    const $skuBtn = $('#generate-sku-btn');

    if (!$name.length || !$slug.length || !$sku.length) return;

    const translitMap = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
      к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
      х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
    };

    function slugifyLocal(value) {
      const source = String(value || '').trim().toLowerCase();
      if (!source) return '';
      const transliterated = source.split('').map(function (char) {
        return translitMap[char] !== undefined ? translitMap[char] : char;
      }).join('');
      return transliterated
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
    }

    function makeSkuLocal(name) {
      const base = slugifyLocal(name) || 'product';
      const tail = Date.now().toString().slice(-6);
      return `SKU-${base}-${tail}`.toUpperCase();
    }

    $slugBtn.on('click', function () {
      $slug.val(slugifyLocal($name.val()));
    });

    $skuBtn.on('click', function () {
      $sku.val(makeSkuLocal($name.val()));
    });
  }

  function initProfileAvatarLive() {
    const $form = $('form[data-profile-avatar-live="1"]');
    if (!$form.length) return;

    const $preview = $('#profile-avatar-preview');
    const $fileInput = $('#profile-avatar-input');
    const $removeInput = $('#remove-avatar-input');
    const $removeBtn = $('#profile-avatar-remove-btn');

    if (!$preview.length || !$fileInput.length || !$removeInput.length || !$removeBtn.length) return;

    const initialSrc = String($preview.attr('src') || '/public/img/placeholder.svg');
    const hadAvatarInitially = String($preview.attr('data-has-avatar') || '0') === '1';
    let objectUrl = '';

    function revokeObjectUrl() {
      if (!objectUrl) return;
      URL.revokeObjectURL(objectUrl);
      objectUrl = '';
    }

    function setPlaceholder() {
      revokeObjectUrl();
      $preview.attr('src', '/public/img/placeholder.svg');
    }

    function setInitial() {
      revokeObjectUrl();
      $preview.attr('src', initialSrc);
    }

    function clearFileInput() {
      const transfer = new DataTransfer();
      $fileInput.get(0).files = transfer.files;
      $fileInput.val('');
    }

    $fileInput.on('change', function () {
      const file = this.files && this.files[0];
      if (!file) return;

      revokeObjectUrl();
      objectUrl = URL.createObjectURL(file);
      $preview.attr('src', objectUrl);
      $removeInput.val('0');
    });

    $removeBtn.on('click', function () {
      clearFileInput();
      if (hadAvatarInitially) {
        setPlaceholder();
        $removeInput.val('1');
      } else {
        setPlaceholder();
        $removeInput.val('0');
      }
    });

    $form.on('submit', function () {
      if ($fileInput.get(0).files && $fileInput.get(0).files.length) {
        $removeInput.val('0');
      }
    });

    $form.on('reset', function () {
      clearFileInput();
      if (hadAvatarInitially) {
        setInitial();
      } else {
        setPlaceholder();
      }
      $removeInput.val('0');
    });
  }

  function initProductSlider() {
    $('.product-slider').each(function () {
      const $slider = $(this);
      const $track = $slider.find('.product-slider-track');
      const $slides = $slider.find('.product-slide');
      const $prev = $slider.find('.product-slider-arrow-prev');
      const $next = $slider.find('.product-slider-arrow-next');
      const $dots = $slider.find('.product-slider-dots');

      if (!$slides.length) return;

      let currentIndex = 0;
      let touchStartX = 0;
      let touchDeltaX = 0;
      let isDragging = false;

      function setSlide(index) {
        const slidesCount = $slides.length;
        if (!slidesCount) return;

        currentIndex = (index + slidesCount) % slidesCount;
        $track.css('transform', `translateX(-${currentIndex * 100}%)`);

        $dots.find('.product-slider-dot').each(function (dotIndex) {
          const isActive = dotIndex === currentIndex;
          $(this).toggleClass('is-active', isActive);
          $(this).attr('aria-current', isActive ? 'true' : 'false');
        });
      }

      function renderDots() {
        $dots.empty();
        $slides.each(function (index) {
          const $dot = $('<button/>', {
            type: 'button',
            class: `product-slider-dot${index === 0 ? ' is-active' : ''}`,
            'aria-label': `Показать изображение ${index + 1}`,
            'aria-current': index === 0 ? 'true' : 'false'
          });
          $dot.on('click', function () {
            setSlide(index);
          });
          $dots.append($dot);
        });
      }

      function bindTouch() {
        $track.on('touchstart', function (event) {
          const touch = event.originalEvent.touches && event.originalEvent.touches[0];
          if (!touch) return;
          touchStartX = touch.clientX;
          touchDeltaX = 0;
          isDragging = true;
        });

        $track.on('touchmove', function (event) {
          if (!isDragging) return;
          const touch = event.originalEvent.touches && event.originalEvent.touches[0];
          if (!touch) return;
          touchDeltaX = touch.clientX - touchStartX;
        });

        $track.on('touchend', function () {
          if (!isDragging) return;
          isDragging = false;

          if (Math.abs(touchDeltaX) < 40) return;
          if (touchDeltaX < 0) setSlide(currentIndex + 1);
          if (touchDeltaX > 0) setSlide(currentIndex - 1);
        });
      }

      if ($slides.length <= 1) {
        $slider.addClass('is-single');
        $prev.hide();
        $next.hide();
        $dots.hide();
        return;
      }

      renderDots();
      setSlide(0);
      bindTouch();

      $prev.on('click', function () {
        setSlide(currentIndex - 1);
      });

      $next.on('click', function () {
        setSlide(currentIndex + 1);
      });

      $slider.on('keydown', function (event) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          setSlide(currentIndex - 1);
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          setSlide(currentIndex + 1);
        }
      });
    });
  }

  initAdminProductImagesLive();
  initAdminSlugSkuGenerator();
  initProfileAvatarLive();
  initProductSlider();
  initCatalogPerPageSlider();
});
