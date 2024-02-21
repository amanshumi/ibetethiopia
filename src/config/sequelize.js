const { Sequelize } = require("sequelize");

const sequelize = new Sequelize('ibetethiopia', 'root', 'password', {
    host: 'localhost',
    dialect: 'mysql'
  });

module.exports = sequelize;