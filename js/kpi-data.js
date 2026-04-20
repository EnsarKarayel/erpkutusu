 const KPI_DATA = [

  // ============================================================
  // ÜRETİM KPI'LARI
  // ============================================================
  {
    id: 'oee',
    kategori: 'Üretim',
    ad: 'OEE — Genel Ekipman Etkinliği',
    formul: 'Kullanılabilirlik × Performans × Kalite',
    detay: 'Üretim ekipmanlarının toplam etkinlik skoru. Dünya standartı hedef: %85+',
    hedef: '%85',
    hesaplayici: true,
    alanlar: [
      { id: 'kullanilabilirlik', label: 'Kullanılabilirlik (%)', aciklama: 'Planlı çalışma / Toplam planlı süre × 100', min: 0, max: 100 },
      { id: 'performans', label: 'Performans (%)', aciklama: 'Fiili üretim / Teorik max üretim × 100', min: 0, max: 100 },
      { id: 'kalite', label: 'Kalite (%)', aciklama: 'İyi parça / Toplam üretim × 100', min: 0, max: 100 }
    ],
    hesapla: (v) => {
      const oee = (v.kullanilabilirlik / 100) * (v.performans / 100) * (v.kalite / 100) * 100;
      return {
        sonuc: oee.toFixed(1) + '%',
        yorum: oee >= 85 ? 'Dünya standartı — Mükemmel!' :
               oee >= 65 ? 'Kabul edilebilir — İyileştirme mümkün' :
               'Kritik seviye — Acil aksiyon gerekli'
      };
    }
  },
  {
    id: 'takt-suresi',
    kategori: 'Üretim',
    ad: 'Takt Süresi',
    formul: 'Mevcut Üretim Süresi ÷ Müşteri Talebi',
    detay: 'Bir ürünü üretmek için gereken ideal süre. Lean üretimin temel metriği.',
    hedef: 'Müşteri talebine eşit',
    hesaplayici: true,
    alanlar: [
      { id: 'sure', label: 'Günlük Mevcut Süre (dakika)', aciklama: 'Molalar çıkarılmış net çalışma süresi', min: 1, max: 1440 },
      { id: 'talep', label: 'Günlük Müşteri Talebi (adet)', aciklama: 'Sipariş edilen ürün adedi', min: 1, max: 100000 }
    ],
    hesapla: (v) => ({
      sonuc: (v.sure / v.talep).toFixed(2) + ' dk/adet',
      yorum: 'Her ' + (v.sure / v.talep).toFixed(2) + ' dakikada bir ürün yetiştirilmeli.'
    })
  },
  {
    id: 'fire-orani',
    kategori: 'Üretim',
    ad: 'Fire / Hurda Oranı',
    formul: '(Toplam Üretim − İyi Ürün) ÷ Toplam Üretim × 100',
    detay: 'Üretimde kalite kayıplarının yüzdesi. Düşük olması hedeflenir.',
    hedef: '<%2',
    hesaplayici: true,
    alanlar: [
      { id: 'toplam', label: 'Toplam Üretim (adet)', aciklama: '', min: 1, max: 1000000 },
      { id: 'iyi', label: 'İyi Ürün (adet)', aciklama: 'Kalite kontrolünden geçen ürün', min: 0, max: 1000000 }
    ],
    hesapla: (v) => {
      const oran = ((v.toplam - v.iyi) / v.toplam * 100);
      return {
        sonuc: oran.toFixed(2) + '%',
        yorum: oran < 2 ? 'Hedef sağlandı' : oran < 5 ? 'İyileştirme gerekli' : 'Kritik — acil müdahale'
      };
    }
  },

  // ============================================================
  // FİNANS KPI'LARI
  // ============================================================
  {
    id: 'brut-kar',
    kategori: 'Finans',
    ad: 'Brüt Kar Marjı',
    formul: '(Net Satış − SMM) ÷ Net Satış × 100',
    detay: 'Üretim maliyeti çıkarıldıktan sonra kalan kar yüzdesi.',
    hedef: 'Sektöre göre değişir',
    hesaplayici: true,
    alanlar: [
      { id: 'satis', label: 'Net Satış (₺)', aciklama: 'İade ve iskonto düşülmüş net satış', min: 0, max: 1e12 },
      { id: 'smm', label: 'Satılan Malın Maliyeti (₺)', aciklama: 'Direkt malzeme + işçilik + genel imalat', min: 0, max: 1e12 }
    ],
    hesapla: (v) => ({
      sonuc: ((v.satis - v.smm) / v.satis * 100).toFixed(1) + '%',
      yorum: 'Net satışın ' + ((v.satis - v.smm) / v.satis * 100).toFixed(1) + '\'i brüt kar olarak kaldı.'
    })
  },
  {
    id: 'dso',
    kategori: 'Finans',
    ad: 'DSO — Günlük Satış Alacak',
    formul: 'Toplam Alacaklar ÷ Günlük Ortalama Satış',
    detay: 'Faturaların kaç günde tahsil edildiğini gösterir. Düşük olması daha iyidir.',
    hedef: '<30 gün',
    hesaplayici: true,
    alanlar: [
      { id: 'alacak', label: 'Toplam Alacaklar (₺)', aciklama: 'Bilançodaki ticari alacaklar', min: 0, max: 1e12 },
      { id: 'gsatis', label: 'Günlük Ortalama Satış (₺)', aciklama: 'Aylık satış / 30 gün', min: 1, max: 1e10 }
    ],
    hesapla: (v) => {
      const dso = Math.round(v.alacak / v.gsatis);
      return {
        sonuc: dso + ' gün',
        yorum: dso < 30 ? 'Mükemmel tahsilat performansı' : dso < 60 ? 'Normal seviye' : 'Tahsilat sorunu var!'
      };
    }
  },
  {
    id: 'likidite',
    kategori: 'Finans',
    ad: 'Cari Oran (Likidite)',
    formul: 'Dönen Varlıklar ÷ Kısa Vadeli Yükümlülükler',
    detay: 'Şirketin kısa vadeli borçlarını ödeme gücü. 1.5-2.0 arası idealdir.',
    hedef: '1.5 — 2.0',
    hesaplayici: true,
    alanlar: [
      { id: 'donen', label: 'Dönen Varlıklar (₺)', aciklama: 'Nakit + alacaklar + stoklar', min: 0, max: 1e12 },
      { id: 'kvb', label: 'Kısa Vadeli Borçlar (₺)', aciklama: '12 ay içinde ödenecek borçlar', min: 1, max: 1e12 }
    ],
    hesapla: (v) => {
      const oran = (v.donen / v.kvb).toFixed(2);
      return {
        sonuc: oran + 'x',
        yorum: oran >= 1.5 && oran <= 2.0 ? 'İdeal aralıkta' :
               oran < 1 ? 'Likidite riski var!' :
               oran > 2 ? 'Varlıklar verimsiz kullanılıyor olabilir' : 'Kabul edilebilir'
      };
    }
  },

  // ============================================================
  // TEDARİK ZİNCİRİ KPI'LARI
  // ============================================================
  {
    id: 'stok-devir',
    kategori: 'Tedarik Zinciri',
    ad: 'Stok Devir Hızı',
    formul: 'Satılan Malın Maliyeti ÷ Ortalama Stok Değeri',
    detay: 'Stokların kaç kez yenilendiğini gösterir. Yüksek değer daha iyidir.',
    hedef: 'Sektöre göre 4-12x',
    hesaplayici: true,
    alanlar: [
      { id: 'smm', label: 'Satılan Malın Maliyeti (₺)', aciklama: 'Dönem SMM', min: 0, max: 1e12 },
      { id: 'stok', label: 'Ortalama Stok Değeri (₺)', aciklama: '(Dönem başı + dönem sonu) / 2', min: 1, max: 1e12 }
    ],
    hesapla: (v) => ({
      sonuc: (v.smm / v.stok).toFixed(2) + 'x',
      yorum: 'Stoklar yılda ' + (v.smm / v.stok).toFixed(2) + ' kez yenilendi.'
    })
  },
  {
    id: 'zamaninda-teslimat',
    kategori: 'Tedarik Zinciri',
    ad: 'Zamanında Teslimat Oranı (OTIF)',
    formul: 'Zamanında Teslim ÷ Toplam Sipariş × 100',
    detay: 'Müşteri siparişlerinin söz verilen tarihte ve eksiksiz teslim yüzdesi.',
    hedef: '>%95',
    hesaplayici: true,
    alanlar: [
      { id: 'zamaninda', label: 'Zamanında Teslim (adet)', aciklama: '', min: 0, max: 1000000 },
      { id: 'toplam', label: 'Toplam Sipariş (adet)', aciklama: '', min: 1, max: 1000000 }
    ],
    hesapla: (v) => {
      const oran = (v.zamaninda / v.toplam * 100).toFixed(1);
      return {
        sonuc: oran + '%',
        yorum: oran >= 95 ? 'Mükemmel OTIF performansı' : oran >= 85 ? 'Geliştirme alanı var' : 'Müşteri memnuniyeti riski!'
      };
    }
  }
];
