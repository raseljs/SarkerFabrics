import { isValidEmail } from "../../common/utils/security.js";

type EmailConfiguration = {
  emailProvider?: string; emailApiKey: string; emailFrom: string;
  emailSmtpHost: string; emailSmtpUser: string; emailSmtpPassword: string;
};

function credential(value: string) {
  const text = String(value || "").trim();
  return !!text && !/^(?:your[_ -]|replace[_ -]|placeholder|example|change[_ -]?me|<)/i.test(text);
}

export function resolveNotificationRecipient(explicit: string | undefined, smtpUser: string | undefined, adminEmail: string | undefined) {
  if (explicit?.trim()) return explicit.trim();
  for (const address of [smtpUser, adminEmail]) {
    const text = String(address || "").trim();
    if (isValidEmail(text)) return text;
  }
  return "";
}

export function resolveEmailProvider(config: EmailConfiguration): "smtp" | "api" | undefined {
  const choice = String(config.emailProvider || "auto").trim().toLowerCase();
  const smtp = credential(config.emailSmtpHost) && credential(config.emailSmtpUser) && credential(config.emailSmtpPassword);
  const api = credential(config.emailApiKey);
  if (choice === "smtp") return smtp ? "smtp" : undefined;
  if (choice === "api") return api ? "api" : undefined;
  if (choice !== "auto") return undefined;
  // Preserve API-first behavior; an explicit provider prevents mixed credentials
  // from selecting a different transport than the administrator intended.
  return api ? "api" : smtp ? "smtp" : undefined;
}

export function resolveEmailSender(config: EmailConfiguration, provider: "smtp" | "api") {
  const sender = String(config.emailFrom || "").trim();
  if (provider === "smtp" && (!sender || /(?:^|<)onboarding@resend\.dev(?:>|$)/i.test(sender))) {
    const account = config.emailSmtpUser.trim();
    return isValidEmail(account) ? "Sarker Fabrics <" + account + ">" : account;
  }
  return sender || "Sarker Fabrics <onboarding@resend.dev>";
}
