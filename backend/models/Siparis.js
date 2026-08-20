const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Siparis = sequelize.define('Siparis', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  siparis_no: { type: DataTypes.STRING(20), unique: true, allowNull: false },
  isletme_id: { type: DataTypes.INTEGER, allowNull: false },
  kurye_id: { type: DataTypes.INTEGER, allowNull: true },
  durum: { type: DataTypes.ENUM('bekliyor', 'atandi', 'alindi', 'yolda', 'teslim', 'iptal'), defaultValue: 'bekliyor' },
  gonderen_ad: { type: DataTypes.STRING(100), allowNull: false },
  gonderen_tel: { type: DataTypes.STRING(15), allowNull: false },
  gonderen_adres: { type: DataTypes.TEXT, allowNull: false },
  gonderen_enlem: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  gonderen_boylam: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  alic_ad: { type: DataTypes.STRING(100), allowNull: false },
  alic_tel: { type: DataTypes.STRING(15), allowNull: false },
  alic_adres: { type: DataTypes.TEXT, allowNull: false },
  alic_enlem: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  alic_boylam: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  paket_aciklama: { type: DataTypes.TEXT, allowNull: false },
  paket_agirligi: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  oncelik: { type: DataTypes.ENUM('normal', 'acil', 'vip'), defaultValue: 'normal' },
  ucret: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  komisyon: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  odeme_turu: { type: DataTypes.ENUM('nakit', 'kart', 'fatura'), defaultValue: 'nakit' },
  odeme_durum: { type: DataTypes.ENUM('bekliyor', 'odedi', 'borclu'), defaultValue: 'bekliyor' },
  fotolar: { type: DataTypes.TEXT, allowNull: true },
  notlar: { type: DataTypes.TEXT, allowNull: true },
  alis_tarihi: { type: DataTypes.DATE, allowNull: true },
  teslim_tarihi: { type: DataTypes.DATE, allowNull: true },
  iptal_nedeni: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'siparisler', timestamps: true, createdAt: 'olusturma_tarihi', updatedAt: 'guncelleme_tarihi' });

module.exports = Siparis;
