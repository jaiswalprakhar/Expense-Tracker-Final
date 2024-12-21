const expenseTable = document.querySelector('.expense-table');
const expenseList = document.getElementById('expense-list');

const amount = document.getElementById('amount');
const description = document.getElementById('description');
const category = document.getElementById('category');
const addButton = document.getElementById('addExpense');
const editButton = document.getElementById('editExpense');
const premiumTxt = document.getElementById('buyPremiumMembershipTxt');
const premiumBtnParent = document.getElementById('premiumBtnParent');
const premiumBtn = document.getElementById('buyPremiumMembershipBtn');
const leaderBoardList = document.getElementById('leaderBoard-list');
const leaderBoardTable = document.getElementsByClassName('leaderBoard-table')[0];
const downloadedFileList = document.getElementById('downloadedFile-list');
const downloadedFileTable = document.getElementsByClassName('downloadedFile-table')[0];
const pagination = document.getElementsByClassName('pagination')[0];

const toastBody = document.getElementsByClassName('toast-body')[0];
const toastLiveExample = document.getElementById('liveToast');

const showToastResult = (message) => {
    toastBody.textContent = message;
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample);
    toastBootstrap.show();
};

const showPremiumUserMsg = () => {
    premiumBtn.remove();
    premiumTxt.textContent = `You are a Premium User`;

    leaderBoard();
}

const leaderBoard = () => {
    const childNode = `<div class="row">
                        <div class="col-6 col-sm-6 col-md-6 col-lg-6 col-xl-6 col-xxl-6">
                            <button type="button" class="btn btn-sm btn-success" id="showLeaderBoardBtn" onclick="showLeaderBoard()">Show LeaderBoard</button>
                        </div>
                        <div class="col-6 col-sm-6 col-md-6 col-lg-6 col-xl-6 col-xxl-6 align-self-center">
                            <button type="button" class="btn btn-sm btn-success" id="downloadExpense" onclick="downloadExpenseFile()">Download</button>
                        </div>
                    </div>`;

    premiumBtnParent.innerHTML += childNode;
}

window.showLeaderBoard = async () => {
    try {
        const token = localStorage.getItem('token');
        const userLeaderBoardArray = await axios.get(`http://13.61.101.100:3000/premium/showLeaderBoard`, { headers: {"Authorization": token} });
        //console.log(userLeaderBoardArray);
        
        leaderBoardTable.innerHTML = "";
        userLeaderBoardArray.data.leaderBoardOfUsers.forEach((userDetails) => {
            showLeaderBoardData(userDetails);
        })
        expenseBtn();
    }
    catch(err) {
      //console.log(err);
      if(err.response.status === 500) {
        showToastResult("Something went wrong at Backend");
      }
      else  {
        if(err.response.data.err.errors) {
          showToastResult(err.response.data.err.errors[0].message);
        }
        else {
          showToastResult(err.response.data.message);
        }
      }
    }
}

const showLeaderBoardData = (userDetails) => {
    const childNode = `<tr class="text-center active-row">
                        <td>${userDetails.fullName}</td>
                        <td>${userDetails.totalExpenses}</td>                        
                       </tr>`;
    
    leaderBoardTable.innerHTML = leaderBoardTable.innerHTML + childNode;
    expenseList.style.display = "none";
    downloadedFileList.style.display = "none";
    leaderBoardList.style.display = "block";
}

let originalLeaderBoardBtn = null;
const expenseBtn = () =>{
    const showExpenseBtn = document.createElement('button');
    showExpenseBtn.type = 'button';
    showExpenseBtn.className = 'btn btn-sm btn-success';
    showExpenseBtn.id = 'showExpensesBtn';
    showExpenseBtn.textContent = 'Show Expenses';
    showExpenseBtn.onclick = () => { 
        leaderBoardBtn();
    }

    const showLeaderBoardBtn = document.getElementById('showLeaderBoardBtn');
    if (!originalLeaderBoardBtn && showLeaderBoardBtn) {
        originalLeaderBoardBtn = showLeaderBoardBtn.cloneNode(true); // Clone the original button
    }
    const parentDiv = showLeaderBoardBtn.parentNode;

    if(showLeaderBoardBtn)  {
        parentDiv.replaceChild(showExpenseBtn, showLeaderBoardBtn);
    }
}

