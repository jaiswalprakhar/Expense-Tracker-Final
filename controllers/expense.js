const User = require('../models/user');
const Expense = require('../models/expense');
const ExpenseFile = require('../models/expenseFile');
const { generateAccessToken } = require('../util/jwtUtil');
const { generateHTML } = require('../util/expenseHTML');
const { generatePDF } = require('../util/generatePDF');
const sequelize = require('../util/database');
const UserServices = require('../services/userServices');
const S3Services = require('../services/s3Services');

exports.getExpenses = async (req, res, next) => {
    try {
        const totalItems = await UserServices.countExpensesData(req.user);
        //console.log(totalItems);

        if(totalItems === undefined) {
            throw new Error('Some Issue in the backend');
        }

        if(totalItems > 0)  {
            let page = +req.query.page;
            const ITEMS_PER_PAGE = +req.query.range || 5;
            //console.log(ITEMS_PER_PAGE);

            if((ITEMS_PER_PAGE * page) > totalItems) {
                page = Math.ceil(totalItems / ITEMS_PER_PAGE);
            }
    
            const offset = (page - 1) * ITEMS_PER_PAGE;
            const limit = ITEMS_PER_PAGE;
    
            // Using Promises -
            const where = {
                where: {
                    userId: req.user.id,
                },
                offset,
                limit
            };
            const howMany = 'All';
            const userExpensePromise = UserServices.findData(Expense, howMany, where);
    
            const expenseFileDataPromise = UserServices.getExpenseFilesData(req.user);
    
            const [userExpense, expenseFileData] = await Promise.all([
                userExpensePromise,
                expenseFileDataPromise
            ]);
            
            //console.log(userExpense, expenseFileData);

            if(!userExpense || !expenseFileData) {
                throw new Error('Unable to fetch Expenses or Expense File Data');
            }

            const message = 'Expenses Fetched';

            return res.status(200).json({
                message: message,
                expenseFileData: expenseFileData,
                userExpenses: userExpense,
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                nextPage: page + 1,
                hasPreviousPage: page > 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                success: true
            });
        }

        const expenseFileData = await req.user.getExpenseFiles();
        const message = 'No Expenses Present';

        res.status(200).json({
            message: message,
            expenseFileData: expenseFileData,
            userExpenses: [],
            success: true
        });
    }
    catch(err) {
        //console.log(err);
        next(err);
    }
}

exports.postExpense = async (req, res, next) => {
    const t = await sequelize.transaction();
    const amount = req.body.amount;
    const description = req.body.description;
    const category = req.body.category;

    try {
        const userData = {
            amount: amount,
            description: description,
            category: category
        };

        const expenseData = await UserServices.createData(req.user, userData, "createExpense", { transaction: t });
        //console.log(expenseData);

        const updatedAmount = Number(req.user.totalExpenses) + Number(amount);
        if (updatedAmount !== undefined) {
            req.user.totalExpenses = updatedAmount;
            await UserServices.saveData(req.user, { transaction: t });
        }

        await t.commit();

        if(expenseData) {
            res.status(201).json({
                message: 'Expense Added',
                newExpense: expenseData,
                isPremiumUser: req.user.isPremiumUser,
                success: true
            });
        }
    }
    catch(err) {
        //console.log(err);
        await t.rollback();
        if(err.name === 'SequelizeValidationError' || 'SequelizeUniqueConstraintError') {
            err.statusCode = 400;
        }
        next(err);
    }
}

exports.deleteExpense = async (req, res, next) => {
    const t = await sequelize.transaction();
    const expenseId =  req.params.id;
    try {
        const expense = await req.user.getExpenses({ where: { id: expenseId } });
        
        if(!expense[0]) {
            const error = new Error(`ExpenseId ${expenseId} not present`);
            error.statusCode = 404;
            throw error;
        }
    
        const result = await UserServices.deleteData(expense[0], { transaction: t });

        let expenseSaved;
        if(result) {
            const updatedAmount = req.user.totalExpenses - expense[0].dataValues.amount;
            if (updatedAmount !== undefined) {
                req.user.totalExpenses = updatedAmount;
                expenseSaved = await UserServices.saveData(req.user, { transaction: t });
                //console.log("Total Expense Data updated");             
            }
        }

        if(expenseSaved)  {
            await t.commit();
            res.status(200).json({
                message: `ExpenseId ${expenseId} expense Deleted`,
                success: true
            });
        }
    }
    catch(err)  {
        //console.log(err);
        await t.rollback();
        next(err);
    }
}

