const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Kurye, Siparis, Isletme, Kullanici, KonumLog, FinansalIslem, SiparisDurumLog } = require('../models');
const { auth, yetki } = require('../middleware/auth');

// Musaitlik durumunu degistir
router.put('/musaitlik', auth, yetki('kurye'), async (req, res) => {
  try {
    const kurye = await Kurye.findOne({ where: { kullanici_id: req.kullaniciId } });
    if (!kurye) {
      return res.status(404).json({ hata: 'Kurye kaydi bulunamadi' });
    }

    if (kurye.kurye_durum === 'mola') {
      return res.status(400).json({ hata: 'Moladayken musaitlik degistiremezsiniz' });
    }

    const yeniDurum = !kurye.musait;
    await kurye.update({ musait: yeniDurum, kurye_durum: yeniDurum ? 'bos' : 'bos' });
    res.json({ mesaj: yeniDurum ? 'Musaitlik acildi' : 'Musaitlik kapatildi', musait: yeniDurum });
  } catch (hata) {
    res.status(500).json({ hata: 'Musaitlik degistirilemedi' });
  }
});

// Mola baslat/bitir
router.put('/mola', auth, yetki('kurye'), async (req, res) => {
  try {
    const kurye = await Kurye.findOne({ where: { kullanici_id: req.kullaniciId } });
    if (!kurye) return res.status(404).json({ hata: 'Kurye kaydi bulunamadi' });

    if (kurye.kurye_durum === 'mola') {
      // Molayi bitir
      const molaSuresi = kurye.mola_baslangic ? Math.round((Date.now() - new Date(kurye.mola_baslangic).getTime()) / 60000) : 0;
      await kurye.update({
        kurye_durum: 'bos',
        musait: true,
        mola_baslangic: null,
        toplam_mola_dk: kurye.toplam_mola_dk + molaSuresi
      });
      res.json({ mesaj: 'Mola bitti', kurye_durum: 'bos', mola_sure: molaSuresi });
    } else {
      // Molayi baslat
      await kurye.update({
        kurye_durum: 'mola',
        musait: false,
        mola_baslangic: new Date()
      });
      res.json({ mesaj: 'Mola baslatildi', kurye_durum: 'mola' });
    }
  } catch (hata) {
    res.status(500).json({ hata: 'Mola islemi yapilamadi' });
  }
});

// Kurye durum guncelle (siparis akisi icin)
router.put('/durumum', auth, yetki('kurye'), async (req, res) => {
  try {
    const { kurye_durum, aktif_siparis_id } = req.body;
    const kurye = await Kurye.findOne({ where: { kullanici_id: req.kullaniciId } });
    if (!kurye) return res.status(404).json({ hata: 'Kurye kaydi bulunamadi' });

    const guncelleme = { kurye_durum };
    if (aktif_siparis_id !== undefined) guncelleme.aktif_siparis_id = aktif_siparis_id;

    if (kurye_durum === 'bos') {
      guncelleme.musait = true;
      guncelleme.aktif_siparis_id = null;
    } else {
      guncelleme.musait = false;
    }

    await kurye.update(guncelleme);
    res.json({ mesaj: 'Durum guncellendi', kurye });
  } catch (hata) {
    res.status(500).json({ hata: 'Durum guncellenemedi' });
  }
});

// Kurye profil + durum bilgisi
router.get('/durum-bilgisi', auth, yetki('kurye'), async (req, res) => {
  try {
    const kurye = await Kurye.findOne({ where: { kullanici_id: req.kullaniciId } });
    if (!kurye) return res.status(404).json({ hata: 'Kurye bulunamadi' });

    let molaSure = 0;
    if (kurye.kurye_durum === 'mola' && kurye.mola_baslangic) {
      molaSure = Math.round((Date.now() - new Date(kurye.mola_baslangic).getTime()) / 60000);
    }

    res.json({
      kurye_durum: kurye.kurye_durum,
      musait: kurye.musait,
      aktif_siparis_id: kurye.aktif_siparis_id,
      mola_devam: kurye.kurye_durum === 'mola',
      mola_sure_dk: molaSure,
      toplam_mola_dk: kurye.toplam_mola_dk,
      mola_limiti: kurye.mola_suresi_dk,
      calisma_baslangic: kurye.calisma_baslangic,
      calisma_bitis: kurye.calisma_bitis
    });
  } catch (hata) {
    res.status(500).json({ hata: 'Durum bilgisi alinamadi' });
  }
});

