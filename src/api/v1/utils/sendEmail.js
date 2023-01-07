import nodemailer from 'nodemailer';

const sendEmail = async (subject, message, send_to, sent_from, reply_to) => {
  // Create email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587, // according to documentation
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      // rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true,
      rejectUnauthorized: false,
    },
  });

  // Options for sending email
  const options = {
    from: sent_from,
    to: send_to,
    replyTo: reply_to,
    subject: subject,
    html: message,
  };

  // Send email
  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log('Error during sendMail ->', err);
    } else {
      console.log('Email sent successfully ->', info);
    }
  });
};

export default sendEmail;
