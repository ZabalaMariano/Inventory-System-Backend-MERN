import asyncHandler from 'express-async-handler';
import sendEmail from '../utils/sendEmail.js';

/* Contact us */
/**
 * Method:
 * POST
 *
 * Middleware:
 * protect
 *
 * Body:
 * subject
 * message
 */
const contactUs = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;

  const user = req.user;

  // Validation
  if (!subject || !message) {
    res.status(400);
    throw new Error('Subject y Message son requeridos');
  }

  const send_to = process.env.EMAIL_USER;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = user.email;

  await sendEmail(subject, message, send_to, sent_from, reply_to);
  res.status(200).send({
    message: 'Email sent!',
  });
});

export { contactUs };
