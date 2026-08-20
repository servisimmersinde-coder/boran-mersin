const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FinansalIslem = sequelize.define('FinansalIslem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  kullanici_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'kullanicilar', key: 'id' }
  },
  siparis_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'siparisler', key: 'id' }
  },
  tip: {
    type: DataTypes.ENUM('kazanc', 'komisyon', 'odeme', 'para_iade', 'yukleme'),
    allowNull: false
  },
  tutar: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  odeme_yontemi: {
    type: DataTypes.ENUM('nakit', 'kart', 'havale', 'cuzdan'),
    allowNull: true
  }
}, {
  tableName: 'finansal_islemler',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: false
});

module.exports = FinansalIslem;
