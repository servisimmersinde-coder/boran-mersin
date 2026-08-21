const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiparisDurumLog = sequelize.define('SiparisDurumLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  siparis_id: { type: DataTypes.INTEGER, allowNull: false },
  kurye_id: { type: DataTypes.INTEGER, allowNull: true },
  durum: { type: DataTypes.ENUM('siparis_alindi', 'isletmede_bekleniyor', 'isletmeden_alindi', 'musteri_yolunda', 'musteride', 'teslim_edildi', 'iptal'), allowNull: false },
  aciklama: { type: DataTypes.TEXT, allowNull: true },
  enlem: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  boylam: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  tiklama_zamani: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'siparis_durum_loglari', timestamps: true });

module.exports = SiparisDurumLog;
