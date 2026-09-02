function copySQL(btn) {
  const codeElement = btn.closest(".sql-card")?.querySelector(".sql-code");
  if (!codeElement) return;

  const code = codeElement.innerText || "";

  if (typeof Security !== "undefined" && Security.safeCopy) {
    Security.safeCopy(code, btn);
    return;
  }

  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = "Kopyalandı!";
    setTimeout(() => {
      btn.textContent = "Kopyala";
    }, 2000);
  });
}

const calcs = {
  stok: {
    label: "Stok Devir Hızı",
    fields: [
      { id: "smm", label: "Satılan Malın Maliyeti (₺)", placeholder: "1000000" },
      { id: "stok", label: "Ortalama Stok Değeri (₺)", placeholder: "250000" }
    ],
    calc: (v) => (v.smm && v.stok ? (v.smm / v.stok).toFixed(2) + "x" : "—"),
    resultLabel: "Devir Hızı"
  },
  kar: {
    label: "Brüt Kar Marjı",
    fields: [
      { id: "satis", label: "Net Satış (₺)", placeholder: "2000000" },
      { id: "smm", label: "Satılan Malın Maliyeti (₺)", placeholder: "1200000" }
    ],
    calc: (v) =>
      v.satis && v.smm
        ? (((v.satis - v.smm) / v.satis) * 100).toFixed(1) + "%"
        : "—",
    resultLabel: "Brüt Kar Marjı"
  },
  dso: {
    label: "DSO (Günlük Satış Alacak)",
    fields: [
      { id: "alacak", label: "Toplam Alacaklar (₺)", placeholder: "500000" },
      { id: "gsatis", label: "Günlük Ortalama Satış (₺)", placeholder: "15000" }
    ],
    calc: (v) => (v.alacak && v.gsatis ? Math.round(v.alacak / v.gsatis) + " gün" : "—"),
    resultLabel: "Tahsilat Süresi"
  }
};

let currentCalc = "stok";

function setCalc(type) {
  currentCalc = type;
  renderCalc();
}

function renderCalc() {
  const c = calcs[currentCalc];
  const container = document.getElementById("calc-fields");

  if (!container) return;

  container.innerHTML = c.fields
    .map(
      (f) => `
    <div style="margin-bottom:12px;">
      <div class="calc-label">${f.label}</div>
      <input class="calc-input" id="field-${f.id}" type="number" placeholder="${f.placeholder}" oninput="updateCalc()">
    </div>
  `
    )
    .join("");

  const labelEl = document.getElementById("calc-label");
  const valEl = document.getElementById("calc-val");

  if (labelEl) labelEl.textContent = c.resultLabel;
  if (valEl) valEl.textContent = "—";
}

function updateCalc() {
  const c = calcs[currentCalc];
  const vals = {};

  c.fields.forEach((f) => {
    const el = document.getElementById("field-" + f.id);
    vals[f.id] = el ? parseFloat(el.value) : 0;
  });

  const valEl = document.getElementById("calc-val");
  if (valEl) {
    valEl.textContent = c.calc(vals);
  }
}

async function submitWeb3Form(form, resultEl, submitBtn, successMessage) {
  const formData = new FormData(form);
  const object = Object.fromEntries(formData.entries());
  const json = JSON.stringify(object);

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Gönderiliyor...";
    }

    if (resultEl) {
      resultEl.textContent = "Gönderiliyor...";
      resultEl.style.color = "";
    }

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: json
    });

    const result = await response.json();

    if (response.ok && result.success) {
      if (resultEl) {
        resultEl.textContent = successMessage;
        resultEl.style.color = "#86efac";
      }
      form.reset();
      return true;
    }

    if (resultEl) {
      resultEl.textContent = "Gönderim başarısız. Lütfen tekrar deneyin.";
      resultEl.style.color = "#fca5a5";
    }
    return false;
  } catch (error) {
    if (resultEl) {
      resultEl.textContent = "Bir hata oluştu. Lütfen tekrar deneyin.";
      resultEl.style.color = "#fca5a5";
    }
    return false;
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.defaultText || "Gönder";
    }
  }
}

