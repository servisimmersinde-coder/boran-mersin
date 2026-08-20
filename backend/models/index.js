const sequelize = require('../config/database');
const Kullanici = require('./Kullanici');
const Kurye = require('./Kurye');
const Isletme = require('./Isletme');
const Siparis = require('./Siparis');
const KonumLog = require('./KonumLog');
const Bildirim = require('./Bildirim');
const FinansalIslem = require('./FinansalIslem');

// Iliskiler
Kullanici.hasOne(Kurye, { foreignKey: 'kullanici_id', as: 'kurye' });
Kurye.belongsTo(Kullanici, { foreignKey: 'kullanici_id', as: 'kullanici' });

Kullanici.hasOne(Isletme, { foreignKey: 'kullanici_id', as: 'isletme' });
Isletme.belongsTo(Kullanici, { foreignKey: 'kullanici_id', as: 'kullanici' });

Isletme.hasMany(Siparis, { foreignKey: 'isletme_id', as: 'siparisler' });
Siparis.belongsTo(Isletme, { foreignKey: 'isletme_id', as: 'isletme' });

Kurye.hasMany(Siparis, { foreignKey: 'kurye_id', as: 'siparisler' });
Siparis.belongsTo(Kurye, { foreignKey: 'kurye_id', as: 'kurye' });

Kurye.hasMany(KonumLog, { foreignKey: 'kurye_id', as: 'konumLoglari' });
KonumLog.belongsTo(Kurye, { foreignKey: 'kurye_id', as: 'kurye' });

Kullanici.hasMany(Bildirim, { foreignKey: 'kullanici_id', as: 'bildirimler' });
Bildirim.belongsTo(Kullanici, { foreignKey: 'kullanici_id', as: 'kullanici' });

Kullanici.hasMany(FinansalIslem, { foreignKey: 'kullanici_id', as: 'islemler' });
FinansalIslem.belongsTo(Kullanici, { foreignKey: 'kullanici_id', as: 'kullanici' });

Siparis.hasMany(FinansalIslem, { foreignKey: 'siparis_id', as: 'islemler' });
FinansalIslem.belongsTo(Siparis, { foreignKey: 'siparis_id', as: 'siparis' });

module.exports = {
  sequelize,
  Kullanici,
  Kurye,
  Isletme,
  Siparis,
  KonumLog,
  Bildirim,
  FinansalIslem
};
