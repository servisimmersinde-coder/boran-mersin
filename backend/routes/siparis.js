const express = require('express');
const router = express.Router();
const { Siparis, Isletme, Kurye, Kullanici } = require('../models');
const { auth, yetki } = require('../middleware/auth');

// Siparis detay
router.get('/:id', auth, async (req, res) => {
  try {
    const siparis = await Siparis.findByPk(req.params.id, {
      include: [
        { model: Isletme, as: 'isletme', attributes: ['isletme_adi', 'adres', 'telefon', 'logo'] },
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

    res.json(siparis);
  } catch (hata) {
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
