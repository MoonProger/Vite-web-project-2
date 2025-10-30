document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.container') || document.body;
  let navHost = document.querySelector('.site-nav');
  if (!navHost) {
    navHost = document.createElement('div');
    navHost.className = 'site-nav';
    container.prepend(navHost);
  }

  const nav = document.createElement('nav');
  nav.className = 'nav-center';

  const base = import.meta.env.BASE_URL || '/';

  const links = [
    { href: base + 'index.html', label: 'News' },
    { href: base + 'cats.html', label: 'Cats' },
    { href: base + 'meals.html', label: 'Recipes' },
  ];

  links.forEach((l, idx) => {
    const a = document.createElement('a');
    a.href = l.href;
    a.textContent = l.label;
    const current = location.pathname.endsWith('/') ? location.pathname + 'index.html' : location.pathname;
    const targetPath = new URL(l.href, location.origin).pathname;
    if (current === targetPath || current.endsWith(targetPath)) {
      a.classList.add('active');
    }
    nav.appendChild(a);
    if (idx < links.length - 1) nav.appendChild(document.createTextNode(' | '));
  });

  navHost.innerHTML = '';
  navHost.appendChild(nav);
});


