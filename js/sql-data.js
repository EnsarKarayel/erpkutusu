 const SQL_DATA = [

  // ============================================================
  // LOGO TIGER / GO
  // ============================================================
  {
    id: 'logo-001',
    baslik: 'Stok Devir Hızı Raporu',
    erp: 'Logo',
    kategori: 'Stok',
    zorluk: 'orta',
    aciklama: 'Son 3 ay stok devir hızı analizi — satılan malın maliyeti / ortalama stok',
    kod: `SELECT
  s.STOKKODU,
  s.STOKADI,
  SUM(h.MIKTAR)          AS TOPLAM_SATIS,
  AVG(s.BAKIYE)          AS ORT_STOK,
  ROUND(
    SUM(h.MIKTAR) / NULLIF(AVG(s.BAKIYE), 0), 2
  )                      AS DEVIR_HIZI
FROM LG_STOK s
LEFT JOIN LG_HAREKET h ON s.LOGICALREF = h.STOCKREF
WHERE h.DATE_ >= DATEADD(month, -3, GETDATE())
GROUP BY s.STOKKODU, s.STOKADI
ORDER BY DEVIR_HIZI DESC`
  },
  {
    id: 'logo-002',
    baslik: 'Vadesi Geçen Alacaklar',
    erp: 'Logo',
    kategori: 'Finans',
    zorluk: 'kolay',
    aciklama: '30 günden eski tahsilatsız faturalar — müşteri bazında gecikme analizi',
    kod: `SELECT
  c.UNVAN                                          AS MUSTERI,
  f.FISNO                                          AS FATURA_NO,
  CONVERT(varchar,f.DATE_,104)                     AS TARIH,
  f.TOTALDISCOUNTED                                AS TUTAR,
  DATEDIFF(day, f.DATE_, GETDATE())                AS GECEN_GUN
FROM LG_CLCARD c
JOIN LG_INVOICE f ON c.LOGICALREF = f.CLIENTREF
WHERE f.TRCODE    = 8
  AND f.CANCELLED = 0
  AND DATEDIFF(day, f.DATE_, GETDATE()) > 30
ORDER BY GECEN_GUN DESC`
  },
  {
    id: 'logo-003',
    baslik: 'En Çok Satan Ürünler (Top 20)',
    erp: 'Logo',
    kategori: 'Satış',
    zorluk: 'kolay',
    aciklama: 'Cari ay en çok satılan 20 ürün — miktar ve tutar bazında',
    kod: `SELECT TOP 20
  s.STOKKODU,
  s.STOKADI,
  SUM(h.MIKTAR)          AS TOPLAM_MIKTAR,
  SUM(h.LINENET)         AS TOPLAM_TUTAR,
  COUNT(DISTINCT h.INVOICEREF) AS FATURA_SAYISI
FROM LG_STOK s
JOIN LG_HAREKET h ON s.LOGICALREF = h.STOCKREF
WHERE h.TRCODE IN (7,8)
  AND MONTH(h.DATE_) = MONTH(GETDATE())
  AND YEAR(h.DATE_)  = YEAR(GETDATE())
GROUP BY s.STOKKODU, s.STOKADI
ORDER BY TOPLAM_TUTAR DESC`
  },
  {
    id: 'logo-004',
    baslik: 'Negatif Stok Kontrolü',
    erp: 'Logo',
    kategori: 'Stok',
    zorluk: 'kolay',
    aciklama: 'Bakiyesi sıfırın altına düşen stok kalemlerini listeler',
    kod: `SELECT
  s.STOKKODU,
  s.STOKADI,
  s.BAKIYE              AS MEVCUT_STOK,
  s.BIRIM               AS BIRIM
FROM LG_STOK s
WHERE s.BAKIYE < 0
  AND s.ACTIVE = 0
ORDER BY s.BAKIYE ASC`
  },
  {
    id: 'logo-005',
    baslik: 'Müşteri Ciro Analizi',
    erp: 'Logo',
    kategori: 'Satış',
    zorluk: 'orta',
    aciklama: 'Yıllık bazda müşteri cirosunu dönem dönem karşılaştır',
    kod: `SELECT
  c.UNVAN                                AS MUSTERI,
  SUM(CASE WHEN YEAR(f.DATE_) = YEAR(GETDATE())
           THEN f.TOTALDISCOUNTED END)   AS BU_YIL,
  SUM(CASE WHEN YEAR(f.DATE_) = YEAR(GETDATE())-1
           THEN f.TOTALDISCOUNTED END)   AS GECEN_YIL,
  ROUND(
    (SUM(CASE WHEN YEAR(f.DATE_) = YEAR(GETDATE())
              THEN f.TOTALDISCOUNTED END)
    - SUM(CASE WHEN YEAR(f.DATE_) = YEAR(GETDATE())-1
               THEN f.TOTALDISCOUNTED END))
    / NULLIF(SUM(CASE WHEN YEAR(f.DATE_) = YEAR(GETDATE())-1
                      THEN f.TOTALDISCOUNTED END), 0) * 100, 1
  )                                      AS DEGISIM_PCT
FROM LG_CLCARD c
JOIN LG_INVOICE f ON c.LOGICALREF = f.CLIENTREF
WHERE f.TRCODE = 8 AND f.CANCELLED = 0
GROUP BY c.UNVAN
ORDER BY BU_YIL DESC`
  },

  // ============================================================
  // SAP B1 / SAP HANA
  // ============================================================
  {
    id: 'sap-001',
    baslik: 'Departman Maliyet Merkezi',
    erp: 'SAP',
    kategori: 'Finans',
    zorluk: 'orta',
    aciklama: 'Yıl ve dönem bazında maliyet merkezi harcama dağılımı',
    kod: `SELECT
  kostl                  AS MALIYET_MERKEZI,
  ktext                  AS ACIKLAMA,
  SUM(wkgbtr)            AS TOPLAM_MALIYET,
  gjahr                  AS YIL,
  poper                  AS DONEM
FROM COSP
JOIN CSKT ON COSP.kostl = CSKT.kostl
WHERE gjahr    = YEAR(GETDATE())
  AND CSKT.spras = 'TR'
GROUP BY kostl, ktext, gjahr, poper
ORDER BY TOPLAM_MALIYET DESC`
  },
  {
    id: 'sap-002',
    baslik: 'Açık Satın Alma Siparişleri',
    erp: 'SAP',
    kategori: 'Satın Alma',
    zorluk: 'orta',
    aciklama: 'Henüz teslim alınmamış satın alma siparişleri ve beklenen teslimat tarihleri',
    kod: `SELECT
  T0.DocNum              AS SIPARIS_NO,
  T0.CardName            AS TEDARIKCI,
  T0.DocDate             AS SIPARIS_TARIHI,
  T0.DocDueDate          AS BEKLENEN_TESLIMAT,
  T0.DocTotal            AS TOPLAM_TUTAR,
  T0.DocCur              AS PARA_BIRIMI,
  DATEDIFF(day, T0.DocDueDate, GETDATE()) AS GECIKME_GUN
FROM OPOR T0
WHERE T0.DocStatus = 'O'
  AND T0.CANCELED  = 'N'
ORDER BY GECIKME_GUN DESC`
  },
  {
    id: 'sap-003',
    baslik: 'Stok Yaşlandırma Analizi',
    erp: 'SAP',
    kategori: 'Stok',
    zorluk: 'zor',
    aciklama: 'Stokların yaşına göre gruplandırılması — 0-30, 31-60, 61-90, 90+ gün',
    kod: `SELECT
  T0.ItemCode            AS STOK_KODU,
  T0.ItemName            AS STOK_ADI,
  SUM(CASE WHEN DATEDIFF(day,T1.InDate,GETDATE()) BETWEEN 0  AND 30  THEN T1.OnHand END) AS GUN_0_30,
  SUM(CASE WHEN DATEDIFF(day,T1.InDate,GETDATE()) BETWEEN 31 AND 60  THEN T1.OnHand END) AS GUN_31_60,
  SUM(CASE WHEN DATEDIFF(day,T1.InDate,GETDATE()) BETWEEN 61 AND 90  THEN T1.OnHand END) AS GUN_61_90,
  SUM(CASE WHEN DATEDIFF(day,T1.InDate,GETDATE()) > 90               THEN T1.OnHand END) AS GUN_90_UZERI
FROM OITM T0
JOIN OITW T1 ON T0.ItemCode = T1.ItemCode
WHERE T1.OnHand > 0
GROUP BY T0.ItemCode, T0.ItemName
ORDER BY GUN_90_UZERI DESC NULLS LAST`
  },

  // ============================================================
  // IFS CLOUD / IFS APPS
  // ============================================================
  {
    id: 'ifs-001',
    baslik: 'Üretim Fiili vs Planlanan',
    erp: 'IFS',
    kategori: 'Üretim',
    zorluk: 'orta',
    aciklama: 'Açık iş emirleri tamamlanma oranı ve gecikme analizi',
    kod: `SELECT
  wo.WO_NO,
  wo.PART_NO,
  wo.QTY_DEMAND          AS PLANLANAN,
  wo.QTY_COMPLETE        AS TAMAMLANAN,
  ROUND(
    wo.QTY_COMPLETE * 100.0
    / NULLIF(wo.QTY_DEMAND, 0), 1
  )                      AS TAMAMLANMA_PCT,
  wo.PLAN_FINISH         AS PLANLANAN_BITIS,
  CASE
    WHEN wo.PLAN_FINISH < SYSDATE AND wo.OBJSTATE = 'Released'
    THEN 'GECİKMİŞ'
    ELSE 'ZAMANINDA'
  END                    AS DURUM
FROM SHOP_ORD wo
WHERE wo.OBJSTATE = 'Released'
ORDER BY wo.PLAN_FINISH ASC`
  },
  {
    id: 'ifs-002',
    baslik: 'Malzeme İhtiyaç Planı (MRP)',
    erp: 'IFS',
    kategori: 'Üretim',
    zorluk: 'zor',
    aciklama: 'Açık üretim emirlerine göre eksik malzeme ihtiyacı',
    kod: `SELECT
  mr.PART_NO,
  mr.DESCRIPTION,
  SUM(mr.QTY_REQUIRED)   AS IHTIYAC,
  SUM(mr.QTY_ON_HAND)    AS MEVCUT_STOK,
  SUM(mr.QTY_REQUIRED)
    - SUM(mr.QTY_ON_HAND) AS EKSIK_MIKTAR,
  mr.UNIT_MEAS
FROM MANUF_STRUCT mr
JOIN SHOP_ORD so ON mr.WO_NO = so.WO_NO
WHERE so.OBJSTATE = 'Released'
  AND mr.QTY_REQUIRED > mr.QTY_ON_HAND
GROUP BY mr.PART_NO, mr.DESCRIPTION, mr.UNIT_MEAS
ORDER BY EKSIK_MIKTAR DESC`
  },

  // ============================================================
  // ODOO (PostgreSQL)
  // ============================================================
  {
    id: 'odoo-001',
    baslik: 'Satış Siparişi Özeti',
    erp: 'Odoo',
    kategori: 'Satış',
    zorluk: 'kolay',
    aciklama: 'Onaylı satış siparişlerini müşteri ve durum bazında listeler',
    kod: `SELECT
  so.name                AS SIPARIS_NO,
  rp.name                AS MUSTERI,
  so.date_order::date    AS SIPARIS_TARIHI,
  so.amount_total        AS TOPLAM_TUTAR,
  so.currency_id,
  so.state               AS DURUM
FROM sale_order so
JOIN res_partner rp ON so.partner_id = rp.id
WHERE so.state IN ('sale', 'done')
  AND so.date_order >= NOW() - INTERVAL '30 days'
ORDER BY so.amount_total DESC;`
  },
  {
    id: 'odoo-002',
    baslik: 'Stok Hareketi Raporu',
    erp: 'Odoo',
    kategori: 'Stok',
    zorluk: 'orta',
    aciklama: 'Ürün bazında giriş/çıkış hareketleri ve net değişim',
    kod: `SELECT
  pt.name                AS URUN,
  pp.default_code        AS STOK_KODU,
  SUM(CASE WHEN sm.location_dest_id = sl_in.id
           THEN sm.product_uom_qty END) AS GIRIS,
  SUM(CASE WHEN sm.location_id = sl_out.id
           THEN sm.product_uom_qty END) AS CIKIS,
  SUM(CASE WHEN sm.location_dest_id = sl_in.id
           THEN sm.product_uom_qty
           ELSE -sm.product_uom_qty END) AS NET
FROM stock_move sm
JOIN product_product pp   ON sm.product_id = pp.id
JOIN product_template pt  ON pp.product_tmpl_id = pt.id
JOIN stock_location sl_in  ON sl_in.usage = 'internal'
JOIN stock_location sl_out ON sl_out.usage = 'internal'
WHERE sm.state = 'done'
  AND sm.date >= NOW() - INTERVAL '3 months'
GROUP BY pt.name, pp.default_code
ORDER BY NET DESC;`
  },
  {
    id: 'odoo-003',
    baslik: 'Gecikmiş Faturalar',
    erp: 'Odoo',
    kategori: 'Finans',
    zorluk: 'kolay',
    aciklama: 'Vadesi geçmiş ödenmemiş müşteri faturaları',
    kod: `SELECT
  ai.name                AS FATURA_NO,
  rp.name                AS MUSTERI,
  ai.invoice_date        AS FATURA_TARIHI,
  ai.invoice_date_due    AS VADE_TARIHI,
  ai.amount_residual     AS KALAN_TUTAR,
  NOW()::date - ai.invoice_date_due AS GECIKME_GUN
FROM account_move ai
JOIN res_partner rp ON ai.partner_id = rp.id
WHERE ai.move_type    = 'out_invoice'
  AND ai.state        = 'posted'
  AND ai.payment_state != 'paid'
  AND ai.invoice_date_due < NOW()
ORDER BY GECIKME_GUN DESC;`
  },

  // ============================================================
  // PLANTUM (Minerva Şirketi)
  // ============================================================
  {
    id: 'plantum-001',
    baslik: 'Üretim Emri Durum Raporu',
    erp: 'Plantum',
    kategori: 'Üretim',
    zorluk: 'orta',
    aciklama: 'Plantum üretim emirlerinin mevcut durumu ve tamamlanma yüzdesi',
    kod: `SELECT
  ue.URETIM_EMRI_NO,
  ue.MAMUL_KODU,
  ue.MAMUL_ADI,
  ue.PLANLANAN_MIKTAR,
  ue.URETILEN_MIKTAR,
  ROUND(
    CAST(ue.URETILEN_MIKTAR AS FLOAT)
    / NULLIF(ue.PLANLANAN_MIKTAR, 0) * 100, 1
  )                      AS TAMAMLANMA_PCT,
  ue.BASLAMA_TARIHI,
  ue.BITIS_TARIHI,
  ue.DURUM
FROM PLT_URETIM_EMRI ue
WHERE ue.DURUM NOT IN ('KAPALI', 'IPTAL')
ORDER BY ue.BITIS_TARIHI ASC`
  },
  {
    id: 'plantum-002',
    baslik: 'Hammadde Tüketim Analizi',
    erp: 'Plantum',
    kategori: 'Üretim',
    zorluk: 'orta',
    aciklama: 'Üretim emirlerine göre hammadde planlanan vs fiili tüketim karşılaştırması',
    kod: `SELECT
  r.RECETE_KODU,
  r.HAMMADDE_KODU,
  r.HAMMADDE_ADI,
  SUM(r.PLANLANAN_MIKTAR) AS PLANLANAN,
  SUM(f.FIILI_MIKTAR)     AS FIILI,
  SUM(f.FIILI_MIKTAR)
    - SUM(r.PLANLANAN_MIKTAR) AS SAPMA,
  ROUND(
    (SUM(f.FIILI_MIKTAR) - SUM(r.PLANLANAN_MIKTAR))
    / NULLIF(SUM(r.PLANLANAN_MIKTAR),0) * 100, 2
  )                       AS SAPMA_PCT
FROM PLT_RECETE r
LEFT JOIN PLT_FIILI_TUKETIM f
       ON r.RECETE_KODU = f.RECETE_KODU
      AND r.HAMMADDE_KODU = f.HAMMADDE_KODU
GROUP BY r.RECETE_KODU, r.HAMMADDE_KODU, r.HAMMADDE_ADI
ORDER BY ABS(SAPMA_PCT) DESC`
  },

  // ============================================================
  // MİNERVA ERP
  // ============================================================
  {
    id: 'minerva-001',
    baslik: 'Cari Hesap Bakiye Listesi',
    erp: 'Minerva',
    kategori: 'Finans',
    zorluk: 'kolay',
    aciklama: 'Müşteri ve tedarikçi cari hesaplarının güncel bakiye durumu',
    kod: `SELECT
  c.CARI_KOD,
  c.CARI_UNVAN,
  c.CARI_TIP              AS TIP,
  SUM(CASE WHEN h.BORC_ALACAK = 'B'
           THEN h.TUTAR END) AS TOPLAM_BORC,
  SUM(CASE WHEN h.BORC_ALACAK = 'A'
           THEN h.TUTAR END) AS TOPLAM_ALACAK,
  SUM(CASE WHEN h.BORC_ALACAK = 'B'
           THEN h.TUTAR
           ELSE -h.TUTAR END) AS BAKIYE
FROM MNR_CARI c
JOIN MNR_CARI_HAREKET h ON c.CARI_KOD = h.CARI_KOD
WHERE h.TARIH <= GETDATE()
  AND c.AKTIF = 1
GROUP BY c.CARI_KOD, c.CARI_UNVAN, c.CARI_TIP
HAVING SUM(CASE WHEN h.BORC_ALACAK = 'B'
                THEN h.TUTAR
                ELSE -h.TUTAR END) <> 0
ORDER BY ABS(BAKIYE) DESC`
  },
  {
    id: 'minerva-002',
    baslik: 'Fatura Bazında KDV Raporu',
    erp: 'Minerva',
    kategori: 'Finans',
    zorluk: 'orta',
    aciklama: 'Dönem bazında KDV beyanname hazırlığı için satış/alış KDV özeti',
    kod: `SELECT
  MONTH(f.TARIH)         AS AY,
  YEAR(f.TARIH)          AS YIL,
  f.FATURA_TIP,
  SUM(f.MATRAH)          AS TOPLAM_MATRAH,
  SUM(f.KDV_TUTARI)      AS TOPLAM_KDV,
  SUM(f.TOPLAM)          AS GENEL_TOPLAM,
  COUNT(*)               AS FATURA_ADET
FROM MNR_FATURA f
WHERE f.TARIH BETWEEN
  DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
  AND GETDATE()
  AND f.IPTAL = 0
GROUP BY MONTH(f.TARIH), YEAR(f.TARIH), f.FATURA_TIP
ORDER BY YIL, AY, f.FATURA_TIP`
  },

  // ============================================================
  // GENEL / MSSQL YARDIMCI SORGULAR
  // ============================================================
  {
    id: 'genel-001',
    baslik: 'Tablo Boyutlarını Listele',
    erp: 'Genel',
    kategori: 'Sistem',
    zorluk: 'kolay',
    aciklama: 'Veritabanındaki tüm tabloların satır sayısı ve disk kullanımı',
    kod: `SELECT
  t.NAME                 AS TABLO_ADI,
  p.rows                 AS SATIR_SAYISI,
  ROUND(
    (SUM(a.total_pages) * 8) / 1024.0, 2
  )                      AS TOPLAM_MB,
  ROUND(
    (SUM(a.used_pages) * 8) / 1024.0, 2
  )                      AS KULLANILAN_MB
FROM sys.tables t
JOIN sys.indexes i     ON t.OBJECT_ID = i.object_id
JOIN sys.partitions p  ON i.object_id = p.OBJECT_ID
                      AND i.index_id  = p.index_id
JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE t.is_ms_shipped = 0
GROUP BY t.NAME, p.rows
ORDER BY SATIR_SAYISI DESC`
  },
  {
    id: 'genel-002',
    baslik: 'Yavaş Sorguları Tespit Et',
    erp: 'Genel',
    kategori: 'Sistem',
    zorluk: 'zor',
    aciklama: 'SQL Server üzerinde en yavaş çalışan sorguları bul ve optimize et',
    kod: `SELECT TOP 20
  SUBSTRING(qt.TEXT,
    (qs.statement_start_offset/2) + 1,
    ((CASE qs.statement_end_offset
      WHEN -1 THEN DATALENGTH(qt.TEXT)
      ELSE qs.statement_end_offset
      END - qs.statement_start_offset)/2) + 1
  )                      AS SORGU_METNI,
  qs.execution_count     AS CALISMA_SAYISI,
  qs.total_elapsed_time
    / qs.execution_count AS ORT_SURE_MS,
  qs.total_logical_reads
    / qs.execution_count AS ORT_OKUMA,
  qs.total_worker_time
    / qs.execution_count AS ORT_CPU
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY ORT_SURE_MS DESC`
  },
  
];
