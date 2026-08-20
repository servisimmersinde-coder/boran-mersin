const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Isletme = sequelize.define('Isletme', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  kullanici_id: { type: DataTypes.INTEGER, allowNull: false },
  isletme_adi: { type: DataTypes.STRING(200), allowNull: false },
  isletme_turu: { type: DataTypes.ENUM('restoran', 'market', 'eczane', 'tekstil', 'diger'), defaultValue: 'diger' },
  adres: { type: DataTypes.TEXT, allowNull: false },
  enlem: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  boylam: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  logo: { type: DataTypes.TEXT, allowNull: true },
  calisma_saati: { type: DataTypes.STRING(100), defaultValue: '09:00-22:00' },
  toplam_borc: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }
}, { tableName: 'isletmeler', timestamps: true });

module.exports = Isletme;
