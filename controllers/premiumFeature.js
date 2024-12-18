const User = require('../models/user');
const Expense = require('../models/expense');
const sequelize = require('../util/database');
const UserServices = require('../services/userServices');

exports.getUserLeaderBoard = async (req, res, next) => {
    try {
        const where = {
            attributes: ['fullName', 'totalExpenses'],
            order: [['totalExpenses', 'DESC']]
        };
        const howMany = 'All';
        
        const leaderBoardOfUsers = await UserServices.findData(User, howMany, where);

        //console.log(leaderBoardOfUsers);
        res.status(200).json({ 
            leaderBoardOfUsers: leaderBoardOfUsers,
            success: true
        });
    } 
    catch (err) {
        //console.log(err);
        next(err);
    }
}