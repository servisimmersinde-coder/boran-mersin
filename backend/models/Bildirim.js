const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bildirim = sequelize.define('Bildirim', {
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
  baslik: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  icerik: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tip: {
    type: DataTypes.ENUM('siparis', 'kurye', 'sistem', 'odeme'),
    defaultValue: 'sistem'
  },
  siparis_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  okundu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'bildirimler',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: false
});

module.exports = Bildirim;
