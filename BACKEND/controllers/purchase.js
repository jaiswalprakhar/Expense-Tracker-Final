const Razorpay = require('razorpay');
const Order = require('../models/order');
const { generateAccessToken } = require('../util/jwtUtil');

exports.purchasePremium = async (req, res) => {
    try {
        const rzp = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZOR_KEY_SECRET
        })

        const amount = 2500;

        rzp.orders.create({ amount, currency: "INR" }, (err, order) => {
            if(err) {
                throw new Error(JSON.stringify(err));
            }
            req.user.createOrder({ orderid: order.id, status: 'PENDING'}).then(() => {
                return res.status(201).json({ order, key_id: rzp.key_id, success: true });
            })
            .catch(err => {
                throw new Error(err)
            })
        })
    } catch(err) {
        //console.log(err);
        res.status(403).json({ message: 'Something went wrong', err: err, success: false });
    }
}

exports.updateTransactionStatus = async (req, res, next) => {
    try {
        const { payment_id, order_id, status } = req.body;
        const order = await Order.findOne({ where: { orderid: order_id } });
        if(!order)  {
            const error = new Error('Order not found');
            error.statusCode = 404;
            throw error;
        }
        if(status === "SUCCESS")
        {
            const updateOrderPromise = order.update({ paymentid: payment_id, status: 'SUCCESSFUL' });
            const updateUserPromise = req.user.update({ isPremiumUser: true });
            //console.log(`req.user.isPremiumUser = ${req.user.isPremiumUser}`);

            Promise.all([updateOrderPromise, updateUserPromise])
            .then(() => {
                return res.status(202).json({ success: true, message: "Transaction Successful", token: generateAccessToken(req.user.id, req.user.fullName, req.user.isPremiumUser) });
            })
            .catch((err) => {
                throw new Error(err);
            })
        }
        else if(status === "FAILED")
        {
            const orderStatusUpdated = await order.update({ paymentid: payment_id, status: 'FAILED' });
            if(!orderStatusUpdated) {
                const error = new Error('Order not updated, Something went wrong');
                throw error;
            }
            return res.status(403).json({success: false, message: "Transaction Failed"});
        }
    }
    catch (err) {
        //console.log(err);
        next(err);
    }
}