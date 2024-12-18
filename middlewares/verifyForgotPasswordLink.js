const ForgotPassword = require('../models/forgotPassword');

const authenticatePasswordLink = async (req, res, next) => {
    try {
        const { uuid } = req.query;
        const forgotPasswordUUID = await ForgotPassword.findOne({ where: { id: uuid } });

        if(!forgotPasswordUUID || !forgotPasswordUUID.isActive || new Date() > new Date(forgotPasswordUUID.expiresBy)) {
            return res.status(400).json({ message: 'Invalid link or Reset link has expired', success: false });
        }

        //console.log('Link is valid, please update your password now');
        next();
    } 
    catch (err) {
        //console.log(err);
        next(err);
    }
}

module.exports = { authenticatePasswordLink };