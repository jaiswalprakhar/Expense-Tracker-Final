const Sib = require('sib-api-v3-sdk');
const client = Sib.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.EMAIL_API_KEY;

const transEmailApi = new Sib.TransactionalEmailsApi();

const brevoEmail = async (receiverEmail, uuid) =>  {
    const sender = {
        email: process.env.BREVO_SENDER_EMAIL_ID,
        name: process.env.BREVO_SENDER_NAME
    }
    
    const receivers = [
        {
            email: receiverEmail
        }
    ]
    
    const Emailmsg = await transEmailApi.sendTransacEmail({
        sender,
        to: receivers,
        subject: 'Reset password link',
        htmlContent: `<p>Change your password with the following link</p>
        <a href="/FRONTEND/components/Layout/updatePassword.html?uuid=${uuid}">Reset password link</a>`
    });

    return Emailmsg;
}

module.exports = brevoEmail;