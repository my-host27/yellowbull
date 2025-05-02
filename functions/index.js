const { onRequest } = require("firebase-functions/v2/https");
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


exports.sendRenewalReminder = onRequest({ region: "us-central1" }, async (req, res) =>{
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


    // Loop through the servicingBalance object to create a list of available services
    const serviceNames = [
      { name: 'Car Servicing', label: 'Car servicing(s) left (engine oil and original filter)' },
      { name: 'Roadside Assist', label: 'Emergency roadside assistance' },
      { name: 'Pre-Inspection', label: 'FREE Vehicle pre-inspection' },
      { name: 'Towing', label: 'FREE Towing to any workshop' },
      { name: 'Top-Up AC', label: 'FREE Top-up air conditioning gas' },
      { name: 'Jump Start', label: 'FREE Jump Start Services in Singapore' },
      { name: 'Breakdown Assist', label: 'Onsite Breakdown Assistance (Available in selected parts of Malaysia)' }
    ];


    // If the package is Towing Package, only show Towing-related services
    if (membership === 'Towing Package') {
      if (validServicingBalance['Towing'] > 0) {
        servicesList += `<div>✅ FREE Tows in Singapore</div>`;
      }


      if (validServicingBalance['Jump Start'] > 0) {
        servicesList += `<div>✅ FREE Jump Start Services in Singapore</div>`;
      }
      if (validServicingBalance['Breakdown Assist'] > 0) {
        servicesList += `<div>✅ Onsite Breakdown Assistance (Available in selected parts of Malaysia)</div>`;
      }
    } else {
      // For other packages, show all available services
      serviceNames.forEach(({ name, label }) => {
        if (validServicingBalance[name] > 0) {
          servicesList += `<div>✅ ${label} (${validServicingBalance[name]} left)</div>`;
        }
      });
    }


    // Customize email content based on package type
    let emailSubject = '';
    let emailBody = '';
    let discount = ''; // Default to no discount


    // Handling for Towing Package
    if (membership === 'Towing Package') {
      emailSubject = `Reminder: Your Towing Package with Yellow Bull SG is Expiring Soon!`;
      emailBody = `<p>Dear ${userName} - ${carPlate},</p>
                   <p>We hope you're doing well! This is a friendly reminder that your <b> Towing Package </b> with <b> YellowBull SG </b> will expire on <b>${endDate.toDateString()}</b>.</p>
                   <p>Before your package expires, don’t forget to use your remaining benefits:</p>


                     ${servicesList || '<div>No remaining services left.</div>'}
                   
                   <p><b>Renew your package today</b> to ensure continued protection and benefits for your car! Contact us via:</p>
                   <p>📧 <b>Email</b>: yellowbull2404@gmail.com<br/>
                      📞 <b>WhatsApp</b>: +65 9101 3232 / +65 9101 2323 / +65 8206 1664</p>
                   <p>Check out other package plans and exclusive promotions on our website:</p>
                   <p>🌐 <b>Website</b>: www.yellowbull.com.sg</p>
                   <p>If you have any questions, feel free to reach out. We’ll be happy to assist you!</p>
                   <p>Thanks,<br/>YELLOW BULL PTE LTD</p>`;
    } else if (membership === '5 Liters Castrol Oil') {
      discount = '15%'; // Specific discount for 5 Liters Castrol Oil package
      emailSubject = `Reminder: Your Annual Car Care Package with Yellow Bull SG is Expiring Soon!`;
      emailBody = `<p>Dear ${userName} - ${carPlate},</p>
                   <p>We hope you're doing well! This is a friendly reminder that your <b>${membership}</b> - <b>Annual Car Care Package</b> with <b>YellowBull SG<b> will expire on <b>${endDate.toDateString()}</b>.</p>
                   <p>Before your package expires, don’t forget to use your remaining benefits:</p>
                   
                     ${servicesList || '<div>No remaining services left.</div>'}
                     <div>✅ [${discount}] OFF Other services</div>
           
                   <p><b>Renew your package today</b> to ensure continued protection and benefits for your car! Contact us via:</p>
                   <p>📧 <b>Email</b>: yellowbull2404@gmail.com<br/>
                      📞 <b>WhatsApp</b>: +65 9101 3232 / +65 9101 2323 / +65 8206 1664</p>
                   <p>Check out other package plans and exclusive promotions on our website:</p>
                   <p>🌐 <b>Website</b>: www.yellowbull.com.sg</p>
                   <p>If you have any questions, feel free to reach out. We’ll be happy to assist you!</p>
                   <p>Thanks,<br/>YELLOW BULL PTE LTD</p>`;
    } else if (membership === '4 Liters Mega Oil basic') {
      // No discount for Mega Oil Basic
      emailSubject = `Reminder: Your Annual Car Care Package with Yellow Bull SG is Expiring Soon!`;
      emailBody = `<p>Dear ${userName} - ${carPlate},</p>
                   <p>We hope you're doing well! This is a friendly reminder that your <b>${membership}</b> - <b>Annual Car Care Package</b> with <b>YellowBull SG<b> will expire on <b>${endDate.toDateString()}</b>.</p>
                   <p>Before your package expires, don’t forget to use your remaining benefits:</p>


                     ${servicesList || '<div>No remaining services left.</div>'}


                   <p><b>Renew your package today</b> to ensure continued protection and benefits for your car! Contact us via:</p>
                   <p>📧 <b>Email</b>: yellowbull2404@gmail.com<br/>
                      📞 <b>WhatsApp</b>: +65 9101 3232 / +65 9101 2323 / +65 8206 1664</p>
                   <p>Check out other package plans and exclusive promotions on our website:</p>
                   <p>🌐 <b>Website</b>: www.yellowbull.com.sg</p>
                   <p>If you have any questions, feel free to reach out. We’ll be happy to assist you!</p>
                   <p>Thanks,<br/>YELLOW BULL PTE LTD</p>`;
    } else {
      discount = '10%'; // Default discount for other packages
      emailSubject = `Reminder: Your Annual Car Care Package with Yellow Bull SG is Expiring Soon!`;
      emailBody = `<p>Dear ${userName} - ${carPlate},</p>
                   <p>We hope you're doing well! This is a friendly reminder that your <b>${membership}</b> - <b>Annual Car Care Package</b> with <b>YellowBull SG<b> will expire on <b>${endDate.toDateString()}</b>.</p>
                   <p>Before your package expires, don’t forget to use your remaining benefits:</p>
                   
                     ${servicesList || '<div>No remaining services left.</div>'}
                     <div>✅ [${discount}] OFF Other services</div>
                 
                   <p><b>Renew your package today</b> to ensure continued protection and benefits for your car! Contact us via:</p>
                   <p>📧 <b>Email</b>: yellowbull2404@gmail.com<br/>
                      📞 <b>WhatsApp</b>: +65 9101 3232 / +65 9101 2323 / +65 8206 1664</p>
                   <p>Check out other package plans and exclusive promotions on our website:</p>
                   <p>🌐 <b>Website</b>: www.yellowbull.com.sg</p>
                   <p>If you have any questions, feel free to reach out. We’ll be happy to assist you!</p>
                   <p>Thanks,<br/>YELLOW BULL PTE LTD</p>`;
    }


    // Send reminder for both H-1 month and H-7 days with the same email body
    const sendReminder = async (timeLeft, subject, body) => {
      const lastSent = lastReminderSent?.toDate();
      const shouldSend = !lastSent || (now - lastSent > oneDay);


      if (shouldSend) {
        const mailOptions = {
          from: 'yellowbull2404@gmail.com',
          to: email,
          subject: subject,
          html: body
        };


        try {
          await transporter.sendMail(mailOptions);
          console.log(`📧 Email sent to ${email}`);
          await doc.ref.update({
            lastReminderSent: admin.firestore.Timestamp.now() // Update the timestamp when reminder is sent
          });
        } catch (err) {
          console.error(`❌ Failed to send email to ${email}:`, err.message);
        }
      }
    };


    // Send reminder at H-1 month (30 days before expiration)
    if (timeLeft <= oneMonth && timeLeft > oneMonth - oneDay) {
      await sendReminder(timeLeft, emailSubject, emailBody);
    }


    // Send reminder at H-7 days (7 days before expiration)
    if (timeLeft > 0 && timeLeft <= oneWeek) {
      await sendReminder(timeLeft, emailSubject, emailBody);
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
      const { servicingBalance, email, userName, membership, membershipStart, membershipEnd, carPlate, lastNotified, lastServicingBalance } = data;
  
      // Skip if data is missing or membership is expired
      if (!email || !userName || !servicingBalance || membership === "Expired" || !membershipStart || !membershipEnd) continue;
  
      const endDate = membershipEnd.toDate();
      const timeLeft = endDate - now;
  
      // Filter services with 0 balance
      const servicesOut = Object.entries(servicingBalance)
        .filter(([_, val]) => val === 0)
        .map(([key, _]) => key);
  
      // If there are no services with 0 balance, skip this user
      if (servicesOut.length === 0) continue;
  
      // Check if notification was already sent within the last 24 hours
      if (lastNotified && (now - lastNotified.toDate()) < 24 * 60 * 60 * 1000) {
        console.log(`⏱️ Skipping email for ${email} - notification already sent in the last 24 hours.`);
        continue;
      }
  
      // Check if servicing balance has changed
      const servicingBalanceChanged = JSON.stringify(servicingBalance) !== JSON.stringify(lastServicingBalance);
  
      // If servicing balance has not changed, skip sending email
      if (!servicingBalanceChanged) {
        console.log(`🔄 Skipping email for ${email} - no change in servicing balance.`);
        continue;
      }
  
      let emailSubject = '';
      let emailBody = '';
  
      // Construct email body based on package type
      if (membership === "Towing Package") {
        emailSubject = `Yellow Bull Towing Package Update: Your Remaining Package Balance`;
        emailBody = `<p>Dear ${userName} - ${carPlate},</p>
                     <p>We hope you're doing well! Here’s an update on your <b>Towing Package</b> with Yellow Bull SG.</p>
                     <p>Here’s your updated remaining balance:</p>`;
  
        if (servicingBalance['Towing'] > 0) emailBody += `<div>✅ FREE Tows in Singapore (${servicingBalance['Towing']} left)</div>`;
        if (servicingBalance['Jump Start'] > 0) emailBody += `<div>✅ FREE Jump Start Services in Singapore (${servicingBalance['Jump Start']} left)</div>`;
        if (servicingBalance['Breakdown Assist'] > 0) emailBody += `<div>✅ Onsite Breakdown Assistance (Available in selected parts of Malaysia) (${servicingBalance['Breakdown Assist']} left)</div>`;
  
        emailBody += `<p>Ensure you maximize your benefits before your package expires on <b>${endDate.toDateString()}</b>!</p>
                      <p>To book your next service or if you have any questions, feel free to contact us:</p>
                      <p>📧 <b>Email</b>: yellowbull2404@gmail.com<br/>📞 <b>WhatsApp</b>: +65 9101 3232 / +65 9101 2323 / +65 8206 1664</p>
                      <p>For more details about our services and package renewals, visit our website:</p>
                      <p>🌐 <b>Website</b>: www.yellowbull.com.sg</p>
                      <p>Thank you for choosing Yellow Bull SG!</p>
                      <p>Best regards,<br/>YELLOW BULL PTE LTD</p>`;
      } else {
        // Annual Car Care Package template
        emailSubject = `Yellow Bull Car Care Package Update: Your Remaining Servicing Balance`;
        emailBody = `<p>Dear ${userName} - ${carPlate},</p>
                     <p>We hope you're doing well! Here’s an update on your <b> ${membership} </b>- <b>Annual Car Care Package</b> with <b>Yellow Bull SG</b>.</p>
                     <p>Here’s your updated remaining balance:</p>`;
  
        if (servicingBalance['Car Servicing'] > 0) emailBody += `<div>✅ Car servicing(s) left (engine oil and original filter) (${servicingBalance['Car Servicing']} left)</div>`;
        if (servicingBalance['Roadside Assist'] > 0) emailBody += `<div>✅ Emergency roadside assistance (${servicingBalance['Roadside Assist']} left)</div>`;
        if (servicingBalance['Pre-Inspection'] > 0) emailBody += `<div>✅ FREE Vehicle pre-inspection (${servicingBalance['Pre-Inspection']} left)</div>`;
        if (servicingBalance['Towing'] > 0) emailBody += `<div>✅ FREE Towing to any workshop (${servicingBalance['Towing']} left)</div>`;
        if (servicingBalance['Top-Up AC'] > 0) emailBody += `<div>✅ FREE Top-up air conditioning gas (${servicingBalance['Top-Up AC']} left)</div>`;
  
        emailBody += `<p>Ensure you maximize your benefits before your package expires on <b>${endDate.toDateString()}</b>!</p>
                      <p>To book your next service or if you have any questions, feel free to contact us:</p>
                      <p>📧 <b>Email</b>: yellowbull2404@gmail.com<br/>📞 <b>WhatsApp</b>: +65 9101 3232 / +65 9101 2323 / +65 8206 1664</p>
                      <p>For more details about our services and package renewals, visit our website:</p>
                      <p>🌐 <b>Website</b>: www.yellowbull.com.sg</p>
                      <p>Thank you for choosing Yellow Bull SG!</p>
                      <p>Best regards,<br/>YELLOW BULL PTE LTD</p>`;
      }
  
      // Send the email
      const mailOptions = {
        from: 'yellowbull2404@gmail.com',
        to: email,
        subject: emailSubject,
        html: emailBody
      };
  
      try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Servicing email sent to ${email}`);
  
        // Update last notified timestamp and servicing balance
        await db.collection("Users").doc(doc.id).update({
          lastNotified: admin.firestore.FieldValue.serverTimestamp(),
          lastServicingBalance: servicingBalance // Save the current servicing balance for comparison
        });
      } catch (err) {
        console.error(`❌ Failed to send servicing reminder to ${email}:`, err.message);
      }
    }
  
    return null;
  });
  





