// Konum guncelleme
router.put('/konum', auth, yetki('kurye'), async (req, res) => {
  try {
    const { enlem, boylam, hiz } = req.body;
    const kurye = await Kurye.findOne({ where: { kullanici_id: req.kullaniciId } });
    
    if (!kurye) {
      return res.status(404).json({ hata: 'Kurye kaydi bulunamadi' });
    }

    await kurye.update({
      enlem,
      boylam,
      son_konum_tarihi: new Date()
    });

    // Konum logu kaydet
    await KonumLog.create({
      kurye_id: kurye.id,
      enlem,
      boylam,
      hiz: hiz || 0
    });

    // Socket.io ile canli gonder (server.js'de yapilacak)
    if (req.app.get('io')) {
      req.app.get('io').to(`kurye_${kurye.id}`).emit('konumGuncelle', { kuryeId: kurye.id, enlem, boylam });
      req.app.get('io').emit('kuryeKonumu', { kuryeId: kurye.id, enlem, boylam, musait: kurye.musait });
    }

    res.json({ mesaj: 'Konum guncellendi' });
  } catch (hata) {
    res.status(500).json({ hata: 'Konum guncellenemedi' });
  }
});

// Siparislerim
router.get('/siparislerim', auth, yetki('kurye'), async (req, res) => {
  try {
    const kurye = await Kurye.findOne({ where: { kullanici_id: req.kullaniciId } });
    const siparisler = await Siparis.findAll({
      where: { kurye_id: kurye.id },
      include: [
        { model: Isletme, as: 'isletme', attributes: ['isletme_adi', 'adres'] }
      ],
      order: [['olusturma_tarihi', 'DESC']]
    });

    res.json(siparisler);
  } catch (hata) {
    res.status(500).json({ hata: 'Siparisler alinamadi' });
  }
});

// Aktif siparislerim (devam eden)
router.get('/aktif-siparislerim', auth, yetki('kurye'), async (req, res) => {
  try {
    const kurye = await Kurye.findOne({ where: { kullanici_id: req.kullaniciId } });
    const siparisler = await Siparis.findAll({
      where: {
        kurye_id: kurye.id,
        durum: { [Op.in]: ['alindi', 'yolda'] }
      },
      include: [
        { model: Isletme, as: 'isletme', attributes: ['isletme_adi', 'adres'] }
      ],
      order: [['olusturma_tarihi', 'DESC']]
    });

    res.json(siparisler);
  } catch (hata) {
    res.status(500).json({ hata: 'Aktif siparisler alinamadi' });
  }
});

// Siparis kabul
router.post('/siparis-kabul/:id', auth, yetki('kurye'), async (req, res) => {
  try {
    const siparis = await Siparis.findByPk(req.params.id);
    if (!siparis) {
      return res.status(404).json({ hata: 'Siparis bulunamadi' });
    }

    if (siparis.durum !== 'bekliyor') {
      return res.status(400).json({ hata: 'Bu siparis artik musait degil' });
    }

    const kurye = await Kurye.findOne({ where: { kullanici_id: req.kullaniciId } });
    
    await siparis.update({
      kurye_id: kurye.id,
      durum: 'atandi'
    });

    await kurye.update({
      kurye_durum: 'siparis_aldi',
      musait: false,
      aktif_siparis_id: siparis.id
    });

    // Baslangic logu
    await SiparisDurumLog.create({
      siparis_id: siparis.id,
      kurye_id: kurye.id,
      durum: 'siparis_alindi',
      aciklama: 'Siparis kabul edildi',
      tiklama_zamani: new Date()
    });

    res.json({ mesaj: 'Siparis kabul edildi', siparis });
  } catch (hata) {
    res.status(500).json({ hata: 'Siparis kabul edilemedi' });
  }
});

