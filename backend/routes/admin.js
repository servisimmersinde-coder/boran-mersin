const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Kullanici, Kurye, Isletme, Siparis, FinansalIslem, SiparisDurumLog } = require('../models');
const { auth, yetki } = require('../middleware/auth');

// Dashboard
router.get('/dashboard', auth, yetki('admin'), async (req, res) => {
  try {
    const toplamKurye = await Kurye.count();
    const musaitKurye = await Kurye.count({ where: { musait: true } });
    const toplamIsletme = await Isletme.count();
    const aktifSiparis = await Siparis.count({ where: { durum: { [Op.in]: ['bekliyor', 'atandi', 'alindi', 'yolda'] } } });
    const tamamlananSiparis = await Siparis.count({ where: { durum: 'teslim' } });
    const toplamGelir = await FinansalIslem.sum('tutar', { where: { tip: 'komisyon' } });

    // Son 7 gunun siparisleri
    const gunlukSiparisler = [];
    for (let i = 6; i >= 0; i--) {
      const tarih = new Date();
      tarih.setDate(tarih.getDate() - i);
      const gunBaslangic = new Date(tarih.setHours(0, 0, 0, 0));
      const gunBitis = new Date(tarih.setHours(23, 59, 59, 999));

      const sayi = await Siparis.count({
        where: {
          olusturma_tarihi: { [Op.between]: [gunBaslangic, gunBitis] }
        }
      });

      gunlukSiparisler.push({
        tarih: gunBaslangic.toISOString().split('T')[0],
        sayi
      });
    }

    res.json({
      istatistikler: {
        toplam_kurye: toplamKurye,
        musait_kurye: musaitKurye,
        toplam_isletme: toplamIsletme,
        aktif_siparis: aktifSiparis,
        tamamlanan_siparis: tamamlananSiparis,
        toplam_gelir: toplamGelir || 0
      },
      gunluk_siparisler: gunlukSiparisler
    });
  } catch (hata) {
    res.status(500).json({ hata: 'Dashboard verileri alinamadi' });
  }
});

// Kurye listesi
router.get('/kuryeler', auth, yetki('admin'), async (req, res) => {
  try {
    const kuryeler = await Kurye.findAll({
      include: [{ model: Kullanici, as: 'kullanici', attributes: ['ad_soyad', 'telefon', 'durum', 'son_giris'] }],
      order: [['puan', 'DESC']]
    });
    res.json(kuryeler);
  } catch (hata) {
    res.status(500).json({ hata: 'Kuryeler alinamadi' });
  }
});

// Kurye durum degistirme
router.put('/kurye/:id', auth, yetki('admin'), async (req, res) => {
  try {
    const kurye = await Kurye.findByPk(req.params.id, {
      include: [{ model: Kullanici, as: 'kullanici' }]
    });

    if (!kurye) {
      return res.status(404).json({ hata: 'Kurye bulunamadi' });
    }

    const { durum, musait, puan } = req.body;

    if (durum) {
      await kurye.kullanici.update({ durum });
    }
    if (typeof musait === 'boolean') {
      await kurye.update({ musait });
    }
    if (puan !== undefined) {
      await kurye.update({ puan });
    }

    res.json({ mesaj: 'Kurye guncellendi', kurye });
  } catch (hata) {
    res.status(500).json({ hata: 'Kurye guncellenemedi' });
  }
});

// Isletme listesi
router.get('/isletmeler', auth, yetki('admin'), async (req, res) => {
  try {
    const isletmeler = await Isletme.findAll({
      include: [{ model: Kullanici, as: 'kullanici', attributes: ['ad_soyad', 'telefon', 'durum'] }],
      order: [['isletme_adi', 'ASC']]
    });
    res.json(isletmeler);
  } catch (hata) {
    res.status(500).json({ hata: 'Isletmeler alinamadi' });
  }
});

// Isletme durum degistirme
router.put('/isletme/:id', auth, yetki('admin'), async (req, res) => {
  try {
    const isletme = await Isletme.findByPk(req.params.id, {
      include: [{ model: Kullanici, as: 'kullanici' }]
    });

    if (!isletme) {
      return res.status(404).json({ hata: 'Isletme bulunamadi' });
    }

    const { durum } = req.body;
    if (durum) {
      await isletme.kullanici.update({ durum });
    }

    res.json({ mesaj: 'Isletme guncellendi', isletme });
  } catch (hata) {
    res.status(500).json({ hata: 'Isletme guncellenemedi' });
  }
});

