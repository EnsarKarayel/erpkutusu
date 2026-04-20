function copySQL(btn) {
  const codeElement = btn.closest('.sql-card')?.querySelector('.sql-code');
  if (!codeElement) return;

  const code = codeElement.innerText || '';

  if (typeof Security !== 'undefined' && Security.safeCopy) {
    Security.safeCopy(code, btn);
    return;
  }

  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = 'Kopyalandı!';
    setTimeout(() => {
      btn.textContent = 'Kopyala';
    }, 2000);
  });
}

const calcs = {
  stok: {
    label: 'Stok Devir Hızı',
    fields: [
      { id: 'smm', label: 'Satılan Malın Maliyeti (₺)', placeholder: '1000000' },
      { id: 'stok', label: 'Ortalama Stok Değeri (₺)', placeholder: '250000' }
    ],
    calc: (v) => v.smm && v.stok ? (v.smm / v.stok).toFixed(2) + 'x' : '—',
    resultLabel: 'Devir Hızı'
  },
  kar: {
    label: 'Brüt Kar Marjı',
    fields: [
      { id: 'satis', label: 'Net Satış (₺)', placeholder: '2000000' },
      { id: 'smm', label: 'Satılan Malın Maliyeti (₺)', placeholder: '1200000' }
    ],
    calc: (v) => v.satis && v.smm ? (((v.satis - v.smm) / v.satis) * 100).toFixed(1) + '%' : '—',
    resultLabel: 'Brüt Kar Marjı'
  },
  dso: {
    label: 'DSO (Günlük Satış Alacak)',
    fields: [
      { id: 'alacak', label: 'Toplam Alacaklar (₺)', placeholder: '500000' },
      { id: 'gsatis', label: 'Günlük Ortalama Satış (₺)', placeholder: '15000' }
    ],
    calc: (v) => v.alacak && v.gsatis ? Math.round(v.alacak / v.gsatis) + ' gün' : '—',
    resultLabel: 'Tahsilat Süresi'
  }
};

let currentCalc = 'stok';

function setCalc(type) {
  currentCalc = type;
  renderCalc();
}

function renderCalc() {
  const c = calcs[currentCalc];
  const container = document.getElementById('calc-fields');

  if (!container) return;

  container.innerHTML = c.fields.map(f => `
    <div style="margin-bottom:12px;">
      <div class="calc-label">${f.label}</div>
      <input class="calc-input" id="field-${f.id}" type="number" placeholder="${f.placeholder}" oninput="updateCalc()">
    </div>
  `).join('');

  const labelEl = document.getElementById('calc-label');
  const valEl = document.getElementById('calc-val');

  if (labelEl) labelEl.textContent = c.resultLabel;
  if (valEl) valEl.textContent = '—';
}

function updateCalc() {
  const c = calcs[currentCalc];
  const vals = {};

  c.fields.forEach(f => {
    const el = document.getElementById('field-' + f.id);
    vals[f.id] = el ? parseFloat(el.value) : 0;
  });

  const valEl = document.getElementById('calc-val');
  if (valEl) {
    valEl.textContent = c.calc(vals);
  }
}

function initNewsletter() {
  const emailInput = document.getElementById('newsletterEmail');
  const honeypotInput = document.getElementById('newsletterWebsite');
  const btn = document.getElementById('newsletterBtn');
  const result = document.getElementById('newsletterResult');

  if (!emailInput || !honeypotInput || !btn || !result) return;

  btn.addEventListener('click', function () {
    result.textContent = '';

    if (typeof Security !== 'undefined') {
      if (!Security.rateLimiter.check('newsletter')) {
        result.textContent = 'Çok sık deneme yapıldı. Lütfen biraz sonra tekrar deneyin.';
        return;
      }

      if (!Security.checkHoneypot(honeypotInput.value)) {
        result.textContent = 'İşlem başarısız.';
        return;
      }
    }

    const rawEmail = emailInput.value || '';
    const email = typeof Security !== 'undefined' ? Security.sanitize(rawEmail) : rawEmail.trim();

    if (!email) {
      result.textContent = 'Lütfen e-posta adresinizi girin.';
      return;
    }

    if (typeof Security !== 'undefined' && !Security.isValidEmail(email)) {
      result.textContent = 'Geçerli bir e-posta adresi girin.';
      return;
    }

    result.textContent = 'Abonelik formu hazır. Sonraki adımda bunu gerçek servise bağlayacağız.';
    emailInput.value = '';
    honeypotInput.value = '';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setCalc('stok');
  initNewsletter();
});