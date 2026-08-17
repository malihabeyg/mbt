// ── Media Buy Trio — Main Script ──────────────────────────────────────────────
(function () {

  // ── Nav scroll ──
  const nav = document.querySelector('nav.main-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 30);
    });
  }

  // ── Mobile menu ──
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
    mobileMenu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => mobileMenu.classList.remove('open'))
    );
  }

  // ── Fade-up observer ──
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-up:not(.visible)').forEach(el => obs.observe(el));

  // ── Results page platform tabs ──
  const tabs   = document.querySelectorAll('.plat-tab');
  const panels = document.querySelectorAll('.plat-panel');
  if (tabs.length && panels.length) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const id = tab.getAttribute('data-tab');
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        panels.forEach(p => p.style.display = (p.getAttribute('data-panel') === id) ? 'grid' : 'none');
      });
    });
  }

  // ── Smart email links: Gmail on desktop/Chrome, native Mail on iOS ──
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }
  function openEmail(e) {
    const email = 'mediabuytrio@gmail.com';
    if (isIOS()) {
      window.location.href = 'mailto:' + email;
    } else {
      e.preventDefault();
      window.open('https://mail.google.com/mail/?view=cm&to=' + email, '_blank');
    }
  }
  document.querySelectorAll('a[href="mailto:mediabuytrio@gmail.com"]').forEach(link => {
    link.addEventListener('click', openEmail);
  });

  // ── Quote form ────────────────────────────────────────────────────────────

  const SHEET_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwEfgGZhq9Q7Veb-B3grBB5WpaUDnBCQECSiGLJ5XS85E7l-2MB9ygEt_skN3RJh6DK/exec';

  // ── Validation rules ──
  const RULES = {
    name: {
      required: true,
      minLen: 2,
      maxLen: 100,
      // Only letters (including accented), spaces, hyphens, apostrophes — NO digits
      pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,100}$/,
      patternMsg: 'Name can only contain letters, spaces, hyphens, and apostrophes.'
    },
    email: {
      required: true,
      maxLen: 254,
      // RFC 5322 simplified — blocks dangerous chars
      pattern: /^[^\s@<>;,]{1,64}@[^\s@<>;,]{1,255}\.[^\s@<>;,]{2,}$/,
      patternMsg: 'Please enter a valid email address.'
    },
    brand: {
      required: false,
      maxLen: 200,
      // Allow alphanumeric, spaces, dots, hyphens, slashes (for URLs)
      pattern: /^[A-Za-z0-9 .,'"\-\/&()]{0,200}$/,
      patternMsg: 'Brand name contains invalid characters.'
    },
    msg: {
      required: false,
      maxLen: 2000,
      minLen: 0,
      // Block obvious injection attempts
      dangerPattern: /(<script|javascript:|on\w+=|SELECT\s+\*|DROP\s+TABLE|INSERT\s+INTO|UNION\s+SELECT)/i,
      dangerMsg: 'Your message contains invalid content. Please remove any code or special commands.'
    }
  };

  // Shared dangerous pattern check for all fields
  const INJECTION_PATTERN = /(<script[\s\S]*?>|javascript\s*:|on\w+\s*=\s*["']|SELECT\b.*\bFROM\b|DROP\s+TABLE|INSERT\s+INTO|UNION\s+SELECT|EXEC\s*\(|\x00)/i;

  // ── Helper: show/clear field error ──
  function setError(fieldName, msg) {
    const el = document.getElementById('err-' + fieldName);
    const input = document.querySelector('[name="' + fieldName + '"]');
    if (!el || !input) return;
    el.textContent = msg;
    if (msg) {
      input.classList.add('invalid');
      input.classList.remove('valid');
    } else {
      input.classList.remove('invalid');
    }
  }

  function setValid(fieldName) {
    const el = document.getElementById('err-' + fieldName);
    const input = document.querySelector('[name="' + fieldName + '"]');
    if (!el || !input) return;
    el.textContent = '';
    input.classList.add('valid');
    input.classList.remove('invalid');
  }

  // ── Sanitize: strip HTML tags & control chars ──
  function sanitize(str) {
    return str
      .replace(/<[^>]*>/g, '')                           // strip HTML tags
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
      .trim();
  }

  // ── Validate a single field, returns true if valid ──
  function validateField(name, value) {
    const rule = RULES[name];
    if (!rule) return true;

    const v = value.trim();

    // Required check
    if (rule.required && v.length === 0) {
      setError(name, 'This field is required.');
      return false;
    }

    // Skip further checks if optional and empty
    if (!rule.required && v.length === 0) {
      setError(name, '');
      return true;
    }

    // Min length
    if (rule.minLen && v.length < rule.minLen) {
      setError(name, 'Must be at least ' + rule.minLen + ' characters.');
      return false;
    }

    // Max length (belt-and-suspenders on top of HTML maxlength)
    if (rule.maxLen && v.length > rule.maxLen) {
      setError(name, 'Must be ' + rule.maxLen + ' characters or fewer.');
      return false;
    }

    // Injection / dangerous content
    if (INJECTION_PATTERN.test(v)) {
      setError(name, 'Invalid content detected. Please remove any code or special commands.');
      return false;
    }

    // Field-specific danger pattern
    if (rule.dangerPattern && rule.dangerPattern.test(v)) {
      setError(name, rule.dangerMsg);
      return false;
    }

    // Format/pattern
    if (rule.pattern && !rule.pattern.test(v)) {
      setError(name, rule.patternMsg);
      return false;
    }

    setValid(name);
    return true;
  }

  // ── Client-side rate limiting (localStorage token bucket) ──
  const RATE_KEY    = 'mbt_submit_times';
  const RATE_LIMIT  = 5;    // max submissions
  const RATE_WINDOW = 3600; // seconds (1 hour)

  function isRateLimited() {
    try {
      const now  = Math.floor(Date.now() / 1000);
      const raw  = localStorage.getItem(RATE_KEY);
      const times = raw ? JSON.parse(raw).filter(t => now - t < RATE_WINDOW) : [];
      if (times.length >= RATE_LIMIT) return true;
      times.push(now);
      localStorage.setItem(RATE_KEY, JSON.stringify(times));
      return false;
    } catch (_) {
      return false; // if localStorage is blocked, allow through (server will still rate-limit)
    }
  }

  // ── Wire up the form ──
  const quoteForm = document.querySelector('.quote-form');
  if (quoteForm) {

    // Live char counter for message textarea
    const msgArea  = quoteForm.querySelector('[name="msg"]');
    const cntLabel = document.getElementById('cnt-msg');
    if (msgArea && cntLabel) {
      msgArea.addEventListener('input', () => {
        const len = msgArea.value.length;
        const max = 2000;
        cntLabel.textContent = len + ' / ' + max;
        cntLabel.classList.toggle('warn', len > 1600 && len <= max);
        cntLabel.classList.toggle('over', len > max);
      });
    }

    // Live validation on blur (after user leaves a field)
    ['name', 'email', 'brand', 'msg'].forEach(name => {
      const el = quoteForm.querySelector('[name="' + name + '"]');
      if (el) {
        el.addEventListener('blur', () => validateField(name, el.value));
        // Clear error as user types, re-validate on blur
        el.addEventListener('input', () => {
          if (el.classList.contains('invalid')) validateField(name, el.value);
        });
      }
    });

    // Block paste of scripts into name field
    const nameInput = quoteForm.querySelector('[name="name"]');
    if (nameInput) {
      nameInput.addEventListener('paste', e => {
        const pasted = (e.clipboardData || window.clipboardData).getData('text');
        if (/\d/.test(pasted) || INJECTION_PATTERN.test(pasted)) {
          e.preventDefault();
          setError('name', 'Pasted content contains invalid characters.');
        }
      });
    }

    // ── Submit handler ──
    quoteForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Honeypot check
      const honeypot = quoteForm.querySelector('[name="website"]');
      if (honeypot && honeypot.value.trim().length > 0) {
        // Silent fail for bots
        quoteForm.reset();
        return;
      }

      // Client-side rate limit
      if (isRateLimited()) {
        alert('Too many submissions. Please wait a while before trying again.');
        return;
      }

      // Gather values
      const nameVal    = quoteForm.querySelector('[name="name"]').value;
      const emailVal   = quoteForm.querySelector('[name="email"]').value;
      const brandEl    = quoteForm.querySelector('[name="brand"]');
      const brandVal   = brandEl ? brandEl.value : '';
      const msgEl      = quoteForm.querySelector('[name="msg"]');
      const msgVal     = msgEl ? msgEl.value : '';

      // Run all validations
      const ok = [
        validateField('name',  nameVal),
        validateField('email', emailVal),
        validateField('brand', brandVal),
        validateField('msg',   msgVal)
      ].every(Boolean);

      if (!ok) {
        // Scroll to first error
        const firstErr = quoteForm.querySelector('.invalid');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const btn = quoteForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;

      const payload = {
        name:    sanitize(nameVal),
        email:   sanitize(emailVal),
        brand:   sanitize(brandVal),
        budget:  quoteForm.querySelector('[name="budget"]') ? quoteForm.querySelector('[name="budget"]').value : '',
        message: sanitize(msgVal)
      };

      try {
        await fetch(SHEET_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        btn.textContent = '✓ Sent!';
        btn.style.background = '#14B87A';
        quoteForm.reset();
        // Clear valid states after reset
        quoteForm.querySelectorAll('.valid,.invalid').forEach(el => {
          el.classList.remove('valid', 'invalid');
        });
        quoteForm.querySelectorAll('.field-error').forEach(el => el.textContent = '');
        if (cntLabel) cntLabel.textContent = '0 / 2000';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      } catch (err) {
        btn.textContent = 'Error — try again';
        btn.style.background = '#e53e3e';
        btn.disabled = false;
      }
    });
  }

})();