function initNewsletter() {
  const newsletterForm = document.getElementById("newsletterForm");
  const emailInput = document.getElementById("newsletterEmail");
  const honeypotInput = document.getElementById("newsletterWebsite");
  const btn = document.getElementById("newsletterBtn");
  const result = document.getElementById("newsletterResult");

  if (!btn || !result) return;

  btn.dataset.defaultText = btn.textContent;

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (typeof Security !== "undefined") {
        if (!Security.rateLimiter.check("newsletter")) {
          result.textContent = "Çok sık deneme yapıldı. Lütfen biraz sonra tekrar deneyin.";
          result.style.color = "#fca5a5";
          return;
        }

        const botValue = honeypotInput ? honeypotInput.value : "";
        if (!Security.checkHoneypot(botValue)) {
          result.textContent = "İşlem başarısız.";
          result.style.color = "#fca5a5";
          return;
        }

        if (emailInput && !Security.isValidEmail(emailInput.value || "")) {
          result.textContent = "Geçerli bir e-posta adresi girin.";
          result.style.color = "#fca5a5";
          return;
        }
      }

      await submitWeb3Form(
        newsletterForm,
        result,
        btn,
        "Teşekkürler. Başvurunuz alındı."
      );
    });

    return;
  }

  if (!emailInput || !honeypotInput) return;

  btn.addEventListener("click", function () {
    result.textContent = "";
    result.style.color = "";

    if (typeof Security !== "undefined") {
      if (!Security.rateLimiter.check("newsletter")) {
        result.textContent = "Çok sık deneme yapıldı. Lütfen biraz sonra tekrar deneyin.";
        result.style.color = "#fca5a5";
        return;
      }

      if (!Security.checkHoneypot(honeypotInput.value)) {
        result.textContent = "İşlem başarısız.";
        result.style.color = "#fca5a5";
        return;
      }
    }

    const rawEmail = emailInput.value || "";
    const email =
      typeof Security !== "undefined" && Security.sanitize
        ? Security.sanitize(rawEmail)
        : rawEmail.trim();

    if (!email) {
      result.textContent = "Lütfen e-posta adresinizi girin.";
      result.style.color = "#fca5a5";
      return;
    }

    if (typeof Security !== "undefined" && Security.isValidEmail && !Security.isValidEmail(email)) {
      result.textContent = "Geçerli bir e-posta adresi girin.";
      result.style.color = "#fca5a5";
      return;
    }

    result.textContent = "Abonelik formu hazır. Sonraki adımda bunu gerçek servise bağlayacağız.";
    result.style.color = "#86efac";
    emailInput.value = "";
    honeypotInput.value = "";
  });
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  const resultEl = document.getElementById("formResult");
  const submitBtn = document.getElementById("contactSubmit");

  if (!form || !resultEl || !submitBtn) return;

  submitBtn.dataset.defaultText = submitBtn.textContent;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (typeof Security !== "undefined") {
      if (!Security.rateLimiter.check("contactForm")) {
        resultEl.textContent = "Çok sık deneme yapıldı. Lütfen biraz sonra tekrar deneyin.";
        resultEl.style.color = "#fca5a5";
        return;
      }

      const honeypotValue = form.querySelector('input[name="botcheck"]')?.value || "";
      if (!Security.checkHoneypot(honeypotValue)) {
        resultEl.textContent = "Gönderim başarısız.";
        resultEl.style.color = "#fca5a5";
        return;
      }
    }

    const nameEl = document.getElementById("name");
    const emailEl = document.getElementById("email");
    const phoneEl = document.getElementById("phone");
    const subjectEl = document.getElementById("subject");
    const messageEl = document.getElementById("message");

    const fields = [
      {
        name: "Ad Soyad",
        value: nameEl ? nameEl.value : "",
        required: true,
        max: 100
      },
      {
        name: "E-posta",
        value: emailEl ? emailEl.value : "",
        required: true,
        type: "email",
        max: 150
      },
      {
        name: "Telefon",
        value: phoneEl ? phoneEl.value : "",
        required: false,
        type: "phone",
        max: 20
      },
      {
        name: "Konu",
        value: subjectEl ? subjectEl.value : "",
        required: true,
        max: 150
      },
      {
        name: "Mesaj",
        value: messageEl ? messageEl.value : "",
        required: true,
        max: 2000
      }
    ];

    if (typeof Security !== "undefined" && Security.validateForm) {
      const errors = Security.validateForm(fields);
      if (errors.length > 0) {
        resultEl.textContent = errors[0];
        resultEl.style.color = "#fca5a5";
        return;
      }
    }

    await submitWeb3Form(
      form,
      resultEl,
      submitBtn,
      "Mesajınız başarıyla gönderildi ✅"
    );
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setCalc("stok");
  initNewsletter();
  initContactForm();
});
const erpDiagnosticMap = {
  stok: { title: "Stok ve depo odağı", kpi: "Stok devir hızı, hareketsiz stok günü, negatif stok, depo bazlı stok değeri", sql: "Stok hareketleri, depo bakiyesi, rezervasyon ve kalite blokajı tabloları kontrol edilmeli." },
  kalite: { title: "Kalite ve CAPA odağı", kpi: "PPM, FPY, COPQ, CAPA kapanma süresi, uygunsuzluk Pareto", sql: "NCR, CAPA, tedarikçi kabul, iade ve müşteri şikayeti kayıtları birlikte okunmalı." },
  finans: { title: "Finans ve tahsilat odağı", kpi: "DSO, vadesi geçen alacak, brüt kar marjı, müşteri karlılığı", sql: "Fatura, tahsilat, vade, kur farkı ve kapama hareketleri ayrılmalı." },
  uretim: { title: "Üretim ve OEE odağı", kpi: "OEE, fire oranı, vardiya verimi, yeniden işleme oranı", sql: "İş emri, operasyon, duruş, fire ve sağlam üretim kayıtları doğrulanmalı." },
  satis: { title: "Satış ve teslimat odağı", kpi: "OTIF, sipariş karşılama oranı, teslimat gecikmesi, iade oranı", sql: "Sipariş, irsaliye, fatura, iade ve sevkiyat tarihleri aynı raporda ayrılmalı." }
};
function formatDiagnostic(item, erp, priority) {
  return `${item.title}\nERP: ${erp || "Genel ERP"}${priority ? `\nÖncelik: ${priority}` : ""}\n\nÖnerilen KPI seti:\n${item.kpi}\n\nSQL / veri kontrolü:\n${item.sql}\n\nSonraki adım: ilgili rehbere geçip örnek kayıtlarla doğrulama yapın.`;
}
function runHomeDiagnostic() {
  const problem = document.getElementById("homeProblem")?.value || "stok";
  const erp = document.getElementById("homeErp")?.value || "Genel ERP";
  const out = document.getElementById("homeDiagnosticOutput");
  const item = erpDiagnosticMap[problem] || erpDiagnosticMap.stok;
  if (out) out.textContent = formatDiagnostic(item, erp, "Hızlı yönlendirme");
}
function runProcessDiagnostic() {
  const problem = document.getElementById("processProblem")?.value || "stok";
  const erp = document.getElementById("processErp")?.value || "Genel ERP";
  const priority = document.getElementById("processPriority")?.value || "Raporlama";
  const out = document.getElementById("processDiagnosticOutput");
  const item = erpDiagnosticMap[problem] || erpDiagnosticMap.stok;
  if (out) out.textContent = formatDiagnostic(item, erp, priority);
}
function calculateErpRoi() {
  const num = (id) => Number(document.getElementById(id)?.value || 0);
  const monthlyHours = num("roiHours");
  const hourlyRate = num("roiRate");
  const errorCost = num("roiError");
  const automation = Math.min(Math.max(num("roiAutomation"), 0), 100) / 100;
  const projectCost = num("roiCost");
  const monthlyBenefit = (monthlyHours * hourlyRate * automation) + (errorCost * automation);
  const yearlyBenefit = monthlyBenefit * 12;
  const payback = monthlyBenefit > 0 ? projectCost / monthlyBenefit : 0;
  const roi = projectCost > 0 ? ((yearlyBenefit - projectCost) / projectCost) * 100 : 0;
  const out = document.getElementById("roiOutput");
  if (!out) return;
  const comment = payback <= 12 ? "Güçlü aday: proje bir yıl içinde kendini ödeyebilir." : payback <= 24 ? "Orta aday: kapsamı daraltıp hızlı kazanım alanı seçmek mantıklı." : "Dikkat: önce manuel süreç kaybı veya hata maliyeti daha net ölçülmeli.";
  out.textContent = `Aylık tahmini fayda: ${Math.round(monthlyBenefit).toLocaleString("tr-TR")} TL\nYıllık tahmini fayda: ${Math.round(yearlyBenefit).toLocaleString("tr-TR")} TL\nGeri dönüş süresi: ${payback ? payback.toFixed(1) : "-"} ay\nYıllık ROI: ${roi.toFixed(1)}%\n\n${comment}`;
}
function filterErpSystems() {
  const query = (document.getElementById("erpSearch")?.value || "").toLowerCase().trim();
  const segment = document.getElementById("erpSegment")?.value || "all";
  const cards = document.querySelectorAll(".erp-system-card");
  let visible = 0;
  cards.forEach((card) => {
    const name = (card.dataset.name || "").toLowerCase();
    const text = card.textContent.toLowerCase();
    const segments = (card.dataset.segment || "").split(/\s+/);
    const matchQuery = !query || name.includes(query) || text.includes(query);
    const matchSegment = segment === "all" || segments.includes(segment);
    const show = matchQuery && matchSegment;
    card.style.display = show ? "" : "none";
    if (show) visible += 1;
  });
  const out = document.getElementById("erpFilterOutput");
  if (out) out.textContent = `${visible} ERP sistemi gösteriliyor. Seçim yaparken sektör uyumu, raporlama açıklığı, danışman ekosistemi ve veri kalitesini birlikte değerlendirin.`;
}
function submitErpExperience() {
  const erp = document.getElementById("experienceErp")?.value.trim() || "Belirtilmedi";
  const area = document.getElementById("experienceArea")?.value.trim() || "Belirtilmedi";
  const note = document.getElementById("experienceText")?.value.trim() || "Deneyim notu yazılmadı.";
  const subject = encodeURIComponent(`ERP deneyimi: ${erp}`);
  const body = encodeURIComponent(`ERP: ${erp}\nKullanım alanı: ${area}\n\nDeneyim özeti:\n${note}\n\nNot: Bu deneyimin editoryal kontrolden sonra anonim veya isimli yayınlanabileceğini kabul ediyorum.`);
  const out = document.getElementById("experienceOutput");
  if (out) out.textContent = "E-posta taslağı hazırlanıyor. İçerik otomatik yayınlanmayacak, önce incelenecek.";
  window.location.href = `mailto:karayelensar@gmail.com?subject=${subject}&body=${body}`;
}
function filterErpTopics() {
  const query = (document.getElementById("erpTopicSearch")?.value || "").toLowerCase().trim();
  const system = document.getElementById("erpTopicSystem")?.value || "all";
  const area = document.getElementById("erpTopicArea")?.value || "all";
  const links = document.querySelectorAll(".erp-topic-link");
  let visible = 0;
  links.forEach((link) => {
    const matchQuery = !query || link.textContent.toLowerCase().includes(query);
    const matchSystem = system === "all" || link.dataset.system === system;
    const matchArea = area === "all" || link.dataset.area === area;
    const show = matchQuery && matchSystem && matchArea;
    link.style.display = show ? "" : "none";
    if (show) visible += 1;
  });
  document.querySelectorAll(".topic-system-group").forEach((group) => {
    const anyVisible = Array.from(group.querySelectorAll(".erp-topic-link")).some((link) => link.style.display !== "none");
    group.style.display = anyVisible ? "" : "none";
  });
  const out = document.getElementById("erpTopicOutput");
  if (out) out.textContent = `${visible} rehber gösteriliyor. Detay sayfalarında veri kaynağı, KPI ve canlıya geçiş kontrolü birlikte verilir.`;
}
function resetErpTopics() {
  const search = document.getElementById("erpTopicSearch");
  const system = document.getElementById("erpTopicSystem");
  const area = document.getElementById("erpTopicArea");
  if (search) search.value = "";
  if (system) system.value = "all";
  if (area) area.value = "all";
  filterErpTopics();
}