const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors'); 

const app = express();
const port = process.env.PORT || 3000; 

app.use(cors({
    origin: '*' 
}));
app.use(bodyParser.json()); 

const emailUser = process.env.EMAIL_USER || 'Info@vitalfood.com.au'; 
const emailPass = process.env.EMAIL_PASS || 'Pw# Vit@l5ood'; 
const smtpHost = process.env.SMTP_HOST || 'SMTP.hostinger.com';
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465; 
const secureConnection = smtpPort === 465; 

const contactEmailRecipient = process.env.CONTACT_EMAIL_RECIPIENT || 'contact@vitalfood.com.au'; 

let transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: secureConnection, 
    auth: {
        user: emailUser,
        pass: emailPass
    },
    tls: {
    }
});

transporter.verify(function (error, success) {
    if (error) {
        console.error("SMTP Transporter Error:", error);
    } else {
        console.log("Server is ready to take our messages");
    }
});

app.post('/send-order-email', async (req, res) => {
    const { cartItems, cartTotal, customerName, customerEmail, customerMobile } = req.body; 
    if (!cartItems || !cartTotal || !customerName || !customerEmail || !customerMobile) { 
        return res.status(400).json({ success: false, message: 'Missing required order details.' });
    }

    let orderDetailsHtml = `
        <h2>New Order from Vital Foods Website</h2>
        <p><strong>Customer Name:</strong> ${customerName}</p>
        <p><strong>Customer Email:</strong> ${customerEmail}</p>
        <p><strong>Customer Mobile:</strong> ${customerMobile}</p>
        <h3>Order Details:</h3>
        <table border="1" style="width:100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Price Each</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    `;

    cartItems.forEach(item => {
        orderDetailsHtml += `
            <tr>
                <td>${item.name}</td>
                <td>${item.description} - ${item.quantity} Month(s)</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `;
    });

    orderDetailsHtml += `
            </tbody>
        </table>
        <h3>Cart Total: $${cartTotal.toFixed(2)}</h3>
    `;

    let mailOptions = {
        from: emailUser,
        to: emailUser, 
        subject: `New Order from ${customerName}`,
        html: orderDetailsHtml
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Order email sent successfully.' });
    } catch (error) {
        console.error('Error sending order email:', error);
        res.status(500).json({ success: false, message: 'Failed to send order email.', error: error.message });
    }
});

app.post('/send-contact-email', async (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    let contactEmailHtml = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <h3>Message:</h3>
        <p>${message}</p>
    `;

    let mailOptions = {
        from: emailUser,
        to: contactEmailRecipient, 
        subject: `New Contact Message from ${name}`,
        html: contactEmailHtml
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Contact email sent successfully.' });
    } catch (error) {
        console.error('Error sending contact email:', error);
        res.status(500).json({ success: false, message: 'Failed to send contact email.', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});