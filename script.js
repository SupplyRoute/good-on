const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
const header = document.querySelector('[data-header]');

const setMenu = (open) => {
  menuToggle.setAttribute('aria-expanded', String(open));
  mobileMenu.hidden = !open;
  document.body.classList.toggle('menu-open', open);
  menuToggle.querySelector('.menu-label').textContent = open ? '닫기' : '메뉴';
};

function toggleMobileMenu() {
  setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
}

mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuToggle.focus();
  }
});

window.addEventListener('scroll', () => {
  header.classList.toggle('is-sticky', window.scrollY > 128);
}, { passive: true });

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const form = document.querySelector('[data-contact-form]');
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

document.querySelector('[data-year]').textContent = new Date().getFullYear();
