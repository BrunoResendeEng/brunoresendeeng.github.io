/**
 * BRUNO RESENDE — PORTFÓLIO
 * script.js — Interatividade, Canvas de partículas, Animações, Navegação
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   UTILITÁRIOS
   ═══════════════════════════════════════════════════════════ */

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** Detecta se o usuário prefere movimento reduzido */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Throttle simples */
function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}

/* ═══════════════════════════════════════════════════════════
   1. BARRA DE PROGRESSO DE SCROLL
   ═══════════════════════════════════════════════════════════ */
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-hidden', 'true');
  document.body.prepend(bar);

  const update = throttle(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const pct = (scrollTop / (scrollHeight - clientHeight)) * 100;
    bar.style.width = `${Math.min(pct, 100)}%`;
  }, 16);

  window.addEventListener('scroll', update, { passive: true });
}

/* ═══════════════════════════════════════════════════════════
   2. NAVEGAÇÃO — sticky, mobile, active link
   ═══════════════════════════════════════════════════════════ */
function initNav() {
  const header  = qs('.nav-header');
  const toggle  = qs('.nav-toggle');
  const menu    = qs('.nav-menu');
  const navLinks = qsa('.nav-link');

  /* Scroll → adiciona classe scrolled */
  const onScroll = throttle(() => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, 60);
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile toggle */
  toggle?.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    menu.classList.toggle('open', !expanded);
    document.body.style.overflow = expanded ? '' : 'hidden';
  });

  /* Fechar menu ao clicar em link */
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggle?.setAttribute('aria-expanded', 'false');
      menu?.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* Fechar ao clicar fora */
  document.addEventListener('click', (e) => {
    if (menu?.classList.contains('open') &&
        !menu.contains(e.target) &&
        !toggle.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  /* Active link por seção visível */
  const sections = qsa('section[id]');
  const activateLink = throttle(() => {
    let current = '';
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= 100) current = sec.id;
    });
    navLinks.forEach(link => {
      const href = link.getAttribute('href')?.slice(1);
      link.classList.toggle('active', href === current);
    });
  }, 80);
  window.addEventListener('scroll', activateLink, { passive: true });
}

/* ═══════════════════════════════════════════════════════════
   3. REVEAL AO SCROLL — IntersectionObserver
   ═══════════════════════════════════════════════════════════ */
function initReveal() {
  if (prefersReducedMotion()) {
    qsa('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
      el.classList.add('revealed');
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        /* Também revela o section-header pai para animações de tag */
        const header = entry.target.closest('.section-header');
        if (header) header.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  qsa('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
    observer.observe(el);
  });

  /* Também observa section-headers independentes */
  qsa('.section-header').forEach(el => {
    const inner = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          inner.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    inner.observe(el);
  });
}

/* ═══════════════════════════════════════════════════════════
   4. TYPEWRITER — título do hero
   ═══════════════════════════════════════════════════════════ */
function initTypewriter() {
  const el = qs('#typed-title');
  if (!el) return;

  const phrases = [
    'Engenheiro de Dados',
    'Analista de Dados',
    'Big Data & ETL',
    'Cloud & Automação',
  ];

  let phraseIdx = 0;
  let charIdx   = 0;
  let deleting  = false;
  let paused    = false;

  const TYPING_SPEED  = 80;
  const DELETING_SPEED = 40;
  const PAUSE_END     = 2200;
  const PAUSE_START   = 400;

  function tick() {
    if (paused) return;

    const phrase = phrases[phraseIdx];

    if (!deleting) {
      el.textContent = phrase.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === phrase.length) {
        paused = true;
        setTimeout(() => { paused = false; deleting = true; tick(); }, PAUSE_END);
        return;
      }
      setTimeout(tick, TYPING_SPEED);
    } else {
      el.textContent = phrase.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        paused = true;
        setTimeout(() => { paused = false; tick(); }, PAUSE_START);
        return;
      }
      setTimeout(tick, DELETING_SPEED);
    }
  }

  /* Inicia com delay para ser percebido depois do blur-in */
  if (prefersReducedMotion()) {
    el.textContent = phrases[0];
  } else {
    setTimeout(tick, 1000);
  }
}

/* ═══════════════════════════════════════════════════════════
   5. CANVAS DE PARTÍCULAS / NÓS CONECTADOS — Hero
   ═══════════════════════════════════════════════════════════ */
