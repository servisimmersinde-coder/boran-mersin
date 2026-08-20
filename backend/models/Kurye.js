const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kurye = sequelize.define('Kurye', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  kullanici_id: { type: DataTypes.INTEGER, allowNull: false },
  arac_tipi: { type: DataTypes.ENUM('motorlu', 'bisiklet', 'yaya'), defaultValue: 'motorlu' },
  plaka: { type: DataTypes.STRING(20), allowNull: true },
  lisans_no: { type: DataTypes.STRING(30), allowNull: true },
  puan: { type: DataTypes.DECIMAL(3, 2), defaultValue: 5.00 },
  toplam_teslim: { type: DataTypes.INTEGER, defaultValue: 0 },
  musait: { type: DataTypes.BOOLEAN, defaultValue: false },

  // Calisma slotlari
  calisma_baslangic: { type: DataTypes.STRING(5), defaultValue: '09:00' },
  calisma_bitis: { type: DataTypes.STRING(5), defaultValue: '22:00' },
  gunler: { type: DataTypes.TEXT, defaultValue: '1,2,3,4,5,6,7' },

  // Meşguliyet / durum
  kurye_durum: { type: DataTypes.ENUM('bos', 'siparis_aldi', 'isletmede', 'yolda', 'teslimde', 'mola'), defaultValue: 'bos' },
  aktif_siparis_id: { type: DataTypes.INTEGER, allowNull: true },

  // Mola
  mola_baslangic: { type: DataTypes.DATE, allowNull: true },
  mola_suresi_dk: { type: DataTypes.INTEGER, defaultValue: 30 },
  toplam_mola_dk: { type: DataTypes.INTEGER, defaultValue: 0 },

  // Konum
  enlem: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  boylam: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  son_konum_tarihi: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'kuryeler', timestamps: true });

module.exports = Kurye;
