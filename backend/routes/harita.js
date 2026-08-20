const express = require('express');
const router = express.Router();
const { Kurye, Kullanici } = require('../models');

// Aktif kurye konumlari
router.get('/kuryeler', async (req, res) => {
  try {
    const kuryeler = await Kurye.findAll({
      where: { musait: true },
      include: [{
        model: Kullanici,
        as: 'kullanici',
        attributes: ['ad_soyad']
      }],
      attributes: ['id', 'enlem', 'boylam', 'son_konum_tarihi', 'arac_tipi', 'puan']
    });

    const kuryeKonumlari = kuryeler
      .filter(k => k.enlem && k.boylam)
      .map(k => ({
        id: k.id,
        ad_soyad: k.kullanici.ad_soyad,
        arac_tipi: k.arac_tipi,
        puan: k.puan,
        enlem: parseFloat(k.enlem),
        boylam: parseFloat(k.boylam),
        son_konum: k.son_konum_tarihi
      }));

    res.json(kuryeKonumlari);
  } catch (hata) {
    res.status(500).json({ hata: 'Kurye konumlari alinamadi' });
  }
});

// Mesafe hesaplama (Haversine formul)
router.get('/mesafe', (req, res) => {
  try {
    const { enlem1, boylam1, enlem2, boylam2 } = req.query;

    if (!enlem1 || !boylam1 || !enlem2 || !boylam2) {
      return res.status(400).json({ hata: 'Koordinatlar gerekli' });
    }

    const R = 6371;
    const dLat = (parseFloat(enlem2) - parseFloat(enlem1)) * Math.PI / 180;
    const dLon = (parseFloat(boylam2) - parseFloat(boylam1)) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(parseFloat(enlem1) * Math.PI / 180) * Math.cos(parseFloat(enlem2) * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const mesafe = R * c;

    const tahminiSure = Math.ceil((mesafe / 30) * 60);

    let ucret = 35;
    if (mesafe > 3) {
      ucret += Math.ceil(mesafe - 3) * 8;
    }

    res.json({
      mesafe_km: Math.round(mesafe * 100) / 100,
      tahmini_sure_dk: tahminiSure,
      tahmini_ucret: ucret
    });
  } catch (hata) {
    res.status(500).json({ hata: 'Mesafe hesaplanamadi' });
  }
});

module.exports = router;
