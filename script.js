const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
const header = document.querySelector('[data-header]');

const setMenu = (open) => {
  if (!menuToggle || !mobileMenu) return;
  menuToggle.setAttribute('aria-expanded', String(open));
  mobileMenu.hidden = !open;
  document.body.classList.toggle('menu-open', open);
  menuToggle.querySelector('.menu-label').textContent = open ? '닫기' : '메뉴';
};

function toggleMobileMenu() {
  setMenu(menuToggle?.getAttribute('aria-expanded') !== 'true');
}

mobileMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuToggle.focus();
  }
});

window.addEventListener('scroll', () => {
  header?.classList.toggle('is-sticky', window.scrollY > 128);
}, { passive: true });

const observeReveals = (root = document) => {
  const revealItems = root.querySelectorAll('.reveal:not(.is-visible)');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
};

observeReveals();

const formatPrice = (price) => `${new Intl.NumberFormat('ko-KR').format(price)}원`;

const isSecureUrl = (value) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

const isProduct = (product) => (
  product
  && typeof product.name === 'string'
  && Number.isFinite(product.price)
  && isSecureUrl(product.image)
  && isSecureUrl(product.url)
);

const createProductCard = (product) => {
  const card = document.createElement('article');
  card.className = 'product-card reveal';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'product-image';

  const image = document.createElement('img');
  image.src = product.image;
  image.alt = product.name;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.width = 800;
  image.height = 840;
  imageWrap.append(image);

  const info = document.createElement('div');
  info.className = 'product-info';

  const name = document.createElement('h3');
  name.textContent = product.name;

  const price = document.createElement('strong');
  price.className = 'product-price';
  price.textContent = formatPrice(product.price);

  const link = document.createElement('a');
  link.className = 'buy-button';
  link.href = product.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `${product.name} 구매하기 (새 탭)`);

  const linkText = document.createElement('span');
  linkText.textContent = '구매하기';
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';
  link.append(linkText, arrow);

  info.append(name, price, link);
  card.append(imageWrap, info);
  return card;
};

const renderProducts = async (container) => {
  const source = container.dataset.productSource || 'products.json';
  const limit = Number.parseInt(container.dataset.limit || '', 10);

  try {
    const response = await fetch(source, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const products = Array.isArray(data) ? data.filter(isProduct) : [];
    if (!products.length) throw new Error('No valid products');

    const visibleProducts = Number.isFinite(limit) ? products.slice(0, limit) : products;
    const fragment = document.createDocumentFragment();
    visibleProducts.forEach((product) => fragment.append(createProductCard(product)));

    container.replaceChildren(fragment);
    container.setAttribute('aria-busy', 'false');
    document.querySelectorAll('[data-product-count]').forEach((item) => {
      item.textContent = products.length;
    });
    observeReveals(container);
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'product-error';
    message.textContent = '제품을 불러오지 못했습니다. 잠시 후 페이지를 새로고침해주세요.';
    container.replaceChildren(message);
    container.setAttribute('aria-busy', 'false');
    console.error('Product data load failed:', error);
  }
};

document.querySelectorAll('[data-products]').forEach(renderProducts);

const form = document.querySelector('[data-contact-form]');
if (form) {
  const status = document.querySelector('[data-form-status]');
  const fields = [
    { input: form.elements.name, message: '이름을 입력해주세요.' },
    { input: form.elements.email, message: '답변받을 이메일을 입력해주세요.' },
    { input: form.elements.message, message: '문의 내용을 입력해주세요.' }
  ];

  const showError = (input, message = '') => {
    const error = document.getElementById(`${input.id}-error`);
    input.setAttribute('aria-invalid', String(Boolean(message)));
    error.textContent = message;
  };

  fields.forEach(({ input }) => {
    input.addEventListener('input', () => showError(input));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    status.textContent = '';
    let firstInvalid = null;

    fields.forEach(({ input, message }) => {
      let error = input.value.trim() ? '' : message;
      if (input.type === 'email' && input.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        error = '이메일 형식을 확인해주세요.';
      }
      showError(input, error);
      if (error && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    status.textContent = '문의가 임시 접수되었습니다. 실제 전송 기능은 추후 연결해주세요.';
    form.reset();
  });
}

document.querySelectorAll('[data-year]').forEach((item) => {
  item.textContent = new Date().getFullYear();
});