const leaderBoardBtn = () => {
    leaderBoardList.style.display = "none";
    downloadedFileList.style.display = "block";
    expenseList.style.display = "block";
    getExpenses(1);

    const showExpenseBtn = document.getElementById('showExpensesBtn');
    const parentDiv = showExpenseBtn.parentNode;

    if(showExpenseBtn && originalLeaderBoardBtn)  {
        parentDiv.replaceChild(originalLeaderBoardBtn, showExpenseBtn);
        originalLeaderBoardBtn = null;
    }
}

window.downloadExpenseFile = () => {
    const token = localStorage.getItem('token');
    showToastResult("File will be downloaded in few seconds");
    axios.get('http://13.61.101.100:3000/expense/download', { headers: { "Authorization": token } })
    .then((response) => {
        if(response.status === 201) {
            //This anchor will download the file-
            let a = document.createElement("a");
            a.href = response.data.downloadedFileUrl;
            a.target = "_blank";
            a.download = 'myexpense.pdf';//'myexpense.csv'; 
            a.click();

            showDownloadedFiles(response.data);
            leaderBoardList.style.display = "none";
            expenseList.style.display = "block";
            downloadedFileList.style.display = "block";
            showToastResult(response.data.message);
        }
        else if(response.status === 200) {
            showToastResult(response.data.message);
        }
        else  {
            throw new Error(err.response.data.message);
        }
    })
    .catch((err) =>{
        //console.log(err);
        if(err.response.status === 500) {
            showToastResult("Something went wrong at Backend");
        }
        else  {
            showToastResult(err.response.data.message);
        }
    })
}

const parseJwt = (token) => {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

window.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname === '/FRONTEND/components/Layout/expenses.html') {
        const token = localStorage.getItem('token');
        const objUrlParams = new URLSearchParams(window.location.search);
        const page = objUrlParams.get("page") || 1;        

        let listRange = localStorage.getItem('listRange');
        if(!listRange)  {
            localStorage.setItem("listRange", 5);
            listRange = localStorage.getItem('listRange');
        }
        document.getElementById('listRange').value = listRange;
        //console.log(listRange);

        axios.get(`http://13.61.101.100:3000/expense/get-expense?page=${page}&range=${listRange}`, { headers: {"Authorization": token} })
        .then((response) => {
            //console.log(response);
            showLogOutBtn();
            
            const decodedToken = parseJwt(token);
            //console.log(decodedToken);
            const isPremiumUser = decodedToken.isPremiumUser;
            if(isPremiumUser) {
                showPremiumUserMsg();
            }

            if(response.data.expenseFileData.length <= 0)
            {
                downloadedFileList.style.display = "none";
            }
            else  {
                for(let i = 0; i < response.data.expenseFileData.length; i++)
                {
                    showDownloadedFiles(response.data.expenseFileData[i]);
                    //console.log('File Links Displayed');
                }
            }

            if(response.data.userExpenses.length <= 0)
            {
                expenseList.style.display = "none";
                showToastResult(response.data.message);
            }
            else  {
                showExpenses(response.data.userExpenses);
                //console.log(response.data.message);
                showToastResult(response.data.message);
                showPagination(response.data);
            }
        })
        .catch((err) => {
            //console.log(err);
            expenseList.style.display = "none";
            downloadedFileList.style.display = "none";
            if(err.response.status === 500) {
                showToastResult("Something went wrong at Backend");
            }
            else  {
                showToastResult(err.response.data.message);
            }
        })
    }
});

let onPage;
export const handleListRange = (event) => {
    event.preventDefault();
    const range = event.target.value;
    
    const myobj = {
        listRange: range,
    }

    localStorage.setItem("listRange", myobj.listRange);
    //console.log(onPage);
    getExpenses(onPage);
}

window.getExpenses = (page) => {
    const token = localStorage.getItem('token');
    const listRange = localStorage.getItem('listRange');
    axios.get(`http://13.61.101.100:3000/expense/get-expense?page=${page}&range=${listRange}`, { headers: {"Authorization": token} })
    .then(({ data: { expenseFileData, userExpenses, ...pageData } }) => {
        if(expenseFileData.length <= 0) {
            downloadedFileList.style.display = "none";
        }
        if(userExpenses.length <= 0) {
            expenseList.style.display = "none";
        }
        if(pageData.currentPage > pageData.lastPage) {
            pageData.currentPage = pageData.lastPage;
            pageData.previousPage = pageData.lastPage - 1;
        }
        //console.log(userExpenses, pageData);
        showExpenses(userExpenses);
        showPagination(pageData);
    })
    .catch((err) => {
        //console.log(err);
        if(err.response.status === 500) {
            showToastResult("Something went wrong at Backend");
        }
        else  {
            showToastResult(err.response.data.message);
        }
    })
}