function initParticleCanvas() {
  const canvas = qs('#hero-canvas');
  if (!canvas || prefersReducedMotion()) return;

  const ctx = canvas.getContext('2d');

  /* ── Configurações ── */
  const CONFIG = {
    particleCount: 70,
    connectionDistance: 130,
    particleRadius: { min: 1, max: 2.5 },
    particleSpeed: 0.25,
    lineOpacity: 0.18,
    nodeOpacity: 0.5,
    accentColor: '0, 212, 255',
    accent2Color: '0, 255, 136',
    // Partículas especiais (data packets) que viajam mais rápido
    packetCount: 8,
    packetSpeed: 1.2,
  };

  let W, H, particles;
  let animId;

  /* ── Redimensionar ── */
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width  = rect.width;
    H = canvas.height = rect.height;
    if (particles) particles.forEach(p => p.reset());
  }

  /* ── Classe Particle ── */
  class Particle {
    constructor(isPacket = false) {
      this.isPacket = isPacket;
      this.reset();
    }

    reset() {
      this.x    = Math.random() * (W || window.innerWidth);
      this.y    = Math.random() * (H || window.innerHeight);
      const spd = this.isPacket ? CONFIG.packetSpeed : CONFIG.particleSpeed;
      const angle = Math.random() * Math.PI * 2;
      this.vx   = Math.cos(angle) * spd * (0.5 + Math.random());
      this.vy   = Math.sin(angle) * spd * (0.5 + Math.random());
      this.r    = this.isPacket
        ? 2.5
        : CONFIG.particleRadius.min +
          Math.random() * (CONFIG.particleRadius.max - CONFIG.particleRadius.min);
      /* Cor: maioria azul, ~20% verde */
      this.color = Math.random() < 0.2
        ? CONFIG.accent2Color
        : CONFIG.accentColor;
      this.opacity = CONFIG.nodeOpacity * (0.4 + Math.random() * 0.6);
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      /* Reflexão nas bordas */
      if (this.x < 0)  { this.x = 0;  this.vx *= -1; }
      if (this.x > W)  { this.x = W;  this.vx *= -1; }
      if (this.y < 0)  { this.y = 0;  this.vy *= -1; }
      if (this.y > H)  { this.y = H;  this.vy *= -1; }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
      ctx.fill();

      /* Halo nos packets */
      if (this.isPacket) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, 0.08)`;
        ctx.fill();
      }
    }
  }

  /* ── Inicializar partículas ── */
  function init() {
    particles = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      particles.push(new Particle(false));
    }
    for (let i = 0; i < CONFIG.packetCount; i++) {
      particles.push(new Particle(true));
    }
  }

  /* ── Desenhar conexões ── */
  function drawConnections() {
    const total = particles.length;
    for (let i = 0; i < total; i++) {
      for (let j = i + 1; j < total; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.connectionDistance) {
          const alpha = CONFIG.lineOpacity * (1 - dist / CONFIG.connectionDistance);
          // Cor da linha baseada nas duas partículas
          const c = (particles[i].isPacket || particles[j].isPacket)
            ? CONFIG.accentColor
            : CONFIG.accentColor;

          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${c}, ${alpha})`;
          ctx.lineWidth = particles[i].isPacket || particles[j].isPacket ? 1 : 0.5;
          ctx.stroke();
        }
      }
    }
  }

  /* ── Loop de animação ── */
  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(loop);
  }

  /* ── Interatividade com mouse ── */
  let mouse = { x: -9999, y: -9999 };

  canvas.parentElement.addEventListener('mousemove', throttle((e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    /* Repulsa leve nas partículas próximas ao cursor */
    particles.forEach(p => {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 80 && dist > 0) {
        const force = (80 - dist) / 80 * 0.015;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
        /* Limita velocidade */
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const maxSpd = p.isPacket ? CONFIG.packetSpeed * 2 : CONFIG.particleSpeed * 3;
        if (speed > maxSpd) {
          p.vx = (p.vx / speed) * maxSpd;
          p.vy = (p.vy / speed) * maxSpd;
        }
      }
    });
  }, 30), { passive: true });

  canvas.parentElement.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  /* ── Visibilidade da página ── */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      loop();
    }
  });

  /* ── IntersectionObserver para pausar quando hero sai da tela ── */
  const heroObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        loop();
      } else {
        cancelAnimationFrame(animId);
      }
    });
  }, { threshold: 0.01 });

  heroObs.observe(canvas.parentElement);

  /* ── Iniciar ── */
  resize();
  init();
  loop();

  window.addEventListener('resize', throttle(() => {
    resize();
  }, 200));
}

/* ═══════════════════════════════════════════════════════════
   6. ANIMAÇÕES DO HERO — entrada ao carregar
   ═══════════════════════════════════════════════════════════ */
