const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Preference = sequelize.define("preference", {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    chatId: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    subscriptionType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subscriptionValue: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

sequelize.sync();

module.exports = Preference;