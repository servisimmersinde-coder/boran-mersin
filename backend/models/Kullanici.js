const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kullanici = sequelize.define('Kullanici', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rol: {
    type: DataTypes.ENUM('admin', 'kurye', 'isletme'),
    allowNull: false
  },
  ad_soyad: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  telefon: {
    type: DataTypes.STRING(15),
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true
  },
  sifre_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  profil_foto: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  durum: {
    type: DataTypes.ENUM('aktif', 'pasif', 'beklemede'),
    defaultValue: 'beklemede'
  },
  son_giris: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'kullanicilar',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi'
});

module.exports = Kullanici;
