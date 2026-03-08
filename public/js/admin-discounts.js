(function () {
  if (!window.discountFormData) return;

  const data = window.discountFormData;
  const selectedProductIds = new Set((data.selectedProductIds || []).map((v) => Number(v)));
  const selectedCategoryIds = new Set((data.selectedCategoryIds || []).map((v) => Number(v)));

  const scopeSelect = document.getElementById('scope-select');
  const productBlock = document.getElementById('target-products-block');
  const categoryBlock = document.getElementById('target-categories-block');
  const promoCodeBlock = document.getElementById('promo-code-block');
  const isPromoCheckbox = document.getElementById('is-promo-checkbox');

  const productSource = document.getElementById('product-source-select');
  const categorySource = document.getElementById('category-source-select');
  const addProductBtn = document.getElementById('add-product-target');
  const addCategoryBtn = document.getElementById('add-category-target');

  const productList = document.getElementById('product-target-list');
  const categoryList = document.getElementById('category-target-list');
  const productInputs = document.getElementById('product-target-inputs');
  const categoryInputs = document.getElementById('category-target-inputs');
  const form = document.getElementById('discount-form');

  function renderHiddenInputs(container, fieldName, idSet) {
    container.innerHTML = '';
    Array.from(idSet).forEach((id) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = fieldName;
      input.value = String(id);
      container.appendChild(input);
    });
  }

  function renderTargetList(listElement, items, idSet, removeHandler) {
    listElement.innerHTML = '';

    Array.from(idSet).forEach((id) => {
      const item = items.find((x) => Number(x.id) === Number(id));
      if (!item) return;

      const li = document.createElement('li');
      li.className = 'target-item';
      li.innerHTML = `<span>${item.name}</span><button type="button" class="btn target-remove">Удалить</button>`;
      li.querySelector('button').addEventListener('click', function () {
        removeHandler(id);
      });
      listElement.appendChild(li);
    });
  }

  function renderProducts() {
    renderTargetList(productList, data.products || [], selectedProductIds, function (id) {
      selectedProductIds.delete(Number(id));
      renderProducts();
    });
    renderHiddenInputs(productInputs, 'product_ids', selectedProductIds);
  }

  function renderCategories() {
    renderTargetList(categoryList, data.categories || [], selectedCategoryIds, function (id) {
      selectedCategoryIds.delete(Number(id));
      renderCategories();
    });
    renderHiddenInputs(categoryInputs, 'category_ids', selectedCategoryIds);
  }

  function updateScopeBlocks() {
    const scope = scopeSelect.value;
    productBlock.style.display = (scope === 'product' || scope === 'list') ? 'block' : 'none';
    categoryBlock.style.display = scope === 'category' ? 'block' : 'none';
    if (promoCodeBlock) {
      promoCodeBlock.style.display = isPromoCheckbox && isPromoCheckbox.checked ? 'block' : 'none';
    }
  }

  addProductBtn?.addEventListener('click', function () {
    const id = Number(productSource.value);
    if (!id) return;

    if (scopeSelect.value === 'product') {
      selectedProductIds.clear();
    }

    selectedProductIds.add(id);
    renderProducts();
  });

  addCategoryBtn?.addEventListener('click', function () {
    const id = Number(categorySource.value);
    if (!id) return;

    selectedCategoryIds.add(id);
    renderCategories();
  });

  scopeSelect?.addEventListener('change', updateScopeBlocks);
  isPromoCheckbox?.addEventListener('change', updateScopeBlocks);

  form?.addEventListener('submit', function (event) {
    const scope = scopeSelect ? scopeSelect.value : '';

    if (scope === 'product' && selectedProductIds.size === 0) {
      const fallbackProductId = Number(productSource && productSource.value);
      if (fallbackProductId) {
        selectedProductIds.add(fallbackProductId);
        renderProducts();
      }
    }

    if (scope === 'category' && selectedCategoryIds.size === 0) {
      const fallbackCategoryId = Number(categorySource && categorySource.value);
      if (fallbackCategoryId) {
        selectedCategoryIds.add(fallbackCategoryId);
        renderCategories();
      }
    }

    if (scope === 'product' && selectedProductIds.size !== 1) {
      event.preventDefault();
      alert('Для скидки "Один товар" выберите ровно один товар.');
      return;
    }

    if (scope === 'list' && selectedProductIds.size < 1) {
      event.preventDefault();
      alert('Для скидки "Список товаров" выберите хотя бы один товар.');
      return;
    }

    if (scope === 'category' && selectedCategoryIds.size < 1) {
      event.preventDefault();
      alert('Для скидки "Категория" выберите хотя бы одну категорию.');
      return;
    }

    const startInput = form.querySelector('input[name="start_at"]');
    const endInput = form.querySelector('input[name="end_at"]');
    if (startInput && endInput && startInput.value && endInput.value) {
      if (new Date(startInput.value).getTime() > new Date(endInput.value).getTime()) {
        event.preventDefault();
        alert('Дата начала не может быть позже даты окончания.');
      }
    }
  });

  renderProducts();
  renderCategories();
  updateScopeBlocks();
})();
