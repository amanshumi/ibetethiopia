const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Company = sequelize.define('Company', {
  chat_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true,
  },
  telegram_contact: {
    type: DataTypes.STRING,
  },
  phone_no: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  company_name: {
    type: DataTypes.STRING,
  },
  company_sector: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  }
});

sequelize.sync();

module.exports = Company;
