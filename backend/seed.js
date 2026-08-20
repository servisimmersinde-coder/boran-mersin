const { sequelize, Kullanici, Kurye, Isletme } = require('./models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Veritabani olusturuldu');

    // Admin
    const adminHash = await bcrypt.hash('admin123', 10);
    const admin = await Kullanici.create({
      rol: 'admin',
      ad_soyad: 'Admin',
      telefon: '05000000000',
      email: 'admin@boranmersin.com',
      sifre_hash: adminHash,
      durum: 'aktif'
    });
    console.log('Admin olusturuldu: 05000000000 / admin123');

    // Test Kurye
    const kuryeHash = await bcrypt.hash('123456', 10);
    const kuryeKullanici = await Kullanici.create({
      rol: 'kurye',
      ad_soyad: 'Ahmet Yilmaz',
      telefon: '05551112233',
      sifre_hash: kuryeHash,
      durum: 'aktif'
    });
    await Kurye.create({
      kullanici_id: kuryeKullanici.id,
      arac_tipi: 'motorlu',
      plaka: '33 ABC 123',
      musait: true,
      enlem: 36.8121,
      boylam: 34.6298
    });
    console.log('Test kurye olusturuldu: 05551112233 / 123456');

    // Test Isletme
    const isletmeHash = await bcrypt.hash('123456', 10);
    const isletmeKullanici = await Kullanici.create({
      rol: 'isletme',
      ad_soyad: 'Mersin Pizza',
      telefon: '05332223344',
      email: 'mersinpizza@test.com',
      sifre_hash: isletmeHash,
      durum: 'aktif'
    });
    await Isletme.create({
      kullanici_id: isletmeKullanici.id,
      isletme_adi: 'Mersin Pizza',
      isletme_turu: 'restoran',
      adres: 'Akdeniz, Mersin Merkez',
      enlem: 36.8000,
      boylam: 34.6300
    });
    console.log('Test isletme olusturuldu: 05332223344 / 123456');

    console.log('\n=== TEST HESAPLARI ===');
    console.log('Admin:   05000000000 / admin123');
    console.log('Kurye:   05551112233 / 123456');
    console.log('Isletme: 05332223344 / 123456');
    console.log('=====================');

  } catch (hata) {
    console.error('Seed hatasi:', hata);
  } finally {
    await sequelize.close();
  }
}

seed();
