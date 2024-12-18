const User = require('../models/user');
const ForgotPassword = require('../models/forgotPassword');
const { generatePasswordHash } = require('../util/pwdUtil');
const sequelize = require('../util/database');

const uuid = require('uuid');
const bcrypt = require('bcrypt');
const brevoEmail = require('../util/brevoEmail');
const UserServices = require('../services/userServices');

exports.forgotPassword = async (req, res, next) => {
    const emailId = req.body.emailId;
    try {
        const where = { where: { emailId: emailId } };
        const howMany = "One";
        const user = await UserServices.findData(User, howMany, where);

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        req.user = user;

        const id = uuid.v4();
        //console.log(id);
        
        const expiresBy = new Date(Date.now() + 3600000);
        //console.log(expiresBy);

        const userData = { 
            id,
            isActive: true,
            expiresBy
        }

        const forgotPasswordRequestCreated = await UserServices.createData(req.user, userData, "createForgotPassword");

        if(!forgotPasswordRequestCreated) {
            const error = new Error('Unable to create Reset Link');
            error.statusCode = 403;
            throw error;
        }
        
        const brevoEmailSent = await brevoEmail(emailId, id);
        
        if(brevoEmailSent)  {
            //console.log('Reset Password link sent on EmailID');
            res.status(200).json({ 
                message: 'Reset Password link sent on EmailID',
                success: true
             })
        }
    }
    catch(err) {
        //console.log(err);
        next(err);
    }
}

exports.updatePassword = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { newPassword } = req.body;
        if(newPassword.length < 8 || newPassword.length > 15) {
            const error = new Error('Password should be 8 to 15 characters long');
            error.statusCode = 400;
            throw error;
        }
        const { uuid } = req.query;
        //console.log(uuid);

        const where1 = { where: { id: uuid } };
        const howMany = "One";

        const forgotPasswordRequest = await UserServices.findData(ForgotPassword, howMany, where1);
        if(!forgotPasswordRequest)  {
            const error = new Error('change password link is incorrect');
            error.statusCode = 404;
            throw error;
        }

        const where2 = { where: { id: forgotPasswordRequest.userId } };
        const user = await UserServices.findData(User, howMany, where2);

        if(!user) {
            const error = new Error('Email ID not found');
            error.statusCode = 404;
            throw error;
        }

        let newPasswordUpdated;
        const userNewPassword = await generatePasswordHash(newPassword);
        if (user && (userNewPassword !== undefined)) {
            user.password = userNewPassword;
            newPasswordUpdated = await UserServices.saveData(user, { transaction: t });
            //console.log('New Password Updated');
        }

        if(newPasswordUpdated)
        {
            forgotPasswordRequest.isActive = false;
            await UserServices.saveData(forgotPasswordRequest, { transaction: t });
            //console.log('Reset Link is now inActive');
        }

        await t.commit();

        res.status(200).json({ 
            message: 'Password Updated, now go to login page',
            success: true
         });
    }
    catch (err) {
        //console.log(err);
        await t.rollback();
        next(err);
    }   
}