// Tum siparisler
router.get('/siparisler', auth, yetki('admin'), async (req, res) => {
  try {
    const { durum, sayfa = 1, limit = 20 } = req.query;
    const where = {};
    if (durum) where.durum = durum;

    const siparisler = await Siparis.findAndCountAll({
      where,
      include: [
        { model: Isletme, as: 'isletme', attributes: ['isletme_adi'] },
        {
          model: Kurye,
          as: 'kurye',
          include: [{ model: Kullanici, as: 'kullanici', attributes: ['ad_soyad'] }]
        }
      ],
      order: [['olusturma_tarihi', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(sayfa) - 1) * parseInt(limit)
    });

    res.json({
      siparisler: siparisler.rows,
      toplam: siparisler.count
    });
  } catch (hata) {
    res.status(500).json({ hata: 'Siparisler alinamadi' });
  }
});

// Siparis detay + timeline
router.get('/siparis/:id', auth, yetki('admin'), async (req, res) => {
  try {
    const siparis = await Siparis.findByPk(req.params.id, {
      include: [
        { model: Isletme, as: 'isletme', attributes: ['isletme_adi', 'adres'] },
        {
          model: Kurye,
          as: 'kurye',
          include: [{ model: Kullanici, as: 'kullanici', attributes: ['ad_soyad', 'telefon'] }]
        }
      ]
    });

    if (!siparis) return res.status(404).json({ hata: 'Siparis bulunamadi' });

    const durumLoglari = await SiparisDurumLog.findAll({
      where: { siparis_id: siparis.id },
      include: [{ model: Kurye, as: 'kurye', include: [{ model: Kullanici, as: 'kullanici', attributes: ['ad_soyad'] }] }],
      order: [['tiklama_zamani', 'ASC']]
    });

    const durumMetinleri = {
      siparis_alindi: 'Siparis Alindi',
      isletmede_bekleniyor: 'Isletmede Bekleniyor',
      isletmeden_alindi: 'Isletmeden Alindi',
      musteri_yolunda: 'Musteri Yolunda',
      musteri_de: 'Musteride',
      teslim_edildi: 'Teslim Edildi',
      iptal: 'Iptal Edildi'
    };

    const timeline = durumLoglari.map((log, index) => {
      let sure_dk = null;
      let sure_sn = null;
      if (index > 0) {
        const onceki = new Date(durumLoglari[index - 1].tiklama_zamani).getTime();
        const suanki = new Date(log.tiklama_zamani).getTime();
        sure_sn = Math.round((suanki - onceki) / 1000);
        sure_dk = Math.round(sure_sn / 60);
      }
      return {
        durum: log.durum,
        durum_adi: durumMetinleri[log.durum] || log.durum,
        aciklama: log.aciklama,
        tiklama_zamani: log.tiklama_zamani,
        sure_dk,
        sure_sn,
        kurye_adi: log.kurye && log.kurye.kullanici ? log.kurye.kullanici.ad_soyad : null
      };
    });

    let toplamSure_dk = null;
    let toplamSure_sn = null;
    if (siparis.olusturma_tarihi && siparis.teslim_tarihi) {
      toplamSure_sn = Math.round((new Date(siparis.teslim_tarihi).getTime() - new Date(siparis.olusturma_tarihi).getTime()) / 1000);
      toplamSure_dk = Math.round(toplamSure_sn / 60);
    } else if (siparis.olusturma_tarihi) {
      toplamSure_sn = Math.round((new Date().getTime() - new Date(siparis.olusturma_tarihi).getTime()) / 1000);
      toplamSure_dk = Math.round(toplamSure_sn / 60);
    }

    res.json({ ...siparis.toJSON(), timeline, toplam_sure_dk: toplamSure_dk, toplam_sure_sn: toplamSure_sn });
  } catch (hata) {
    console.error('Siparis detay hatasi:', hata.message);
    res.status(500).json({ hata: 'Siparis detayi alinamadi' });
  }
});

// Finansal raporlar
router.get('/finansal', auth, yetki('admin'), async (req, res) => {
  try {
    const { baslangic, bitis } = req.query;

    const where = {};
    if (baslangic && bitis) {
      where.olusturma_tarihi = {
        [Op.between]: [new Date(baslangic), new Date(bitis)]
      };
    }

    const toplamGelir = await FinansalIslem.sum('tutar', { where: { ...where, tip: 'komisyon' } });
    const toplamOdeme = await FinansalIslem.sum('tutar', { where: { ...where, tip: 'odeme' } });
    const toplamKuryeKazanc = await FinansalIslem.sum('tutar', { where: { ...where, tip: 'kazanc' } });

    const sonIslemler = await FinansalIslem.findAll({
      where,
      include: [
        { model: Kullanici, as: 'kullanici', attributes: ['ad_soyad', 'rol'] },
        { model: Siparis, as: 'siparis', attributes: ['siparis_no'] }
      ],
      order: [['olusturma_tarihi', 'DESC']],
      limit: 50
    });

    res.json({
      toplam_gelir: toplamGelir || 0,
      toplam_odeme: toplamOdeme || 0,
      toplam_kurye_kazanc: toplamKuryeKazanc || 0,
      son_islemler: sonIslemler
    });
  } catch (hata) {
    console.error('Finansal rapor hatasi:', hata.message, hata.stack);
    res.status(500).json({ hata: 'Finansal raporlar alinamadi' });
  }
});

// Tum kullanici listesi (admin hariic)
router.get('/kullanicilar', auth, yetki('admin'), async (req, res) => {
  try {
    const kullanicilar = await Kullanici.findAll({
      attributes: { exclude: ['sifre_hash'] },
      order: [['olusturma_tarihi', 'DESC']]
    });
    res.json(kullanicilar);
  } catch (hata) {
    res.status(500).json({ hata: 'Kullanicilar alinamadi' });
  }
});

// Siparise manuel kurye atama
router.put('/siparis/:id/atama', auth, yetki('admin'), async (req, res) => {
  try {
    const { kurye_id } = req.body;
    const siparis = await Siparis.findByPk(req.params.id);

    if (!siparis) {
      return res.status(404).json({ hata: 'Siparis bulunamadi' });
    }

    if (kurye_id) {
      const kurye = await Kurye.findByPk(kurye_id);
      if (!kurye) {
        return res.status(404).json({ hata: 'Kurye bulunamadi' });
      }
      await siparis.update({ kurye_id, durum: 'atandi' });
      await kurye.update({ kurye_durum: 'siparis_aldi', musait: false, aktif_siparis_id: siparis.id });

      await SiparisDurumLog.create({
        siparis_id: siparis.id,
        kurye_id: kurye.id,
        durum: 'siparis_alindi',
        aciklama: 'Admin tarafindan kurye atandı',
        tiklama_zamani: new Date()
      });

      res.json({ mesaj: `Siparis ${kurye_id} numarali kuryeye atandı`, siparis });
    } else {
      const eskiKurye = siparis.kurye_id ? await Kurye.findByPk(siparis.kurye_id) : null;
      await siparis.update({ kurye_id: null, durum: 'bekliyor' });
      if (eskiKurye) {
        await eskiKurye.update({ kurye_durum: 'bos', musait: true, aktif_siparis_id: null });
      }
      res.json({ mesaj: 'Kurye atamasi kaldirildi', siparis });
    }
  } catch (hata) {
    console.error('Kurye atama hatasi:', hata);
    res.status(500).json({ hata: 'Kurye atama yapilamadi' });
  }
});

// Musait kurye listesi (atama icin)
router.get('/musait-kuryeler', auth, yetki('admin'), async (req, res) => {
  try {
    const kuryeler = await Kurye.findAll({
      where: { musait: true },
      include: [{ model: Kullanici, as: 'kullanici', attributes: ['id', 'ad_soyad', 'telefon', 'durum'] }],
      order: [['puan', 'DESC']]
    });
    res.json(kuryeler);
  } catch (hata) {
    res.status(500).json({ hata: 'Kuryeler alinamadi' });
  }
});

// Kurye musaitlik admin tarafindan degistirme
router.put('/kurye/:id/musaitlik', auth, yetki('admin'), async (req, res) => {
  try {
    const kurye = await Kurye.findByPk(req.params.id);
    if (!kurye) {
      return res.status(404).json({ hata: 'Kurye bulunamadi' });
    }

    await kurye.update({ musait: req.body.musait });
    res.json({ mesaj: 'Musaitlik guncellendi', kurye });
  } catch (hata) {
    res.status(500).json({ hata: 'Musaitlik guncellenemedi' });
  }
});

// Kurye slot/calisma saati guncelleme
router.put('/kurye/:id/slot', auth, yetki('admin'), async (req, res) => {
  try {
    const kurye = await Kurye.findByPk(req.params.id);
    if (!kurye) return res.status(404).json({ hata: 'Kurye bulunamadi' });

    const { calisma_baslangic, calisma_bitis, gunler, mola_suresi_dk } = req.body;
    const guncelleme = {};
    if (calisma_baslangic !== undefined) guncelleme.calisma_baslangic = calisma_baslangic;
    if (calisma_bitis !== undefined) guncelleme.calisma_bitis = calisma_bitis;
    if (gunler !== undefined) guncelleme.gunler = gunler;
    if (mola_suresi_dk !== undefined) guncelleme.mola_suresi_dk = mola_suresi_dk;

    await kurye.update(guncelleme);
    res.json({ mesaj: 'Slot guncellendi', kurye });
  } catch (hata) {
    res.status(500).json({ hata: 'Slot guncellenemedi' });
  }
});

// Kurye mola durumu
router.put('/kurye/:id/mola', auth, yetki('admin'), async (req, res) => {
  try {
    const kurye = await Kurye.findByPk(req.params.id);
    if (!kurye) return res.status(404).json({ hata: 'Kurye bulunamadi' });

    const { mola } = req.body;
    if (mola) {
      await kurye.update({ kurye_durum: 'mola', mola_baslangic: new Date(), musait: false });
    } else {
      const molaSuresi = kurye.mola_baslangic ? Math.round((Date.now() - new Date(kurye.mola_baslangic).getTime()) / 60000) : 0;
      await kurye.update({
        kurye_durum: 'bos',
        mola_baslangic: null,
        toplam_mola_dk: kurye.toplam_mola_dk + molaSuresi,
        musait: true
      });
    }
    res.json({ mesaj: mola ? 'Mola baslatildi' : 'Mola bitirildi', kurye });
  } catch (hata) {
    res.status(500).json({ hata: 'Mola islemi yapilamadi' });
  }
});

// Kurye meşguliyet durumu guncelleme
router.put('/kurye/:id/durum', auth, yetki('admin'), async (req, res) => {
  try {
    const kurye = await Kurye.findByPk(req.params.id);
    if (!kurye) return res.status(404).json({ hata: 'Kurye bulunamadi' });

    const { kurye_durum, aktif_siparis_id } = req.body;
    const guncelleme = {};
    if (kurye_durum !== undefined) guncelleme.kurye_durum = kurye_durum;
    if (aktif_siparis_id !== undefined) guncelleme.aktif_siparis_id = aktif_siparis_id;

    if (kurye_durum === 'bos') {
      guncelleme.musait = true;
      guncelleme.aktif_siparis_id = null;
    } else if (kurye_durum === 'siparis_aldi' || kurye_durum === 'isletmede' || kurye_durum === 'yolda' || kurye_durum === 'teslimde') {
      guncelleme.musait = false;
    }

    await kurye.update(guncelleme);
    res.json({ mesaj: 'Durum guncellendi', kurye });
  } catch (hata) {
    res.status(500).json({ hata: 'Durum guncellenemedi' });
  }
});

// Anlik kurye konumlari (admin haritasi icin)
router.get('/kurye-konumlari', auth, yetki('admin'), async (req, res) => {
  try {
    const kuryeler = await Kurye.findAll({
      where: { enlem: { [Op.ne]: null } },
      include: [{ model: Kullanici, as: 'kullanici', attributes: ['ad_soyad', 'telefon', 'durum'] }],
      attributes: ['id', 'enlem', 'boylam', 'son_konum_tarihi', 'arac_tipi', 'puan', 'musait', 'kurye_durum', 'aktif_siparis_id', 'mola_baslangic', 'calisma_baslangic', 'calisma_bitis', 'toplam_mola_dk', 'toplam_teslim']
    });

    const konumlar = kuryeler.filter(k => k.enlem && k.boylam).map(k => {
      let molaSure = 0;
      let molaDevam = false;
      if (k.kurye_durum === 'mola' && k.mola_baslangic) {
        molaSure = Math.round((Date.now() - new Date(k.mola_baslangic).getTime()) / 60000);
        molaDevam = true;
      }

      return {
        id: k.id,
        ad_soyad: k.kullanici.ad_soyad,
        telefon: k.kullanici.telefon,
        hesap_durum: k.kullanici.durum,
        arac_tipi: k.arac_tipi,
        puan: k.puan,
        musait: k.musait,
        kurye_durum: k.kurye_durum,
        aktif_siparis_id: k.aktif_siparis_id,
        enlem: parseFloat(k.enlem),
        boylam: parseFloat(k.boylam),
        son_konum: k.son_konum_tarihi,
        calisma_baslangic: k.calisma_baslangic,
        calisma_bitis: k.calisma_bitis,
        mola_sure_dk: molaSure,
        mola_devam: molaDevam,
        toplam_mola_dk: k.toplam_mola_dk,
        toplam_teslim: k.toplam_teslim
      };
    });

    res.json(konumlar);
  } catch (hata) {
    console.error('Kurye konumlari hatasi:', hata);
    res.status(500).json({ hata: 'Kurye konumlari alinamadi' });
  }
});

// Kullanici onaylama
router.put('/kullanici/:id/onayla', auth, yetki('admin'), async (req, res) => {
  try {
    const kullanici = await Kullanici.findByPk(req.params.id);
    if (!kullanici) {
      return res.status(404).json({ hata: 'Kullanici bulunamadi' });
    }

    await kullanici.update({ durum: 'aktif' });
    res.json({ mesaj: 'Kullanici onaylandi', kullanici });
  } catch (hata) {
    res.status(500).json({ hata: 'Kullanici onaylanamadi' });
  }
});

module.exports = router;
