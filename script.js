
const reducedMotionMql = window.matchMedia('(prefers-reduced-motion: reduce)');
function isMotionReduced() {
  const forced = document.documentElement.getAttribute('data-motion');
  if (forced === 'on') return false;
  if (forced === 'reduced') return true;
  return reducedMotionMql.matches;
}

(function splitHeroName() {
  const heroName = document.querySelector('.hero-name');
  if (!heroName) return;
  const text = heroName.textContent;
  heroName.textContent = '';

  const wrap = document.createElement('span');
  wrap.setAttribute('aria-hidden', 'true');
  [...text].forEach((char, i) => {
    const span = document.createElement('span');
    span.className = 'letter';
    span.textContent = char;
    span.style.animationDelay = `${i * 45}ms`;
    wrap.appendChild(span);
  });
  heroName.appendChild(wrap);
})();

const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && revealEls.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

const spySections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.side-nav a[href^="#"]');
const sideNav = document.getElementById('side-nav');

if (sideNav) {
  let scrollingTimeout = null;
  const flagScrolling = () => {
    sideNav.classList.add('is-scrolling');
    clearTimeout(scrollingTimeout);
    scrollingTimeout = setTimeout(() => sideNav.classList.remove('is-scrolling'), 900);
  };
  window.addEventListener('scroll', flagScrolling, { passive: true });
}

if (spySections.length && navLinks.length) {
  const navByHash = new Map();
  navLinks.forEach((link) => navByHash.set(link.getAttribute('href').slice(1), link));
  const lastLink = navLinks[navLinks.length - 1];

  const setActiveLink = (link) => {
    if (!link) return;
    navLinks.forEach((l) => l.classList.toggle('is-active', l === link));
  };

  const updateActiveSection = () => {
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) {
      setActiveLink(lastLink);
      return;
    }
    const spyLine = window.innerHeight * 0.45;
    let current = null;
    spySections.forEach((section) => {
      if (section.getBoundingClientRect().top <= spyLine) current = section;
    });
    setActiveLink(current ? navByHash.get(current.id) : null);
  };

  window.addEventListener('scroll', updateActiveSection, { passive: true });
  window.addEventListener('resize', updateActiveSection);
  updateActiveSection();
}

const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

(function initSettings() {
  const btn = document.getElementById('settingsBtn');
  const overlay = document.getElementById('settingsOverlay');
  const closeBtn = document.getElementById('settingsClose');
  if (!btn || !overlay || !closeBtn) return;

  const ACCENTS = window.PORTFOLIO_ACCENTS || {};
  const root = document.documentElement;
  const themeButtons = overlay.querySelectorAll('[data-theme-choice]');
  const accentButtons = overlay.querySelectorAll('[data-accent-choice]');
  const motionButtons = overlay.querySelectorAll('[data-motion-choice]');
  const darkMql = window.matchMedia('(prefers-color-scheme: dark)');

  function isDarkNow() {
    const forced = root.getAttribute('data-theme');
    if (forced === 'dark') return true;
    if (forced === 'light') return false;
    return darkMql.matches;
  }

  function applyAccent(id) {
    const accent = ACCENTS[id];
    if (accent && id !== 'blue') {
      const vals = accent[isDarkNow() ? 'dark' : 'light'];
      root.style.setProperty('--accent', vals[0]);
      root.style.setProperty('--accent-soft', vals[1]);
      root.style.setProperty('--accent-glow', vals[2]);
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-soft');
      root.style.removeProperty('--accent-glow');
    }
    localStorage.setItem('portfolio.accent', id);
    accentButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.accentChoice === id));
  }

  function applyTheme(mode) {
    if (mode === 'light' || mode === 'dark') {
      root.setAttribute('data-theme', mode);
      localStorage.setItem('portfolio.theme', mode);
    } else {
      root.removeAttribute('data-theme');
      localStorage.removeItem('portfolio.theme');
    }
    themeButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.themeChoice === mode));
    applyAccent(localStorage.getItem('portfolio.accent') || 'blue');
  }

  function currentThemeMode() {
    const forced = root.getAttribute('data-theme');
    return forced === 'light' || forced === 'dark' ? forced : 'system';
  }

  function applyMotion(mode) {
    if (mode === 'on' || mode === 'reduced') {
      root.setAttribute('data-motion', mode);
      localStorage.setItem('portfolio.motion', mode);
    } else {
      root.removeAttribute('data-motion');
      localStorage.removeItem('portfolio.motion');
    }
    motionButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.motionChoice === mode));
    document.dispatchEvent(new CustomEvent('portfolio:motionchange'));
  }

  function currentMotionMode() {
    const forced = root.getAttribute('data-motion');
    return forced === 'on' || forced === 'reduced' ? forced : 'system';
  }

  function syncUI() {
    themeButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.themeChoice === currentThemeMode()));
    const accentId = localStorage.getItem('portfolio.accent') || 'blue';
    accentButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.accentChoice === accentId));
    motionButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.motionChoice === currentMotionMode()));
  }

  function openSettings() {
    overlay.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    syncUI();
    closeBtn.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function closeSettings() {
    overlay.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown);
    btn.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') closeSettings();
  }

  btn.addEventListener('click', openSettings);
  closeBtn.addEventListener('click', closeSettings);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSettings();
  });
  themeButtons.forEach((b) => b.addEventListener('click', () => applyTheme(b.dataset.themeChoice)));
  accentButtons.forEach((b) => b.addEventListener('click', () => applyAccent(b.dataset.accentChoice)));
  motionButtons.forEach((b) => b.addEventListener('click', () => applyMotion(b.dataset.motionChoice)));

  darkMql.addEventListener('change', () => {
    if (currentThemeMode() === 'system') {
      applyAccent(localStorage.getItem('portfolio.accent') || 'blue');
    }
  });
})();

