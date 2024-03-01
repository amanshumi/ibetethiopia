const { DataTypes } = require('sequelize');
const sequelize = require("../config/sequelize");

const Tender = sequelize.define('Tender', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  chatId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  messageId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  region: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ownerCompany: {
    type: DataTypes.STRING,
    allowNull: false
  },
  header: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  startBid: {
    type: DataTypes.STRING,
    allowNull: false
  },
  closingDate: {
    type: DataTypes.STRING,
    allowNull: false
  },
  openingDate: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cpoAmount: {
    type: DataTypes.STRING,
    allowNull: false
  },
  footer: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactInfo: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

sequelize.sync(); 

module.exports = Tender;
