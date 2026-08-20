const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Kullanici, Kurye, Isletme } = require('../models');
const { auth } = require('../middleware/auth');

// Kayit olma
router.post('/kayit', async (req, res) => {
  try {
    const { rol, ad_soyad, telefon, email, sifre, arac_tipi, plaka, isletme_adi, isletme_turu, adres } = req.body;

    // Telefon kontrol
    const mevcutKullanici = await Kullanici.findOne({ where: { telefon } });
    if (mevcutKullanici) {
      return res.status(400).json({ hata: 'Bu telefon numarasi ile kayitli hesap bulunmaktadir' });
    }

    // Email kontrol (sadece isletme icin zorunlu)
    if (rol === 'isletme' && email) {
      const mevcutEmail = await Kullanici.findOne({ where: { email } });
      if (mevcutEmail) {
        return res.status(400).json({ hata: 'Bu e-posta adresi ile kayitli hesap bulunmaktadir' });
      }
    }

    // Sifre hashleme
    const sifre_hash = await bcrypt.hash(sifre, 10);

    // Kullanici olusturma
    const kullanici = await Kullanici.create({
      rol,
      ad_soyad,
      telefon,
      email: email || null,
      sifre_hash,
      durum: rol === 'admin' ? 'aktif' : 'beklemede'
    });

    // Kurye ise ek bilgiler
    if (rol === 'kurye') {
      await Kurye.create({
        kullanici_id: kullanici.id,
        arac_tipi: arac_tipi || 'motorlu',
        plaka: plaka || null
      });
    }

    // Isletme ise ek bilgiler
    if (rol === 'isletme') {
      await Isletme.create({
        kullanici_id: kullanici.id,
        isletme_adi,
        isletme_turu: isletme_turu || 'diger',
        adres: adres || ''
      });
    }

    // Token olustur
    const token = jwt.sign(
      { id: kullanici.id, rol: kullanici.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      mesaj: 'Kayit basarili',
      token,
      kullanici: {
        id: kullanici.id,
        rol: kullanici.rol,
        ad_soyad: kullanici.ad_soyad,
        telefon: kullanici.telefon,
        durum: kullanici.durum
      }
    });
  } catch (hata) {
    console.error('Kayit hatasi:', hata);
    res.status(500).json({ hata: 'Kayit sirasinda bir hata olustu' });
  }
});

// Giris yapma
router.post('/giris', async (req, res) => {
  try {
    const { telefon, sifre, rol } = req.body;

    const kullanici = await Kullanici.findOne({ where: { telefon } });
    if (!kullanici) {
      return res.status(401).json({ hata: 'Telefon numarasi veya sifre hatali' });
    }

    if (kullanici.durum === 'pasif') {
      return res.status(403).json({ hata: 'Hesabiniz pasif durumdadir' });
    }

    // Eger rol belirtilmisse kontrol et
    if (rol && kullanici.rol !== rol) {
      return res.status(403).json({ hata: `Bu hesap ${kullanici.rol} rolundedir, ${rol} degil` });
    }

    const sifreDogruMu = await bcrypt.compare(sifre, kullanici.sifre_hash);
    if (!sifreDogruMu) {
      return res.status(401).json({ hata: 'Telefon numarasi veya sifre hatali' });
    }

    // Son giris guncelle
    await kullanici.update({ son_giris: new Date() });

    const token = jwt.sign(
      { id: kullanici.id, rol: kullanici.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      mesaj: 'Giris basarili',
      token,
      kullanici: {
        id: kullanici.id,
        rol: kullanici.rol,
        ad_soyad: kullanici.ad_soyad,
        telefon: kullanici.telefon,
        durum: kullanici.durum
      }
    });
  } catch (hata) {
    console.error('Giris hatasi:', hata);
    res.status(500).json({ hata: 'Giris sirasinda bir hata olustu' });
  }
});

// Profil bilgisi
router.get('/profil', auth, async (req, res) => {
  try {
    const kullanici = req.kullanici;
    let ekBilgi = null;

    if (kullanici.rol === 'kurye') {
      ekBilgi = await Kurye.findOne({ where: { kullanici_id: kullanici.id } });
    } else if (kullanici.rol === 'isletme') {
      ekBilgi = await Isletme.findOne({ where: { kullanici_id: kullanici.id } });
    }

    res.json({
      kullanici: {
        id: kullanici.id,
        rol: kullanici.rol,
        ad_soyad: kullanici.ad_soyad,
        telefon: kullanici.telefon,
        email: kullanici.email,
        profil_foto: kullanici.profil_foto,
        durum: kullanici.durum
      },
      ekBilgi
    });
  } catch (hata) {
    res.status(500).json({ hata: 'Profil bilgisi alinamadi' });
  }
});

// Profil guncelleme
router.put('/profil', auth, async (req, res) => {
  try {
    const { ad_soyad, email, profil_foto } = req.body;
    const kullanici = req.kullanici;

    await kullanici.update({
      ad_soyad: ad_soyad || kullanici.ad_soyad,
      email: email || kullanici.email,
      profil_foto: profil_foto || kullanici.profil_foto
    });

    res.json({ mesaj: 'Profil guncellendi', kullanici });
  } catch (hata) {
    res.status(500).json({ hata: 'Profil guncellenemedi' });
  }
});

// Sifre degistirme
router.put('/sifre', auth, async (req, res) => {
  try {
    const { eski_sifre, yeni_sifre } = req.body;
    const kullanici = req.kullanici;

    const eskiDogruMu = await bcrypt.compare(eski_sifre, kullanici.sifre_hash);
    if (!eskiDogruMu) {
      return res.status(400).json({ hata: 'Mevcut sifreniz hatali' });
    }

    const yeni_hash = await bcrypt.hash(yeni_sifre, 10);
    await kullanici.update({ sifre_hash: yeni_hash });

    res.json({ mesaj: 'Sifreniz basariyla degistirildi' });
  } catch (hata) {
    res.status(500).json({ hata: 'Sifre degistirilemedi' });
  }
});

module.exports = router;
