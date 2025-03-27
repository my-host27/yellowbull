const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const cors = require("cors")({ origin: true }); // tambahkan ini

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'zahrinacandrakanti@gmail.com',
    pass: 'kmjrqqktalayennh'
  }
});

exports.sendRenewalReminder = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {  // bungkus logika dengan CORS handler
    const { to, name } = req.body;

    console.log("📥 Received data:", req.body);

    if (!to) {
      console.error("❌ 'to' email is missing from data:", req.body);
      return res.status(400).send({ error: "'to' (email tujuan) is missing" });
    }

    const mailOptions = {
      from: 'zahrinacandrakanti@gmail.com',
      to,
      subject: '⏰ Membership Renewal Reminder',
      html: `<p>Hi ${name || "there"},</p>
             <p>Your membership is about to expire. Please contact admin to renew.</p>
             <p>Best regards,<br/>Yellowbull Team</p>`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("✅ Email successfully sent to:", to);
      return res.send({ success: true });
    } catch (error) {
      console.error("❌ Email send error:", error);
      return res.status(500).send({ error: "Failed to send email." });
    }
  });
});