function initHeroEntrance() {
  if (prefersReducedMotion()) return;

  const items = qsa('.hero-content > *');
  items.forEach(el => {
    // Remove as classes reveal para não conflitar
    el.classList.remove('reveal-up');
    // Adiciona is-visible com delay definido no atributo style
    requestAnimationFrame(() => {
      el.classList.add('is-visible');
    });
  });

  /* Pipeline também */
  const pipeline = qs('.hero-pipeline');
  if (pipeline) {
    setTimeout(() => pipeline.classList.add('is-visible'), 900);
  }
}

/* ═══════════════════════════════════════════════════════════
   7. SMOOTH SCROLL — ancora com offset do nav
   ═══════════════════════════════════════════════════════════ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = qs(href);
      if (!target) return;

      e.preventDefault();

      const navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '68'
      );
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   8. CARDS — EFEITO TILT 3D SUAVE no hover (desktop only)
   ═══════════════════════════════════════════════════════════ */
function initCardTilt() {
  if (prefersReducedMotion()) return;
  if (window.matchMedia('(pointer: coarse)').matches) return; // touch devices

  const cards = qsa('.card, .projeto-card');

  cards.forEach(card => {
    const MAX_TILT = 6; // graus

    card.addEventListener('mousemove', throttle((e) => {
      const rect = card.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / (rect.width  / 2);
      const dy   = (e.clientY - cy) / (rect.height / 2);

      card.style.transform =
        `translateY(-6px) rotateX(${-dy * MAX_TILT}deg) rotateY(${dx * MAX_TILT}deg)`;
      card.style.transition = 'transform 0.1s linear';
    }, 20));

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   9. ETL FLOW — destaque sequencial dos nós
   ═══════════════════════════════════════════════════════════ */
function initEtlFlow() {
  if (prefersReducedMotion()) return;

  const nodes = qsa('.etl-node');
  if (!nodes.length) return;

  let current = 0;
  const INTERVAL = 800;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const cycle = setInterval(() => {
        nodes.forEach((n, i) => {
          n.classList.toggle('etl-node--active', i === current);
          n.classList.toggle('etl-node--end',
            i === nodes.length - 1 && current === nodes.length - 1);
        });
        current = (current + 1) % nodes.length;
      }, INTERVAL);

      // Para quando sair da tela
      const stopObs = new IntersectionObserver((e2) => {
        if (!e2[0].isIntersecting) clearInterval(cycle);
      }, { threshold: 0 });
      stopObs.observe(entry.target);

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  const etlFlow = qs('.etl-flow');
  if (etlFlow) observer.observe(etlFlow);
}

/* ═══════════════════════════════════════════════════════════
   10. COUNTER ANIMADO — números nas stats do hero
   ═══════════════════════════════════════════════════════════ */
function initCounters() {
  // Não há contadores numéricos puros aqui (os valores são textuais),
  // mas mantemos o hook para extensão futura.
}

/* ═══════════════════════════════════════════════════════════
   11. TERMINAL — efeito de digitação na seção de contato
   ═══════════════════════════════════════════════════════════ */
function initTerminalEffect() {
  if (prefersReducedMotion()) return;

  const terminal = qs('.cta-terminal');
  if (!terminal) return;

  const lines = qsa('.t-line', terminal);

  // Esconde todas as linhas e as revela sequencialmente
  lines.forEach(l => {
    l.style.opacity = '0';
    l.style.transform = 'translateX(-8px)';
    l.style.transition = 'opacity .3s ease, transform .3s ease';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      lines.forEach((line, i) => {
        setTimeout(() => {
          line.style.opacity  = '1';
          line.style.transform = 'translateX(0)';
        }, i * 120);
      });

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  observer.observe(terminal);
}

/* ═══════════════════════════════════════════════════════════
   12. TECH PILLS — entrada escalonada
   ═══════════════════════════════════════════════════════════ */
function initTechPills() {
  if (prefersReducedMotion()) return;

  const categories = qsa('.tech-category');

  categories.forEach(cat => {
    const pills = qsa('.tech-pill', cat);
    pills.forEach((pill, i) => {
      pill.style.opacity   = '0';
      pill.style.transform = 'translateX(-10px)';
      pill.style.transition = `opacity .3s ease ${i * 60}ms, transform .3s ease ${i * 60}ms`;
    });

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        pills.forEach(pill => {
          pill.style.opacity   = '1';
          pill.style.transform = 'translateX(0)';
        });
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    obs.observe(cat);
  });
}

/* ═══════════════════════════════════════════════════════════
   13. ARQUITETURA — highlight das layers em cascata
   ═══════════════════════════════════════════════════════════ */
function initArchDiagram() {
  if (prefersReducedMotion()) return;

  const layers = qsa('.arch-layer');
  if (!layers.length) return;

  layers.forEach((layer, i) => {
    layer.style.opacity   = '0';
    layer.style.transform = 'translateY(20px)';
    layer.style.transition = `opacity .5s ease ${i * 150}ms, transform .5s ease ${i * 150}ms`;
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      layers.forEach(layer => {
        layer.style.opacity   = '1';
        layer.style.transform = 'translateY(0)';
      });
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  const diagram = qs('.arch-diagram');
  if (diagram) obs.observe(diagram);
}

/* ═══════════════════════════════════════════════════════════
   14. TIMELINE — progressive reveal
   ═══════════════════════════════════════════════════════════ */
function initTimeline() {
  if (prefersReducedMotion()) return;

  const items = qsa('.timeline-item');
  items.forEach((item, i) => {
    item.style.opacity   = '0';
    item.style.transform = 'translateX(16px)';
    item.style.transition = `opacity .5s ease ${i * 150}ms, transform .5s ease ${i * 150}ms`;
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      items.forEach(item => {
        item.style.opacity   = '1';
        item.style.transform = 'translateX(0)';
      });
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  const timeline = qs('.timeline');
  if (timeline) obs.observe(timeline);
}

/* ═══════════════════════════════════════════════════════════
   15. MINI PIPELINE — animação de highlight
   ═══════════════════════════════════════════════════════════ */
function initMiniPipeline() {
  if (prefersReducedMotion()) return;

  const pipes = qsa('.mini-pipe');
  if (!pipes.length) return;

  let idx = 0;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      setInterval(() => {
        pipes.forEach((p, i) => p.classList.toggle('mini-pipe--active', i === idx));
        idx = (idx + 1) % pipes.length;
      }, 700);

      obs.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  const container = qs('.mini-pipeline');
  if (container) obs.observe(container);
}

/* ═══════════════════════════════════════════════════════════
   16. WORKFLOW — animação de highlight sequencial
   ═══════════════════════════════════════════════════════════ */
function initWorkflow() {
  if (prefersReducedMotion()) return;

  const circles = qsa('.wf-circle');
  if (!circles.length) return;

  let idx = 0;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      setInterval(() => {
        circles.forEach((c, i) => {
          if (i === idx) {
            c.style.boxShadow = '0 0 20px rgba(0,212,255,.4)';
            c.style.transform = 'scale(1.08)';
          } else {
            c.style.boxShadow = '';
            c.style.transform = '';
          }
        });
        idx = (idx + 1) % circles.length;
      }, 900);

      obs.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  const diagram = qs('.workflow-diagram');
  if (diagram) obs.observe(diagram);
}

/* ═══════════════════════════════════════════════════════════
   17. ACESSIBILIDADE — skip link, focus trap mobile
   ═══════════════════════════════════════════════════════════ */
function initAccessibility() {
  /* Skip link */
  const skip = document.createElement('a');
  skip.href = '#sobre';
  skip.textContent = 'Pular para o conteúdo';
  skip.className = 'skip-link';
  skip.style.cssText = `
    position: fixed; top: -100%; left: 50%; transform: translateX(-50%);
    background: var(--accent); color: var(--bg-base);
    padding: .5rem 1rem; border-radius: 0 0 8px 8px;
    font-weight: 700; z-index: 9999; transition: top .2s;
  `;
  skip.addEventListener('focus', () => { skip.style.top = '0'; });
  skip.addEventListener('blur',  () => { skip.style.top = '-100%'; });
  document.body.prepend(skip);
}

/* ═══════════════════════════════════════════════════════════
   18. PLACEHOLDER — efeito hover nos links de contato
   ═══════════════════════════════════════════════════════════ */
function initContactLinks() {
  const cards = qsa('.contato-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      const arrow = qs('.contato-arrow', card);
      if (arrow) arrow.style.transform = 'translateX(6px)';
    });
    card.addEventListener('mouseleave', () => {
      const arrow = qs('.contato-arrow', card);
      if (arrow) arrow.style.transform = '';
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   INIT — DOM Ready
   ═══════════════════════════════════════════════════════════ */
function init() {
  initAccessibility();
  initScrollProgress();
  initNav();
  initSmoothScroll();
  initReveal();
  initHeroEntrance();
  initTypewriter();
  initParticleCanvas();
  initCardTilt();
  initEtlFlow();
  initCounters();
  initTerminalEffect();
  initTechPills();
  initArchDiagram();
  initTimeline();
  initMiniPipeline();
  initWorkflow();
  initContactLinks();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
