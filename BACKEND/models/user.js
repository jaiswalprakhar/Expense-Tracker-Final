const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const User = sequelize.define('user', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    fullName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            noNumbers(value) {
                if (/\d/.test(value)) {
                    throw new Error('Name should not contain numbers');
                }
                else if(value === "") {
                  throw new Error('Name cannot be empty');
                }
            }
        }
    },
    emailId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: {
            args: true,
            msg: 'Email ID already exists'
        },
        validate: {
            isEmail: {
                args: true,
                msg: 'Enter a valid Email Address'
            }
        }
    },
    password: {
        type: Sequelize.STRING,
    },
    totalExpenses: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    isPremiumUser: Sequelize.BOOLEAN
});

module.exports = User;