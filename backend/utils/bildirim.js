const { Bildirim } = require('../models');

const bildirimGonder = async (kullaniciId, { baslik, icerik, tip, siparis_id }) => {
  try {
    const bildirim = await Bildirim.create({
      kullanici_id: kullaniciId,
      baslik,
      icerik,
      tip: tip || 'sistem',
      siparis_id: siparis_id || null
    });

    return bildirim;
  } catch (hata) {
    console.error('Bildirim gonderme hatasi:', hata);
    return null;
  }
};

module.exports = { bildirimGonder };
