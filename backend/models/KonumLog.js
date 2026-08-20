const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KonumLog = sequelize.define('KonumLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  kurye_id: { type: DataTypes.INTEGER, allowNull: false },
  enlem: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
  boylam: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
  hiz: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  yol_durumu: { type: DataTypes.ENUM('serbest', 'trafigik', 'kapali'), defaultValue: 'serbest' },
  kayit_zamani: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'konum_loglari', timestamps: false });

module.exports = KonumLog;
