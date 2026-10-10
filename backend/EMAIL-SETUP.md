# Admin order notifications

New orders notify the administrator after checkout succeeds. Customer email is not required for this alert.

- `NOTIFICATION_EMAIL` is the recipient. When blank, the server uses a valid `EMAIL_SMTP_USER`, then `ADMIN_EMAIL`.
- `EMAIL_PROVIDER=auto` uses the email API when a non-placeholder key exists, otherwise complete SMTP credentials. Use `smtp` or `api` to select one explicitly.
- For Gmail SMTP, configure host, port, secure flag, account and app password. A Resend onboarding sender automatically becomes the SMTP account when using SMTP.
- For Resend, `onboarding@resend.dev` is a test sender and can send only to the Resend account's own address. Use a verified domain and matching `EMAIL_FROM` for production recipients: https://resend.com/docs/api-reference/errors#validation-error-2
- Restart the backend after editing its .env file.

The server logs whether the provider accepted an admin notification or a safe error code. Acceptance does not confirm Gmail inbox delivery. Mail failures keep the order saved and are not automatically retried, avoiding duplicate messages after uncertain results.
