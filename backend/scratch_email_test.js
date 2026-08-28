const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sribathrinathanr.cse2023@citchennai.net',
    pass: 'yrghawsshjegbcsu'
  },
  connectionTimeout: 10000,
  socketTimeout: 10000
});

const mailOptions = {
  from: '"UPS Smart Billing" <sribathrinathanr.cse2023@citchennai.net>',
  to: 'sribathrinathanr.cse2023@citchennai.net', // Send to self
  subject: 'Test Email',
  text: 'This is a test email.'
};

transporter.sendMail(mailOptions)
  .then(info => console.log('Email sent successfully:', info.response))
  .catch(err => console.error('Email error:', err));