(function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero) return;

  const ctx = canvas.getContext('2d');
  let reduceMotion = isMotionReduced();

  const keywords = [
    'Python', 'COBOL', 'IBM DB2', 'AIX UNIX', 'CQRS', 'AWS Lambda',
    'Kong API', 'Claude', 'JavaScript', 'Microservices', 'JCL', 'VSAM',
    'Jenkins', 'Ansible', 'Agentic AI', 'KSH Shell', 'SQL PL',
    'GitHub Copilot', 'Read Replica', 'Fault Isolation', 'IBM z/OS',
    'HashiCorp Vault', 'Prompt Engineering', 'DB2 Stored Procedures',
  ];

  const colors = { accent: '#1d4ed8', faint: '#889099' };
  function refreshColors() {
    const styles = getComputedStyle(document.documentElement);
    colors.accent = styles.getPropertyValue('--accent').trim();
    colors.faint = styles.getPropertyValue('--text-faint').trim();
  }
  refreshColors();

  function hexToRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const int = parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let particles = [];

  function resize() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnParticle() {
    return {
      text: keywords[Math.floor(Math.random() * keywords.length)],
      x: Math.random() * width,
      y: Math.random() * height,
      baseSize: 15 + Math.random() * 20,
      speed: (Math.random() * 0.3 + 0.08) * (Math.random() < 0.5 ? -1 : 1),
      blinkSpeed: 0.35 + Math.random() * 0.7,
      blinkPhase: Math.random() * Math.PI * 2,
      zoomSpeed: 0.15 + Math.random() * 0.3,
      zoomPhase: Math.random() * Math.PI * 2,
      colorKey: Math.random() < 0.5 ? 'accent' : 'faint',
    };
  }

  function createParticles() {
    const count = width < 640 ? 9 : 17;
    particles = Array.from({ length: count }, spawnParticle);
  }

  function draw(t) {
    ctx.clearRect(0, 0, width, height);
    ctx.textBaseline = 'middle';

    particles.forEach((p) => {
      p.x += p.speed;
      if (p.x > width + 140) p.x = -140;
      if (p.x < -140) p.x = width + 140;

      const alpha = 0.08 + (Math.sin(t * p.blinkSpeed + p.blinkPhase) * 0.5 + 0.5) * 0.24;
      const scale = 0.85 + (Math.sin(t * p.zoomSpeed + p.zoomPhase) * 0.5 + 0.5) * 0.4;
      const size = p.baseSize * scale;

      ctx.font = `600 ${size}px "JetBrains Mono", monospace`;
      ctx.fillStyle = hexToRgba(colors[p.colorKey], alpha);
      ctx.fillText(p.text, p.x, p.y);
    });
  }

  let rafId = null;
  const start = performance.now();

  function loop(now) {
    draw((now - start) / 1000);
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function startLoop() {
    if (!rafId && !document.hidden) rafId = requestAnimationFrame(loop);
  }

  resize();
  createParticles();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!reduceMotion) startLoop();
  });

  function syncMotion() {
    const nowReduced = isMotionReduced();
    if (nowReduced === reduceMotion) return;
    reduceMotion = nowReduced;
    if (reduceMotion) {
      stop();
      draw(0);
    } else {
      startLoop();
    }
  }

  if (reduceMotion) draw(0);
  else startLoop();

  document.addEventListener('portfolio:motionchange', syncMotion);
  reducedMotionMql.addEventListener('change', syncMotion);

  window.addEventListener('resize', () => {
    resize();
    createParticles();
    if (reduceMotion) draw(0);
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refreshColors);
})();

(function initSmoothAnchors() {
  const anchors = document.querySelectorAll('a[href^="#"]');
  if (!anchors.length) return;

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function animateScrollTo(targetY, duration) {
    const startY = window.scrollY;
    const diff = targetY - startY;
    if (Math.abs(diff) < 1) return;
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      window.scrollTo(0, startY + diff * easeInOutQuad(t));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  anchors.forEach((link) => {
    link.addEventListener('click', (e) => {
      const hash = link.getAttribute('href');
      if (!hash || hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      const targetY = target.getBoundingClientRect().top + window.scrollY;
      if (isMotionReduced()) window.scrollTo(0, targetY);
      else animateScrollTo(targetY, 600);
      if (history.pushState) history.pushState(null, '', hash);
    });
  });
})();

(function initRibbonCycles() {
  document.querySelectorAll('.app-tile-ribbon-cycle[data-ribbon-states]').forEach((ribbon) => {
    const states = ribbon.getAttribute('data-ribbon-states').split(',').map((s) => s.trim());
    if (states.length < 2) return;
    let index = 0;
    setInterval(() => {
      index = (index + 1) % states.length;
      const next = states[index];
      ribbon.textContent = next;
      ribbon.classList.remove('is-new', 'is-beta');
      ribbon.classList.add('is-' + next.toLowerCase());
      ribbon.classList.remove('pulse');
      void ribbon.offsetWidth;
      ribbon.classList.add('pulse');
    }, 2500);
  });
})();