const showPagination = ({ currentPage, hasNextPage, nextPage, hasPreviousPage, previousPage, lastPage }) => {
    onPage = currentPage;
    pagination.innerHTML = '';

    if(hasPreviousPage) {
        const childNode =`<li class="page-item"><button type="button" class="page-link" onclick = getExpenses('${previousPage}')>${previousPage}</button></li>`;
        pagination.innerHTML += childNode;
    }

    const childNode =`<li class="page-item"><button type="button" class="page-link" onclick = getExpenses('${currentPage}')>${currentPage}</button></li>`;
    pagination.innerHTML += childNode;

    if(hasNextPage) {
        const childNode =`<li class="page-item"><button type="button" class="page-link" onclick = getExpenses('${nextPage}')>${nextPage}</button></li>`;
        pagination.innerHTML += childNode;
    }
}

export const handleExpenseSubmit = (event) => {
    event.preventDefault();
    const myobj = {
        amount: amount.value,
        description: description.value,
        category: category.value
    }

    event.target.reset();
    createExpense(myobj);
}

const createExpense = (obj) => {
    const token = localStorage.getItem('token');
    axios.post('http://13.61.101.100:3000/expense/create-expense', obj, { headers: {"Authorization": token} })
        .then((response) => {
            showExpenses([response.data.newExpense]);
            showToastResult(response.data.message);
            //console.log(response.data.message);
            leaderBoardList.style.display = "none";
            expenseList.style.display = "block";
        })
        .catch((err) => {
            //console.log(err);
            if(err.response.status === 500) {
                showToastResult("Something went wrong at Backend");
            }
            else  {
                showToastResult(err.response.data.message);
            }
        })
}

const showExpenses = (expenses) => {
    expenseTable.innerHTML = "";
    expenses.forEach((expense) => {
        const childNode = `<tr id = ${expense.id} class="text-center active-row">
                        <td>${expense.amount}</td>
                        <td style="word-wrap: break-word; white-space: normal;">${expense.description}</td>
                        <td>${expense.category}</td>
                        <td><button class="btn btn-success m-1" onclick = deleteExpense('${expense.id}') style="background-color: #009879"> Delete </button>
                        <button class="btn btn-success m-1" onclick = getEditExpense('${expense.id}') style="background-color: gray"> Edit </button></td>
                       </tr>`;
        expenseTable.innerHTML = expenseTable.innerHTML + childNode;
    })
}

const showDownloadedFiles = (file) => {
    const date = new Date(file.createdAt);
    const childNode = `<tr class="text-center active-row"">
                        <td><a href="${file.downloadedFileUrl}">${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}</a></td>
                       </tr>`;

    downloadedFileTable.innerHTML = downloadedFileTable.innerHTML + childNode;
}

window.deleteExpense = (expenseId) => {
    const token = localStorage.getItem('token');
    axios.delete(`http://13.61.101.100:3000/expense/delete-expense/${expenseId}`, { headers: {"Authorization": token} })
    .then((response) => {
        removeExpense(expenseId);
        //console.log(response.data.message);
        showToastResult(response.data.message);
    })
    .catch((err) => {
        //console.log(err);
        if(err.response.status === 500) {
            showToastResult("Something went wrong at Backend");
        }
        else  {
            showToastResult(err.response.data.message);
        }
    })
}

const removeExpense = (expenseId) => {
    const childElement = document.getElementById(expenseId);
    if(childElement)
    {
        expenseTable.removeChild(childElement);
    }
}

window.getEditExpense = (expenseId) => {
    const token = localStorage.getItem('token');
    axios.get(`http://13.61.101.100:3000/expense/get-edit-expense/${expenseId}`, { headers: {"Authorization": token} }) 
    .then((response) => {
        //console.log(response.data.message);
        //console.log(response.data.expense);
        showToastResult(response.data.message);

        amount.value = response.data.expense.amount;
        description.value = response.data.expense.description;
        category.value = response.data.expense.category;

       removeExpense(expenseId);

        editButton.style.display = "block";
        addButton.style.display = "none";
        editButton.onclick = (event) =>  {
            //console.log("Edit Button clicked");

            const myobj = {
                amount: amount.value,
                description: description.value,
                category: category.value
            }
            amount.value = "";
            description.value = "";
            category.value = "Choose Category"

            postEditExpense(response.data.expense.id, myobj);
        }
    })
    .catch((err) => {
        //console.log(err);
        if(err.response.status === 500) {
            showToastResult("Something went wrong at Backend");
        }
        else  {
            showToastResult(err.response.data.message);
        }
    })
}

