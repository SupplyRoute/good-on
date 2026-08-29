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

const colorLoop = document.querySelector('[data-color-loop]');

const initColorLoop = async () => {
  if (!colorLoop) return;

  const stage = colorLoop.querySelector('[data-loop-stage]');
  const itemsRoot = colorLoop.querySelector('[data-loop-items]');
  const navRoot = colorLoop.querySelector('[data-loop-nav]');
  const filmCard = colorLoop.querySelector('[data-loop-film]');
  const activeIndex = colorLoop.querySelector('[data-active-index]');
  const activeColor = colorLoop.querySelector('[data-active-color]');
  const colorCount = colorLoop.querySelector('[data-color-count]');
  const status = colorLoop.querySelector('[data-loop-status]');
  let colors = [];
  let position = 0;
  let dragStartX = 0;
  let dragStartPosition = 0;
  let dragging = false;
  let moved = false;
  let hoverTimer = 0;
  let dismissTimer = 0;

  const normalize = (value) => ((value % colors.length) + colors.length) % colors.length;
  const closestDistance = (index) => {
    const raw = index - position;
    return ((raw + colors.length / 2) % colors.length + colors.length) % colors.length - colors.length / 2;
  };

  const stopFilms = () => {
    window.clearTimeout(hoverTimer);
    window.clearTimeout(dismissTimer);
    hoverTimer = 0;
    dismissTimer = 0;
    itemsRoot.querySelectorAll('.color-loop-shirt.is-playing').forEach((shirt) => {
      shirt.classList.remove('is-playing');
    });
    filmCard.classList.remove('is-visible');
    filmCard.setAttribute('aria-hidden', 'true');
    filmCard.replaceChildren();
  };

  const startFilm = (shirt, color) => {
    if (!shirt.classList.contains('is-active') || dragging || shirt.classList.contains('is-playing')) return;
    stopFilms();
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.instagram.com/reel/${encodeURIComponent(color.shortcode)}/embed/?autoplay=1&muted=1`;
    iframe.title = `${color.name} 컬러 인스타그램 영상`;
    iframe.loading = 'eager';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.setAttribute('allowfullscreen', '');
    iframe.tabIndex = 0;
    iframe.addEventListener('load', () => {
      window.setTimeout(() => {
        if (!iframe.isConnected) return;
        filmCard.setAttribute('aria-hidden', 'false');
        filmCard.classList.add('is-visible');
        status.textContent = `${color.name} 컬러 필름을 열었습니다. 영상을 클릭하면 재생됩니다.`;
      }, 350);
    }, { once: true });
    filmCard.append(iframe);
    shirt.classList.add('is-playing');
  };

  const scheduleFilm = (shirt, color) => {
    window.clearTimeout(hoverTimer);
    if (!shirt.classList.contains('is-active') || dragging) return;
    hoverTimer = window.setTimeout(() => startFilm(shirt, color), 1000);
  };

  const render = () => {
    const compact = window.matchMedia('(max-width: 580px)').matches;
    const tablet = window.matchMedia('(max-width: 900px)').matches;
    const radiusX = compact ? Math.min(window.innerWidth * .62, 250) : tablet ? Math.min(window.innerWidth * .5, 390) : Math.min(window.innerWidth * .37, 560);
    const radiusY = compact ? 58 : tablet ? 72 : 94;
    let selectedIndex = 0;
    let selectedDistance = Number.POSITIVE_INFINITY;

    itemsRoot.querySelectorAll('.color-loop-shirt').forEach((shirt, index) => {
      const relative = closestDistance(index);
      const angle = relative * (Math.PI * 2 / colors.length);
      const depth = (Math.cos(angle) + 1) / 2;
      const x = Math.sin(angle) * radiusX;
      const y = Math.cos(angle) * radiusY + (compact ? 18 : 26);
      const scale = (compact ? .53 : .48) + depth * (compact ? .47 : .56);
      const tilt = Math.sin(angle) * -9;
      const distance = Math.abs(relative);

      if (distance < selectedDistance) {
        selectedDistance = distance;
        selectedIndex = index;
      }

      shirt.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${tilt}deg)`;
      shirt.style.opacity = '1';
      shirt.style.zIndex = String(Math.round(depth * 100));
      shirt.setAttribute('aria-hidden', String(Math.abs(relative) > (compact ? 3.4 : 5.5)));
    });

    itemsRoot.querySelectorAll('.color-loop-shirt').forEach((shirt, index) => {
      const isActive = index === selectedIndex;
      shirt.classList.toggle('is-active', isActive);
      shirt.querySelector('.tee-cutout').tabIndex = isActive ? 0 : -1;
    });

    navRoot.querySelectorAll('button').forEach((button, index) => {
      button.setAttribute('aria-current', String(index === selectedIndex));
    });

    const selected = colors[selectedIndex];
    activeIndex.textContent = String(selectedIndex + 1).padStart(2, '0');
    activeColor.textContent = selected.name;
  };

  const goTo = (index, announce = true) => {
    stopFilms();
    const target = normalize(index);
    const current = normalize(Math.round(position));
    let delta = target - current;
    if (delta > colors.length / 2) delta -= colors.length;
    if (delta < -colors.length / 2) delta += colors.length;
    position = Math.round(position) + delta;
    render();
    if (announce) status.textContent = `${colors[target].name} 컬러를 선택했습니다.`;
  };

  try {
    const response = await fetch('color-stories.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    colors = Array.isArray(data) ? data.filter((color) => (
      typeof color.name === 'string'
      && typeof color.label === 'string'
      && /^#[0-9a-f]{6}$/i.test(color.color)
      && typeof color.shortcode === 'string'
      && isSecureUrl(color.instagram)
    )) : [];
    if (!colors.length) throw new Error('No valid colors');

    const items = document.createDocumentFragment();
    const nav = document.createDocumentFragment();

    colors.forEach((color, index) => {
      const shirt = document.createElement('div');
      shirt.className = 'color-loop-shirt';
      shirt.style.setProperty('--tee-color', color.color);
      shirt.dataset.colorIndex = String(index);

      const select = document.createElement('button');
      select.className = 'tee-cutout';
      select.type = 'button';
      select.setAttribute('aria-label', `${color.name} 티셔츠 선택`);
      const detail = document.createElement('img');
      detail.className = 'tee-detail';
      detail.src = 'assets/tee-cutout.png';
      detail.alt = '';
      detail.width = 1280;
      detail.height = 1280;
      detail.draggable = false;
      select.append(detail);
      select.addEventListener('click', () => {
        if (moved) return;
        if (shirt.classList.contains('is-active') && window.matchMedia('(hover: none)').matches) {
          if (shirt.classList.contains('is-playing')) stopFilms();
          else startFilm(shirt, color);
        } else {
          goTo(index);
        }
      });

      shirt.append(select);
      shirt.addEventListener('pointerenter', () => scheduleFilm(shirt, color));
      shirt.addEventListener('pointerleave', () => {
        window.clearTimeout(hoverTimer);
        if (shirt.classList.contains('is-playing')) {
          dismissTimer = window.setTimeout(stopFilms, 220);
        }
      });
      items.append(shirt);

      const navButton = document.createElement('button');
      navButton.type = 'button';
      navButton.textContent = color.label;
      navButton.style.setProperty('--swatch', color.color);
      navButton.setAttribute('aria-label', `${color.name} 컬러 선택`);
      navButton.addEventListener('click', () => goTo(index));
      nav.append(navButton);
    });

    itemsRoot.replaceChildren(items);
    navRoot.replaceChildren(nav);
    itemsRoot.setAttribute('aria-busy', 'false');
    colorCount.textContent = String(colors.length).padStart(2, '0');
    render();

    stage.addEventListener('pointerdown', (event) => {
      if (event.target.closest('iframe')) return;
      stopFilms();
      dragging = true;
      moved = false;
      dragStartX = event.clientX;
      dragStartPosition = position;
      stage.classList.add('is-dragging');
      stage.setPointerCapture(event.pointerId);
    });

    stage.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const distance = event.clientX - dragStartX;
      moved = Math.abs(distance) > 5;
      position = dragStartPosition - distance / (window.innerWidth < 580 ? 78 : 118);
      render();
    });

    const finishDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      position = Math.round(position);
      render();
      const selected = normalize(position);
      status.textContent = `${colors[selected].name} 컬러를 선택했습니다.`;
      window.setTimeout(() => { moved = false; }, 0);
    };

    stage.addEventListener('pointerup', finishDrag);
    stage.addEventListener('pointercancel', finishDrag);
    stage.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        stopFilms();
        return;
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      goTo(Math.round(position) + (event.key === 'ArrowRight' ? 1 : -1));
    });
    filmCard.addEventListener('pointerenter', () => window.clearTimeout(dismissTimer));
    filmCard.addEventListener('pointerleave', () => {
      dismissTimer = window.setTimeout(stopFilms, 220);
    });
    window.addEventListener('resize', render, { passive: true });
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'color-loop-loading';
    message.textContent = '컬러 컬렉션을 불러오지 못했습니다.';
    itemsRoot.replaceChildren(message);
    itemsRoot.setAttribute('aria-busy', 'false');
    console.error('Color story load failed:', error);
  }
};

initColorLoop();

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
