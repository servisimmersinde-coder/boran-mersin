const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Isletme, Siparis, Kurye, Kullanici } = require('../models');
const { auth, yetki } = require('../middleware/auth');
const { bildirimGonder } = require('../utils/bildirim');

// Profil bilgisi
router.get('/profil', auth, yetki('isletme'), async (req, res) => {
  try {
    const isletme = await Isletme.findOne({ where: { kullanici_id: req.kullaniciId } });
    res.json(isletme);
  } catch (hata) {
    res.status(500).json({ hata: 'Profil alinamadi' });
  }
});

// Profil guncelleme
router.put('/profil', auth, yetki('isletme'), async (req, res) => {
  try {
    const isletme = await Isletme.findOne({ where: { kullanici_id: req.kullaniciId } });
    const { isletme_adi, isletme_turu, adres, calisma_saati, logo } = req.body;

    await isletme.update({
      isletme_adi: isletme_adi || isletme.isletme_adi,
      isletme_turu: isletme_turu || isletme.isletme_turu,
      adres: adres || isletme.adres,
      calisma_saati: calisma_saati || isletme.calisma_saati,
      logo: logo || isletme.logo
    });

    res.json({ mesaj: 'Profil guncellendi', isletme });
  } catch (hata) {
    res.status(500).json({ hata: 'Profil guncellenemedi' });
  }
});

