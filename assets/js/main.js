(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var toTop = document.getElementById('toTop');

  /* Header background + back-to-top on scroll */
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    toTop.classList.toggle('show', y > 500);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile nav */
  navToggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* Hero slideshow */
  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dotsWrap = document.getElementById('heroDots');
  var current = 0;
  var timer;

  if (slides.length && dotsWrap) {
    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      if (i === 0) b.className = 'active';
      b.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(b);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function go(i) {
      slides[current].classList.remove('is-active');
      dots[current].classList.remove('active');
      current = (i + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      dots[current].classList.add('active');
      restart();
    }
    function next() { go(current + 1); }
    function restart() { clearInterval(timer); timer = setInterval(next, 6000); }
    restart();
  }

  /* Scroll reveal */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Active nav link based on section in view */
  var sections = ['home', 'about', 'services', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var navLinks = {};
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) {
    navLinks[a.getAttribute('href').slice(1)] = a;
  });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          Object.keys(navLinks).forEach(function (k) { navLinks[k].classList.remove('active'); });
          var link = navLinks[en.target.id];
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* Contact form -> POST to /api/contact (Cloudflare Pages Function) */
  var form = document.querySelector('.contact-form');
  var note = document.getElementById('formNote');
  if (form) {
    var submitBtn = form.querySelector('[type="submit"]');
    var ERR = '#b4532a';

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        note.textContent = 'Please fill in the required fields.';
        note.style.color = ERR;
        form.reportValidity();
        return;
      }

      var payload = {
        first_name: form.first_name.value.trim(),
        last_name: form.last_name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        comments: form.comments.value.trim(),
        company: form.company ? form.company.value : '' // honeypot
      };

      var original = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      note.textContent = '';

      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (r) {
          if (r.ok) {
            note.textContent = 'Thanks! Your message is on its way. We\'ll be in touch soon.';
            note.style.color = '';
            form.reset();
          } else {
            note.textContent = (r.data && r.data.error) || 'Something went wrong. Please try again.';
            note.style.color = ERR;
          }
        })
        .catch(function () {
          note.textContent = 'Network error. Please try again in a moment.';
          note.style.color = ERR;
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = original;
        });
    });
  }

  /* Footer year */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
