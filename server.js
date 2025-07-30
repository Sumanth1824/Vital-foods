// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors'); // Required for cross-origin requests from your frontend

const app = express();
const port = process.env.PORT || 3000; // Server will run on port 3000 by default, or an environment variable

// --- Middleware ---
// Enable CORS for all origins (for development). In production, restrict to your frontend domain.
app.use(cors({
    origin: '*' // IMPORTANT: In production, change this to your actual frontend domain, e.g., 'https://yourdomain.com'
}));
app.use(bodyParser.json()); // To parse JSON request bodies

// --- Email Configuration (Hostinger SMTP) ---
// It's highly recommended to use environment variables for sensitive data like passwords.
// For example, on your server:
// process.env.EMAIL_USER = 'your_orders_email@yourdomain.com';
// process.env.EMAIL_PASS = 'YourEmailPassword';
// process.env.SMTP_HOST = 'smtp.hostinger.com';
// process.env.SMTP_PORT = '465'; // Or '587' for TLS

const emailUser = process.env.EMAIL_USER || 'your_orders_email@yourdomain.com'; // Replace with your Hostinger email (sender for both)
const emailPass = process.env.EMAIL_PASS || 'YourEmailPassword'; // Replace with your Hostinger email password
const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465; // Use 465 for SSL, 587 for TLS
const secureConnection = smtpPort === 465; // true for 465, false for other ports like 587

// New: Dedicated recipient for contact form emails
const contactEmailRecipient = process.env.CONTACT_EMAIL_RECIPIENT || 'contact@vitalfood.com.au'; // <<< New recipient email for contact form

// Create a Nodemailer transporter using your Hostinger SMTP details
let transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: secureConnection, // true for 465, false for other ports like 587
    auth: {
        user: emailUser,
        pass: emailPass
    },
    tls: {
        // Do not fail on invalid certs (use only if necessary and understand risks)
        // rejectUnauthorized: false
    }
});

// Verify transporter connection (optional, but good for debugging)
transporter.verify(function (error, success) {
    if (error) {
        console.error("SMTP Transporter Error:", error);
    } else {
        console.log("Server is ready to take our messages");
    }
});

// --- API Endpoint for Order Submission (Existing) ---
app.post('/send-order-email', async (req, res) => {
    const { cartItems, cartTotal, customerName, customerEmail, customerMobile } = req.body; // Added customerMobile

    // Basic validation
    if (!cartItems || !cartTotal || !customerName || !customerEmail || !customerMobile) { // Added customerMobile to validation
        return res.status(400).json({ success: false, message: 'Missing required order details.' });
    }

    // Prepare email content
    let emailHtml = `
        <h1>New Order from Smoothie Juicy!</h1>
        <p><strong>Customer Name:</strong> ${customerName}</p>
        <p><strong>Customer Email:</strong> ${customerEmail}</p>
        <p><strong>Customer Mobile:</strong> ${customerMobile}</p> <!-- Added customerMobile -->
        <h2>Order Details:</h2>
    `;

    if (cartItems && cartItems.length > 0) {
        emailHtml += `
            <table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Options</th>
                        <th>Price Each</th>
                        <th>Quantity</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        cartItems.forEach(item => {
            const itemTotal = (item.price * item.quantity).toFixed(2);
            emailHtml += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.options || 'N/A'}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>$${itemTotal}</td>
                </tr>
            `;
        });
        emailHtml += `
                </tbody>
            </table>
        `;
    } else {
        emailHtml += `<p>No items in this order.</p>`;
    }

    emailHtml += `
        <p><strong>Order Total: $${cartTotal}</strong></p>
        <p>Thank you!</p>
        <p>Smoothie Juicy Team</p>
    `;

    const mailOptions = {
        from: emailUser, // Sender address (your Hostinger email)
        to: emailUser,   // Recipient address (where you want to receive orders)
        // You can also send a copy to the customer:
        // cc: customerEmail,
        subject: `New Smoothie Juicy Order from ${customerName}`,
        html: emailHtml,
        text: `New Order from Smoothie Juicy!\n\nCustomer Name: ${customerName}\nCustomer Email: ${customerEmail}\nCustomer Mobile: ${customerMobile}\n\nOrder Total: $${cartTotal}\n\nOrder Items:\n${cartItems.map(item => `${item.name} (${item.options || 'N/A'}) - Qty: ${item.quantity} - Price: $${item.price.toFixed(2)} - Total: $${(item.price * item.quantity).toFixed(2)}`).join('\n')}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Order email sent successfully to:', emailUser);
        res.status(200).json({ success: true, message: 'Order placed and email sent!' });
    } catch (error) {
        console.error('Error sending order email:', error);
        res.status(500).json({ success: false, message: 'Failed to send order email.' });
    }
});

// --- NEW API Endpoint for Contact Form Submission ---
app.post('/send-contact-email', async (req, res) => {
    const { name, email, message, subject } = req.body;

    // Basic validation
    if (!name || !email || !message || !subject) {
        return res.status(400).json({ success: false, message: 'Missing required contact form details.' });
    }

    // Prepare email content for contact form
    const emailHtml = `
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <h2>Message:</h2>
        <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    const mailOptions = {
        from: emailUser, // Sender address (your Hostinger email)
        to: contactEmailRecipient,   // <<< Now sending to the specific contact email recipient
        replyTo: email,  // Set reply-to to the customer's email
        subject: `Contact Form: ${subject} from ${name}`,
        html: emailHtml,
        text: `New Contact Form Submission:\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Contact form email sent successfully to:', contactEmailRecipient); // Log the correct recipient
        res.status(200).json({ success: true, message: 'Contact message sent successfully!' });
    } catch (error) {
        console.error('Error sending contact form email:', error);
        res.status(500).json({ success: false, message: 'Failed to send contact message.' });
    }
});


// --- Start the server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`Email User: ${emailUser}`);
});