// Yeni siparis olustur
router.post('/siparis', auth, yetki('isletme'), async (req, res) => {
  try {
    const {
      gonderen_ad, gonderen_tel, gonderen_adres,
      alic_ad, alic_tel, alic_adres,
      paket_aciklama, paket_agirligi,
      oncelik, ucret, odeme_turu, notlar
    } = req.body;

    const isletme = await Isletme.findOne({ where: { kullanici_id: req.kullaniciId } });

    // Siparis numarasi olustur
    const tarih = new Date();
    const siparisNo = `BM${tarih.getFullYear()}${String(tarih.getMonth() + 1).padStart(2, '0')}${String(tarih.getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    // Ucret hesapla (eger verilmemisse)
    let hesaplananUcret = ucret;
    if (!hesaplananUcret) {
      hesaplananUcret = 35; // Taban ucret
    }

    const komisyon = hesaplananUcret * 0.15; // %15 komisyon

    const siparis = await Siparis.create({
      siparis_no: siparisNo,
      isletme_id: isletme.id,
      durum: 'bekliyor',
      gonderen_ad: gonderen_ad || isletme.isletme_adi,
      gonderen_tel: gonderen_tel || req.kullanici.telefon,
      gonderen_adres: gonderen_adres || isletme.adres,
      alic_ad,
      alic_tel,
      alic_adres,
      paket_aciklama,
      paket_agirligi: paket_agirligi || null,
      oncelik: oncelik || 'normal',
      ucret: hesaplananUcret,
      komisyon,
      odeme_turu: odeme_turu || 'nakit',
      notlar: notlar || null
    });

    // Musait kuryelere bildirim gonder
    const musaitKuryeler = await Kurye.findAll({
      where: { musait: true },
      include: [{ model: Kullanici, as: 'kullanici', where: { durum: 'aktif' } }]
    });

    for (const kurye of musaitKuryeler) {
      await bildirimGonder(kurye.kullanici_id, {
        baslik: 'Yeni Siparis!',
        icerik: `${isletme.isletme_adi} - ${paket_aciklama}`,
        tip: 'siparis',
        siparis_id: siparis.id
      });
    }

    // Socket.io ile canli bildirim
    if (req.app.get('io')) {
      req.app.get('io').emit('yeniSiparis', {
        siparisNo,
        isletmeAdi: isletme.isletme_adi,
        alic_ad,
        alic_adres,
        ucret: hesaplananUcret
      });
    }

    res.status(201).json({ mesaj: 'Siparis olusturuldu', siparis });
  } catch (hata) {
    console.error('Siparis olusturma hatasi:', hata);
    res.status(500).json({ hata: 'Siparis olusturulamadi' });
  }
});

// Siparislerim
router.get('/siparislerim', auth, yetki('isletme'), async (req, res) => {
  try {
    const isletme = await Isletme.findOne({ where: { kullanici_id: req.kullaniciId } });
    const { durum, sayfa = 1, limit = 20 } = req.query;

    const where = { isletme_id: isletme.id };
    if (durum) where.durum = durum;

    const siparisler = await Siparis.findAndCountAll({
      where,
      include: [
        {
          model: Kurye,
          as: 'kurye',
          include: [{ model: Kullanici, as: 'kullanici', attributes: ['ad_soyad', 'telefon'] }]
        }
      ],
      order: [['olusturma_tarihi', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(sayfa) - 1) * parseInt(limit)
    });

    res.json({
      siparisler: siparisler.rows,
      toplam: siparisler.count,
      sayfa: parseInt(sayfa),
      toplamSayfa: Math.ceil(siparisler.count / parseInt(limit))
    });
  } catch (hata) {
    res.status(500).json({ hata: 'Siparisler alinamadi' });
  }
});

// Aktif siparisler
router.get('/aktif', auth, yetki('isletme'), async (req, res) => {
  try {
    const isletme = await Isletme.findOne({ where: { kullanici_id: req.kullaniciId } });
    
    const siparisler = await Siparis.findAll({
      where: {
        isletme_id: isletme.id,
        durum: { [Op.in]: ['bekliyor', 'atandi', 'alindi', 'yolda'] }
      },
      include: [
        {
          model: Kurye,
          as: 'kurye',
          include: [{ model: Kullanici, as: 'kullanici', attributes: ['ad_soyad', 'telefon'] }]
        }
      ],
      order: [['olusturma_tarihi', 'DESC']]
    });

    res.json(siparisler);
  } catch (hata) {
    res.status(500).json({ hata: 'Aktif siparisler alinamadi' });
  }
});

// Siparis iptal
router.put('/siparis/:id/iptal', auth, yetki('isletme'), async (req, res) => {
  try {
    const siparis = await Siparis.findByPk(req.params.id);
    if (!siparis) {
      return res.status(404).json({ hata: 'Siparis bulunamadi' });
    }

    const isletme = await Isletme.findOne({ where: { kullanici_id: req.kullaniciId } });
    if (siparis.isletme_id !== isletme.id) {
      return res.status(403).json({ hata: 'Bu siparis size ait degil' });
    }

    if (['teslim', 'iptal'].includes(siparis.durum)) {
      return res.status(400).json({ hata: 'Bu siparis iptal edilemez' });
    }

    await siparis.update({
      durum: 'iptal',
      iptal_nedeni: req.body.neden || 'Isletme tarafindan iptal edildi'
    });

    res.json({ mesaj: 'Siparis iptal edildi' });
  } catch (hata) {
    res.status(500).json({ hata: 'Siparis iptal edilemedi' });
  }
});

// Borc/fatura bilgisi
router.get('/borc', auth, yetki('isletme'), async (req, res) => {
  try {
    const isletme = await Isletme.findOne({ where: { kullanici_id: req.kullaniciId } });
    
    const toplamBorc = await Siparis.sum('komisyon', {
      where: {
        isletme_id: isletme.id,
        odeme_durum: 'borclu'
      }
    });

    const sonSiparisler = await Siparis.findAll({
      where: { isletme_id: isletme.id },
      attributes: ['siparis_no', 'ucret', 'komisyon', 'odeme_durum', 'olusturma_tarihi'],
      order: [['olusturma_tarihi', 'DESC']],
      limit: 20
    });

    res.json({
      toplam_borc: toplamBorc || 0,
      son_siparisler: sonSiparisler
    });
  } catch (hata) {
    res.status(500).json({ hata: 'Borc bilgisi alinamadi' });
  }
});

module.exports = router;
