const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const express = require('express');
dotenv.config({ path: './.env' });
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const errorController = require("./controllers/error");
const sequelize = require('./util/database');

const User = require('./models/user');
const Expense = require('./models/expense');
const Order = require('./models/order');
const ForgotPassword = require('./models/forgotPassword');
const ExpenseFile = require('./models/expenseFile');

const Port = process.env.PORT || 3000;

const app = express();

app.use(cors());

const userRoutes = require('./routes/user');
const expenseRoutes = require('./routes/expense');
const purchaseRoutes = require('./routes/purchase');
const premiumFeatureRoutes = require('./routes/premiumFeature');
const forgotPasswordRoutes = require('./routes/forgotPassword');

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
);

//app.use(helmet());
/*app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "https://checkout.razorpay.com",
                    "https://lumberjack.razorpay.com",
                    "https://lumberjack-cx.razorpay.com",
                    "https://api.razorpay.com" // Add this for API calls
                ],
                scriptSrcAttr: ["'self'", "'unsafe-inline'"], // Allow inline event handlers
                styleSrc: ["'self'", "'unsafe-inline'"],
                connectSrc: [
                    "'self'",
                    "https://checkout.razorpay.com",
                    "https://lumberjack.razorpay.com",
                    "https://lumberjack-cx.razorpay.com",
                    "https://api.razorpay.com" // Allow Razorpay API
                ],
                imgSrc: ["'self'", "data:", "https://checkout.razorpay.com"],
                frameSrc: [
                    "https://checkout.razorpay.com", 
                    "https://api.razorpay.com" // Allow Razorpay API in iframes
                ],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
    })
);*/
app.use(morgan('combined', { stream: accessLogStream }));

app.use(express.json());

app.use('/user', userRoutes);
app.use('/expense', expenseRoutes);
app.use('/purchase', purchaseRoutes);
app.use('/premium', premiumFeatureRoutes);
app.use('/password', forgotPasswordRoutes);

app.use((req, res) => {
    //console.log('Frontend URL', req.url);
    //console.log(path.join(__dirname, `public/${req.url}`));
    res.sendFile(path.join(__dirname, `public/${req.url}`));
});

//Error Handle for throwing errors manually
app.use((err, req, res, next) => {
    //console.error(err.stack);
    const statusCode = err.statusCode || 500;
    //console.log(err.errors[0].type);

    res.status(statusCode).json({ 
        err: err,
        message: err.message,
        status: statusCode >= 400 && statusCode < 500 ? 'fail' : 'error',
        success: false
    });
  });

app.use(errorController.get404);

Expense.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasMany(Expense);

User.hasMany(Order);
Order.belongsTo(User);

ForgotPassword.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasMany(ForgotPassword);

ExpenseFile.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasMany(ExpenseFile);

sequelize.sync()
.then(result => {
    app.listen(Port, () => {
        console.log(`Server listening at PORT ${Port}`);
    });
})
.catch(err => {
    console.log(err);
})