import { env } from "../config/env.js";
import { sendNotificationEmail } from "../modules/notifications/email.service.js";

const now = new Date();
const result = await sendNotificationEmail({
  to: env.notificationEmail,
  subject: `Drone Bangladesh email test — ${now.toISOString()}`,
  text: `Email delivery test from Drone Bangladesh backend at ${now.toISOString()}. If you received this message, production email credentials are working.`,
  html: `<div style="font-family:Arial,sans-serif"><h2>Drone Bangladesh email test</h2><p>Email delivery is working.</p><p>${now.toISOString()}</p></div>`,
});

if (!result.sent) {
  console.error("Email was NOT sent:", result);
  process.exit(1);
}
console.log(`Email sent successfully to ${env.notificationEmail}`, result);