exports.getEditExpense = async (req, res, next) => {
    const expenseId =  req.params.id;
    try {
        const where = { where: { id: expenseId } };
        const expenseData = await UserServices.getExpensesData(req.user, where);
        if(!expenseData) {
            throw new Error('Unable to fetch Expense');
        }
        //console.log(expenseData.length, expenseData);

        if(expenseData.length > 0)  {
            res.status(200).json({
                message: 'Auto Filling Expense into Form from db',
                expense: expenseData[0],
                success: true
            });
        }
        else {
             const error = new Error(`${expenseId} No such expense present`);
             error.statusCode = 404;
             throw error;
        }
    }
    catch(err) {
        //console.log(err);
        next(err);
    }
}

exports.postEditExpense = async (req, res, next) => {
    const t = await sequelize.transaction();
    const expenseId =  req.params.id;
    try {
        const updatedAmount = req.body.amount;
        const updatedDescription = req.body.description;
        const updatedCategory = req.body.category;

        const where = { where: { id: expenseId } };
        const expenseData = await UserServices.getExpensesData(req.user, where);

        if (!expenseData[0]) {
            const error = new Error(`ExpenseId ${expenseId} not found`);
            error.statusCode = 404;
            throw error;
        }
        
        if (updatedAmount !== undefined) {
            req.user.totalExpenses = req.user.totalExpenses + (Number(updatedAmount) - expenseData[0].amount);            
            expenseData[0].amount = updatedAmount;
        }
        if (updatedDescription !== undefined) {
            expenseData[0].description = updatedDescription;
        }
        if (updatedCategory !== undefined) {
            expenseData[0].category = updatedCategory;
        }
        
        const savedExpenseData = await UserServices.saveData(expenseData[0], { transaction: t });
        //console.log('Expense Data saved');
        
        const savedTotalExpenseData = await UserServices.saveData(req.user, { transaction: t });
        //console.log('Total Expenses Data saved');
        
        //console.log(savedExpenseData, savedTotalExpenseData);
        
        await t.commit();
        
        res.status(200).json({
            message: 'Expense Edited',
            editedExpense: expenseData[0],
            success: true
        });
    }
    catch(err) {
        //console.log(err);
        await t.rollback();
        if(err.name === 'SequelizeValidationError' || 'SequelizeUniqueConstraintError') {
            err.statusCode = 400;
        }
        next(err);
    }
}

exports.downloadExpense = async (req, res, next) => {
    try {
        const premiumUser = req.user.isPremiumUser;
        if(!premiumUser) {
            const error = new Error(`User does not have a premium account`);
            error.statusCode = 401;
            throw error;
        }
        const where = {
            attributes: ['id', 'amount', 'description', 'category', 'createdAt'],
            order: [['createdAt', 'ASC']]
        };
        
        const userExpensesData = await UserServices.getExpensesData(req.user, where);
        
        if(userExpensesData.length > 0) {
            // Generate HTML-like structure
            const htmlContent = generateHTML(userExpensesData);
            //console.log("HTML Content created");

            // Generate PDF from HTML
            const pdfBuffer = await generatePDF(htmlContent);
            //console.log("PDF File created");
            
            // Upload PDF to S3
            const fileName = `Expense${req.user.id}/${new Date()}.pdf`;
            const fileURL = await S3Services.uploadToS3(pdfBuffer, fileName);

            if(fileURL !== undefined || fileURL !== '') {
                const dowloadedFileData = await req.user.createExpenseFile({
                    downloadedFileUrl: fileURL
                })
            }

            res.status(201).json({ 
                message: 'File Downloaded Successfully',
                downloadedFileUrl: fileURL,
                expenses: userExpensesData,
                success: true });
        }
        else {
            res.status(200).json({
                message: 'No Expenses Found, User cannot download the file',
                expenses: userExpensesData,
                success: true
            })
        }
    }
    catch(err) {
        //console.log(err);
        next(err);
    }
}