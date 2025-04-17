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
  const oneWeek = 7 * 24 * 60 * 60 * 1000;  // 7 days in milliseconds
  const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  const oneDay = 24 * 60 * 60 * 1000;  // 1 day in milliseconds

  const usersSnapshot = await db.collection("Users").get();
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'yellowbull2404@gmail.com',
      pass: 'qrryvbhunniwqkmu' // Ensure this is securely handled
    }
  });

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const { membershipEnd, email, userName, lastReminderSent, membership, carPlate, servicingBalance } = data;

    if (!membershipEnd || !email || !userName || membership === "Expired") continue;

    const endDate = membershipEnd.toDate();
    const timeLeft = endDate - now;

    // Generate the services list based on remaining servicing balance
    const validServicingBalance = servicingBalance && typeof servicingBalance === 'object' ? servicingBalance : {};
    let servicesList = '';
    Object.entries(validServicingBalance).forEach(([service, count]) => {
      if (count > 0) {
        servicesList += `<li>✅ ${service} (${count} left)</li>`;
      }
    });

    // Send reminder at H-1 month (30 days before expiration)
    if (timeLeft <= oneMonth && timeLeft > oneMonth - oneDay) { // within the last 24 hours of the 1 month mark
      const lastSent = lastReminderSent?.toDate();
      const shouldSend = !lastSent || (now - lastSent > oneDay);

      if (shouldSend) {
        const mailOptions = {
          from: 'yellowbull2404@gmail.com',
          to: email,
          subject: `Reminder: Your ${membership} Package with Yellow Bull SG is Expiring Soon!`,
          html: `<p>Dear ${userName} - ${carPlate},</p>
                 <p>We hope you're doing well! This is a friendly reminder that your ${membership} - Annual Car Care Package with YellowBull SG will expire on ${endDate.toDateString()}.</p>
                 <p>Before your package expires, don’t forget to use your remaining benefits:</p>
                 <ul>
                   ${servicesList || '<li>No remaining services left.</li>'}
                   <li>✅ Emergency roadside assistance</li>
                   <li>✅ FREE Vehicle pre-inspection</li>
                   <li>✅ FREE Towing to any workshop</li>
                   <li>✅ FREE Top-up air conditioning gas</li>
                   <li>✅ [X%] OFF Other services</li>
                 </ul>
                 <p>Renew your package today to ensure continued protection and benefits for your car! Contact us via:</p>
                 <p>📧 Email: yellowbull2404@gmail.com<br/>
                    📞 WhatsApp: +65 9101 3232 / +65 9101 2323 / +65 8206 1664</p>
                 <p>Check out other package plans and exclusive promotions on our website:</p>
                 <p>🌐 Website: www.yellowbull.com.sg</p>
                 <p>If you have any questions, feel free to reach out. We’ll be happy to assist you!</p>
                 <p>Thanks,<br/>YELLOW BULL PTE LTD</p>`
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`📧 Email sent to ${email} at H-1 month`);
          await doc.ref.update({
            lastReminderSent: admin.firestore.Timestamp.now() // Update the timestamp when reminder is sent
          });
        } catch (err) {
          console.error(`❌ Failed to send email to ${email}:`, err.message);
        }
      }
    }

    // Send reminder at H-7 days (7 days before expiration)
    if (timeLeft > 0 && timeLeft <= oneWeek) { // within the last 24 hours of the 7 days mark
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
          console.log(`📧 Email sent to ${email} at H-7 days`);
          await doc.ref.update({
            lastReminderSent: admin.firestore.Timestamp.now() // Update the timestamp when reminder is sent
          });
        } catch (err) {
          console.error(`❌ Failed to send email to ${email}:`, err.message);
        }
      }
    }

    // Reset lastReminderSent if membership is still valid and more than a week is left
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


    const servicesLeft = Object.entries(servicingBalance)
      .filter(([_, val]) => val > 0)  // Only include services that still have balance
      .map(([key, val]) => `${key}: ${val}`);


    const servicesOut = Object.entries(servicingBalance)
      .filter(([_, val]) => val === 0) // Check if any service has a balance of 0
      .map(([key, _]) => key);  // Extract the service names that have 0 balance


    if (servicesOut.length > 0) { // Send email if there are services with 0 balance
      let emailContent = `<p>Hi ${userName},</p>`;


      emailContent += `<p>We noticed that the following services have been used up:</p><ul>`;
      servicesOut.forEach(service => {
        emailContent += `<li>❌ ${service} (No balance left)</li>`;
      });
      emailContent += `</ul>`;


      if (servicesLeft.length > 0) {
        emailContent += `<p>Here is your remaining servicing balance:</p><ul>`;
        servicesLeft.forEach(service => {
          emailContent += `<li>✅ ${service}</li>`;
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
  }


  return null;
});






