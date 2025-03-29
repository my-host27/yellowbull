const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const cors = require("cors")({ origin: true }); // tambahkan ini
const admin = require("firebase-admin");
admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'yellowbull2404@gmail.com',
    pass: 'qrryvbhunniwqkmu'
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
      from: 'yellowbull2404@gmail.com',
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
const { onSchedule } = require("firebase-functions/v2/scheduler");

exports.scheduledMembershipReminder = onSchedule("every 24 hours", async (event) => {
  const db = admin.firestore();
  const now = new Date();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const oneDay = 24 * 60 * 60 * 1000;

  const usersSnapshot = await db.collection("Users").get();
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'yellowbull2404@gmail.com',
      pass: 'qrryvbhunniwqkmu'
    }
  });

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const { membershipEnd, email, userName, lastReminderSent, membership } = data;

    if (!membershipEnd || !email || !userName || membership === "Expired") continue;

    const endDate = membershipEnd.toDate();
    const timeLeft = endDate - now;

    // kirim jika tinggal 7 hari dan belum expired
    if (timeLeft > 0 && timeLeft <= oneWeek) {
      const lastSent = lastReminderSent?.toDate();
      const shouldSend = !lastSent || (now - lastSent > oneDay);

      if (shouldSend) {
        const mailOptions = {
          from: 'yellowbull2404@gmail.com',
          to: email,
          subject: '⏰ Membership Renewal Reminder',
          html: `<p>Hi ${userName},</p>
                 <p>Your membership will expire on ${endDate.toDateString()}. Please contact admin to renew.</p>
                 <p>Best regards,<br/>Yellowbull Team</p>`
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`📧 Email sent to ${email}`);
          await doc.ref.update({
            lastReminderSent: admin.firestore.Timestamp.now()
          });
        } catch (err) {
          console.error(`❌ Failed to send email to ${email}:`, err.message);
        }
      }
    }

    // reset lastReminderSent jika membership masih jauh
    if (timeLeft > oneWeek && lastReminderSent) {
      await doc.ref.update({ lastReminderSent: admin.firestore.FieldValue.delete() });
    }
  }

  return null;
});

exports.scheduledServicingReminder = onSchedule("every 24 hours", async (event) => {
  const db = admin.firestore();
  const usersSnapshot = await db.collection("Users").get();
  const now = new Date();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'yellowbull2404@gmail.com',
      pass: 'qrryvbhunniwqkmu'
    }
  });

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const { servicingBalance, email, userName, membership, membershipStart } = data;

    if (!email || !userName || !servicingBalance || membership === "Expired" || !membershipStart) continue;

    const start = membershipStart.toDate();
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

    const isReminderDay =
      diffMonths % 3 === 0 &&
      now.getDate() === start.getDate() &&
      now.getHours() < 6;  // biar cuma kirim 1x per hari

    if (!isReminderDay) continue;

    const servicesLeft = Object.entries(servicingBalance)
      .filter(([_, val]) => val > 0)
      .map(([key, val]) => `${key}: ${val}`);

    let emailContent = `<p>Hi ${userName},</p>`;

    if (servicesLeft.length > 0) {
      emailContent += `<p>Here is your remaining servicing balance:</p><ul>`;
      servicesLeft.forEach(service => {
        emailContent += `<li>${service}</li>`;
      });
      emailContent += `</ul><p>Use them before your membership expires.</p>`;
    } else {
      emailContent += `<p>All your servicing balances have been used.</p><p>Please consider renewing your membership to continue enjoying our services.</p>`;
    }

    emailContent += `<p>Best regards,<br/>Yellowbull Team</p>`;

    const mailOptions = {
      from: 'yellowbull2404@gmail.com',
      to: email,
      subject: '🔧 Servicing Balance Reminder',
      html: emailContent
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Servicing email sent to ${email}`);
    } catch (err) {
      console.error(`❌ Failed to send servicing reminder to ${email}:`, err.message);
    }
  }

  return null;
});