// Siparis red
router.post('/siparis-red/:id', auth, yetki('kurye'), async (req, res) => {
  try {
    const siparis = await Siparis.findByPk(req.params.id);
    if (!siparis) {
      return res.status(404).json({ hata: 'Siparis bulunamadi' });
    }

    // Sadece bekleyen veya atanan siparisleri reddedebilir
    if (!['bekliyor', 'atandi'].includes(siparis.durum)) {
      return res.status(400).json({ hata: 'Bu siparis reddedilemez' });
    }

    await siparis.update({ durum: 'bekliyor', kurye_id: null });
    res.json({ mesaj: 'Siparis reddedildi' });
  } catch (hata) {
    res.status(500).json({ hata: 'Siparis reddedilemedi' });
  }
});

// Durum guncelleme (siparis alindi/yolda/teslim)
router.put('/durum-guncelle/:id', auth, yetki('kurye'), async (req, res) => {
  try {
    const { durum, fotolar, notlar, enlem, boylam } = req.body;
    const siparis = await Siparis.findByPk(req.params.id);
    
    if (!siparis) {
      return res.status(404).json({ hata: 'Siparis bulunamadi' });
    }

    const kurye = await Kurye.findOne({ where: { kullanici_id: req.kullaniciId } });
    if (siparis.kurye_id !== kurye.id) {
      return res.status(403).json({ hata: 'Bu siparis size ait degil' });
    }

    // Durum eslesme map'i (frontend durumu -> log durumu)
    const durumMap = {
      'alindi': 'siparis_alindi',
      'yolda': 'musteri_yolunda',
      'teslim': 'teslim_edildi'
    };

    // Durum logu kaydet
    const logDurum = durumMap[durum] || durum;
    await SiparisDurumLog.create({
      siparis_id: siparis.id,
      kurye_id: kurye.id,
      durum: logDurum,
      aciklama: req.body.aciklama || null,
      enlem: enlem || null,
      boylam: boylam || null,
      tiklama_zamani: new Date()
    });

    const guncellemeler = { durum };
    
    if (durum === 'alindi') {
      guncellemeler.alis_tarihi = new Date();
    } else if (durum === 'teslim') {
      guncellemeler.teslim_tarihi = new Date();
      guncellemeler.odeme_durum = 'odedi';
      
      const kazanc = parseFloat(siparis.ucret) * 0.7;
      await FinansalIslem.create({
        kullanici_id: req.kullaniciId,
        siparis_id: siparis.id,
        tip: 'kazanc',
        tutar: kazanc,
        aciklama: `Siparis #${siparis.siparis_no} teslimi`
      });

      await kurye.update({ toplam_teslim: kurye.toplam_teslim + 1 });
    }

    if (fotolar) guncellemeler.fotolar = fotolar;
    if (notlar) guncellemeler.notlar = notlar;

    await siparis.update(guncellemeler);
    res.json({ mesaj: 'Durum guncellendi', siparis });
  } catch (hata) {
    console.error('Durum guncelleme hatasi:', hata.message);
    res.status(500).json({ hata: 'Durum guncellenemedi' });
  }
});

// Kazanc bilgisi
router.get('/kazanc', auth, yetki('kurye'), async (req, res) => {
  try {
    const kurye = await Kurye.findOne({ where: { kullanici_id: req.kullaniciId } });
    
    const toplamKazanc = await FinansalIslem.sum('tutar', {
      where: {
        kullanici_id: req.kullaniciId,
        tip: 'kazanc'
      }
    });

    const gunlukKazanc = await FinansalIslem.sum('tutar', {
      where: {
        kullanici_id: req.kullaniciId,
        tip: 'kazanc',
        olusturma_tarihi: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    const sonIslemler = await FinansalIslem.findAll({
      where: { kullanici_id: req.kullaniciId },
      include: [{ model: Siparis, as: 'siparis', attributes: ['siparis_no'] }],
      order: [['olusturma_tarihi', 'DESC']],
      limit: 10
    });

    res.json({
      toplam_teslim: kurye.toplam_teslim,
      puan: kurye.puan,
      toplam_kazanc: toplamKazanc || 0,
      gunluk_kazanc: gunlukKazanc || 0,
      son_islemler: sonIslemler
    });
  } catch (hata) {
    res.status(500).json({ hata: 'Kazanc bilgisi alinamadi' });
  }
});

module.exports = router;
