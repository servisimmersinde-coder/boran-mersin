const express = require('express');
const router = express.Router();
const { Siparis, Isletme, Kurye, Kullanici, SiparisDurumLog } = require('../models');
const { auth, yetki } = require('../middleware/auth');

// Siparis detay
router.get('/:id', auth, async (req, res) => {
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

    if (!siparis) {
      return res.status(404).json({ hata: 'Siparis bulunamadi' });
    }

    // Durum loglarini getir +Sureleri hesapla
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
        id: log.id,
        durum: log.durum,
        durum_adi: durumMetinleri[log.durum] || log.durum,
        aciklama: log.aciklama,
        tiklama_zamani: log.tiklama_zamani,
        sure_dk: sure_dk,
        sure_sn: sure_sn,
        kurye_adi: log.kurye && log.kurye.kullanici ? log.kurye.kullanici.ad_soyad : null
      };
    });

    // Toplam sure hesapla
    let toplamSure_dk = null;
    let toplamSure_sn = null;
    if (siparis.olusturma_tarihi && siparis.teslim_tarihi) {
      toplamSure_sn = Math.round((new Date(siparis.teslim_tarihi).getTime() - new Date(siparis.olusturma_tarihi).getTime()) / 1000);
      toplamSure_dk = Math.round(toplamSure_sn / 60);
    } else if (siparis.olusturma_tarihi && durumLoglari.length > 0) {
      toplamSure_sn = Math.round((new Date().getTime() - new Date(siparis.olusturma_tarihi).getTime()) / 1000);
      toplamSure_dk = Math.round(toplamSure_sn / 60);
    }

    res.json({
      ...siparis.toJSON(),
      timeline,
      toplam_sure_dk: toplamSure_dk,
      toplam_sure_sn: toplamSure_sn
    });
  } catch (hata) {
    console.error('Siparis detay hatasi:', hata.message);
    res.status(500).json({ hata: 'Siparis detayi alinamadi' });
  }
});

// Siparis takip (public - SMS/WhatsApp linkinden)
router.get('/takip/:siparisNo', async (req, res) => {
  try {
    const siparis = await Siparis.findOne({
      where: { siparis_no: req.params.siparisNo },
      include: [
        { model: Isletme, as: 'isletme', attributes: ['isletme_adi'] },
        {
          model: Kurye,
          as: 'kurye',
          include: [{ model: Kullanici, as: 'kullanici', attributes: ['ad_soyad'] }]
        }
      ],
      attributes: ['siparis_no', 'durum', 'alic_ad', 'alic_adres', 'olusturma_tarihi', 'alis_tarihi', 'teslim_tarihi']
    });

    if (!siparis) {
      return res.status(404).json({ hata: 'Siparis bulunamadi' });
    }

    res.json(siparis);
  } catch (hata) {
    res.status(500).json({ hata: 'Siparis takip bilgisi alinamadi' });
  }
});

// Durum guncelleme
router.put('/:id/durum', auth, async (req, res) => {
  try {
    const { durum, fotolar, notlar } = req.body;
    const siparis = await Siparis.findByPk(req.params.id);

    if (!siparis) {
      return res.status(404).json({ hata: 'Siparis bulunamadi' });
    }

    const guncellemeler = { durum };

    if (durum === 'alindi') {
      guncellemeler.alis_tarihi = new Date();
    } else if (durum === 'teslim') {
      guncellemeler.teslim_tarihi = new Date();
      guncellemeler.odeme_durum = 'odedi';
    }

    if (fotolar) guncellemeler.fotolar = fotolar;
    if (notlar) guncellemeler.notlar = notlar;

    await siparis.update(guncellemeler);
    res.json({ mesaj: 'Durum guncellendi', siparis });
  } catch (hata) {
    res.status(500).json({ hata: 'Durum guncellenemedi' });
  }
});

// Siparis iptal
router.post('/:id/iptal', auth, async (req, res) => {
  try {
    const siparis = await Siparis.findByPk(req.params.id);

    if (!siparis) {
      return res.status(404).json({ hata: 'Siparis bulunamadi' });
    }

    if (['teslim', 'iptal'].includes(siparis.durum)) {
      return res.status(400).json({ hata: 'Bu siparis iptal edilemez' });
    }

    await siparis.update({
      durum: 'iptal',
      iptal_nedeni: req.body.neden || 'Kullanici tarafindan iptal'
    });

    res.json({ mesaj: 'Siparis iptal edildi' });
  } catch (hata) {
    res.status(500).json({ hata: 'Siparis iptal edilemedi' });
  }
});

module.exports = router;