const postEditExpense = (expenseId, obj) => {
    const token = localStorage.getItem('token');
    axios.patch(`http://13.61.101.100:3000/expense/post-edit-expense/${expenseId}`, obj, { headers: {"Authorization": token} })
        .then((response) => {
            showExpenses([response.data.editedExpense]);
            //console.log(response.data.message);
            showToastResult(response.data.message);
        })
        .catch((err) => {
            //console.log(err);            
            if(err.response.status === 500) {
                showToastResult("Something went wrong at Backend");
            }
            else  {
                showToastResult(err.response.data.message);
            }
        })
        editButton.style.display = "none";
        addButton.style.display = "block";
}

if (premiumBtn) {
    premiumBtn.onclick = async (event) => {
        event.preventDefault();

        const token = localStorage.getItem("token");

        try {
            // Step 1: Create Razorpay order via backend
            const response = await axios.get("http://13.61.101.100:3000/purchase/premium-membership", {
                headers: { Authorization: token },
            });

            if (!response.data.success) {
                console.error("Error creating order:", response.data.message);
                showToastResult("Failed to initiate payment. Please try again.");
                return;
            }

            console.log("Order created:", response.data);

            // Step 2: Setup Razorpay modal options
            const options = {
                key: response.data.key_id,
                order_id: response.data.order.id,
                name: "Expense Tracker",
                description: "Premium Membership Purchase",
                handler: async function (paymentResponse) {
                    console.log("Payment successful:", paymentResponse);

                    // Update transaction status to SUCCESS
                    const res = await axios.post(
                        "http://13.61.101.100:3000/purchase/update-transaction-status",
                        {
                            order_id: options.order_id,
                            payment_id: paymentResponse.razorpay_payment_id,
                            status: "SUCCESS",
                        },
                        { headers: { Authorization: token } }
                    );

                    if (res.data.success) {
                        showToastResult("You are now a premium user!");
                        showPremiumUserMsg();
                        localStorage.setItem("token", res.data.token);
                    } else {
                        showToastResult("Payment processed, but update failed.");
                    }
                },
                modal: {
                    ondismiss: function () {
                        console.warn("Payment modal dismissed");
                    },
                },
            };

            // Step 3: Open Razorpay checkout modal
            const rzp1 = new Razorpay(options);
            rzp1.open();

            // Step 4: Handle payment failure
            rzp1.on("payment.failed", async function (errorResponse) {
                console.error("Payment failed:", errorResponse);

                if (errorResponse.error.metadata) {
                    const { order_id, payment_id } = errorResponse.error.metadata;

                    // Update transaction status to FAILED
                    await axios.post(
                        "http://13.61.101.100:3000/purchase/update-transaction-status",
                        {
                            order_id,
                            payment_id,
                            status: "FAILED",
                        },
                        { headers: { Authorization: token } }
                    );
                }

                showToastResult("Payment failed. Please try again.");
            });
        } catch (error) {
            console.error("Error initiating payment:", error);
            showToastResult("Unable to initiate payment. Please try again later.");
        }
    };
}


const showLogOutBtn = () => {
    const logOutBtn = document.createElement('a');
    logOutBtn.className = 'btn btn-light text-light';
    logOutBtn.role = 'button';
    logOutBtn.id = 'logOutBtn';
    logOutBtn.textContent = 'Log Out';
    logOutBtn.onclick = () => { 
        logOut();
        logOutBtn.href = "/FRONTEND/components/Layout/login.html";
    }

    const loginBtn = document.getElementById('loginBtn');
    const parentDiv = loginBtn.parentNode;

    parentDiv.replaceChild(logOutBtn, loginBtn);
}

const logOut = () => {
    const token = localStorage.getItem('token');
    if(!token) {
        showToastResult("User is already logged Out");
        return;
    }

    const tokenDelete = localStorage.removeItem("token");
    showToastResult("User sucessfully logged Out");
}