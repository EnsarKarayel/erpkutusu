 const Security = (() => {

  // --- INPUT TEMİZLEME ---
  const sanitize = (str) => {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim()
      .slice(0, 500);
  };

  // --- RATE LIMITER (form spam koruması) ---
  const rateLimiter = (() => {
    const attempts = {};
    const MAX = 5;
    const WINDOW = 60 * 1000; // 1 dakika

    return {
      check(key) {
        const now = Date.now();
        if (!attempts[key]) attempts[key] = [];
        attempts[key] = attempts[key].filter(t => now - t < WINDOW);
        if (attempts[key].length >= MAX) return false;
        attempts[key].push(now);
        return true;
      }
    };
  })();

  // --- EMAIL DOĞRULAMA ---
  const isValidEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  // --- TELEFON DOĞRULAMA ---
  const isValidPhone = (phone) => {
    const re = /^(\+90|0)?[0-9]{10}$/;
    return re.test(phone.replace(/\s/g, ''));
  };

  // --- HONEYPOT KONTROLÜ (bot tuzağı) ---
  const checkHoneypot = (fieldValue) => {
    return fieldValue === '';
  };

  // --- SQL INJECTION PATTERN KONTROLÜ ---
  // (Kullanıcı arama alanları için)
  const hasSQLInjection = (str) => {
    const patterns = [
      /(\b)(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/i,
      /['";\-\-\/\*]/,
      /xp_/i
    ];
    return patterns.some(p => p.test(str));
  };

  // --- CLIPBOARD GÜVENLİ KOPYALAMA ---
  const safeCopy = async (text, btn) => {
    if (!navigator.clipboard) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } else {
      await navigator.clipboard.writeText(text);
    }
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Kopyalandı!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = orig;
        btn.disabled = false;
      }, 2000);
    }
  };

  // --- FORM DOĞRULAMA ---
  const validateForm = (fields) => {
    const errors = [];
    fields.forEach(({ value, name, required, type, max }) => {
      const clean = sanitize(value);
      if (required && !clean) {
        errors.push(`${name} alanı zorunludur.`);
        return;
      }
      if (type === 'email' && clean && !isValidEmail(clean)) {
        errors.push(`Geçerli bir e-posta adresi giriniz.`);
      }
      if (type === 'phone' && clean && !isValidPhone(clean)) {
        errors.push(`Geçerli bir telefon numarası giriniz.`);
      }
      if (max && clean.length > max) {
        errors.push(`${name} en fazla ${max} karakter olabilir.`);
      }
      if (hasSQLInjection(clean)) {
        errors.push(`${name} alanında geçersiz karakterler var.`);
      }
    });
    return errors;
  };

  // --- CSP NONCE (inline script güvenliği) ---
  const generateNonce = () => {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return btoa(String.fromCharCode(...arr));
  };

  // --- DIŞ BAĞLANTI GÜVENLİĞİ ---
  const safeExternalLink = (url) => {
    const allowed = ['github.com', 'linkedin.com'];
    try {
      const u = new URL(url);
      if (!allowed.some(d => u.hostname.endsWith(d))) return '#';
      return url;
    } catch {
      return '#';
    }
  };

  return {
    sanitize,
    rateLimiter,
    isValidEmail,
    isValidPhone,
    checkHoneypot,
    hasSQLInjection,
    safeCopy,
    validateForm,
    generateNonce,
    safeExternalLink
  };
})();
