const siteUrl = "https://galstyansspeakingclub.ru";
const logoUrl = `${siteUrl}/gsc-logo.jpg`;

function actionButton(href, label) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:28px 0 24px"><tr><td align="center"><a href="${href}" style="display:inline-block;background:#ff5a1f;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:700;line-height:20px;padding:15px 26px;border-radius:999px">${label}</a></td></tr></table>`;
}

function confirmationLink(type, next) {
  return `${siteUrl}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=${type}&amp;next=${encodeURIComponent(next)}`;
}

function emailShell({ preheader, heading, content }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f4efe6;color:#07101c">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f4efe6">
    <tr>
      <td align="center" style="padding:28px 12px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#ffffff;border-radius:20px;overflow:hidden">
          <tr>
            <td align="center" style="background:#07101c;padding:30px 24px 26px">
              <img src="${logoUrl}" width="64" height="64" alt="Galstyan’s Speaking Club" style="display:block;width:64px;height:64px;border:0;border-radius:50%;object-fit:cover">
              <div style="margin-top:14px;font-family:Arial,sans-serif;font-size:18px;font-weight:700;line-height:24px;color:#ffffff">Galstyan’s Speaking Club</div>
              <div style="margin-top:5px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.4px;line-height:20px;color:#ff7b47">ENGLISH ON.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:38px 34px 30px;font-family:Arial,sans-serif">
              <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:32px;font-weight:600;line-height:40px;color:#07101c">${heading}</h1>
              ${content}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 24px;background:#f7f2e9;border-top:1px solid #e9e1d5;font-family:Arial,sans-serif;font-size:12px;line-height:19px;color:#6d7480">
              <strong style="color:#07101c">Galstyan’s Speaking Club</strong><br>
              Sergiyev Posad<br>
              <a href="${siteUrl}" style="color:#6d7480;text-decoration:underline">galstyansspeakingclub.ru</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const paragraph = (text) => `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:16px;line-height:26px;color:#394454">${text}</p>`;

function hostBlock() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:26px 0"><tr><td style="padding:20px 22px;background:#f7f2e9;border-left:4px solid #ff5a1f;font-family:Arial,sans-serif;color:#394454"><div style="font-size:12px;font-weight:700;letter-spacing:1.2px;line-height:18px;text-transform:uppercase;color:#7a6757">Hosted by</div><div style="margin-top:5px;font-size:17px;font-weight:700;line-height:24px;color:#07101c">Gevorg Galstyan</div><div style="margin-top:3px;font-size:14px;line-height:22px">Yerevan 🇦🇲 → Sergiyev Posad</div><div style="margin-top:12px;font-family:Georgia,serif;font-size:15px;font-style:italic;line-height:22px;color:#07101c">Practice makes perfect.</div></td></tr></table>`;
}

export const authEmailConfig = {
  mailer_subjects_confirmation: "Welcome to Galstyan’s Speaking Club — confirm your email",
  mailer_templates_confirmation_content: emailShell({
    preheader: "Confirm your email to activate your GSC member profile.",
    heading: "Welcome to the club 👋",
    content:
      paragraph("Thanks for joining Galstyan’s Speaking Club.") +
      paragraph("Confirm your email address to activate your member profile and get access to meetups, attendance history, loyalty progress, and your member account.") +
      actionButton(confirmationLink("signup", "/account"), "Confirm my email") +
      paragraph("We’re a local English-speaking community in Sergiyev Posad where people meet, talk, practice English, and build confidence through real conversations.") +
      hostBlock() +
      paragraph("If you did not create this account, you can safely ignore this email."),
  }),

  mailer_subjects_recovery: "Reset your Galstyan’s Speaking Club password",
  mailer_templates_recovery_content: emailShell({
    preheader: "Use this secure link to reset your GSC password.",
    heading: "Reset your password",
    content:
      paragraph("We received a request to reset the password for your member account.") +
      actionButton(confirmationLink("recovery", "/reset-password"), "Reset my password") +
      paragraph("If you didn’t request this, you can safely ignore this email. Your password has not changed."),
  }),

  mailer_subjects_magic_link: "Your Galstyan’s Speaking Club sign-in link",
  mailer_templates_magic_link_content: emailShell({
    preheader: "Your secure one-time link to the GSC member space.",
    heading: "Sign in securely",
    content:
      paragraph("Use this one-time link to sign in to your member profile.") +
      actionButton(confirmationLink("magiclink", "/account"), "Continue to my account") +
      paragraph("If you didn’t request this link, you can safely ignore this email."),
  }),

  mailer_subjects_email_change: "Confirm your new Galstyan’s Speaking Club email",
  mailer_templates_email_change_content: emailShell({
    preheader: "Confirm the new email address for your GSC account.",
    heading: "Confirm your new email",
    content:
      paragraph("A request was made to change the email address on your member profile to {{ .NewEmail }}.") +
      actionButton(confirmationLink("email_change", "/account"), "Confirm email change") +
      paragraph("If you didn’t request this change, do not confirm it."),
  }),

  mailer_subjects_invite: "You’re invited to Galstyan’s Speaking Club",
  mailer_templates_invite_content: emailShell({
    preheader: "Accept your invitation to the GSC member space.",
    heading: "You’re invited",
    content:
      paragraph("You’ve been invited to create a Galstyan’s Speaking Club member profile.") +
      actionButton(confirmationLink("invite", "/account"), "Accept invitation") +
      paragraph("If you weren’t expecting this invitation, you can safely ignore this email."),
  }),

  mailer_subjects_reauthentication: "{{ .Token }} is your Galstyan’s Speaking Club verification code",
  mailer_templates_reauthentication_content: emailShell({
    preheader: "Your one-time GSC account verification code.",
    heading: "Verify it’s you",
    content:
      paragraph("Enter this one-time code to continue with the sensitive account action you requested.") +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:26px 0"><tr><td align="center" style="padding:18px;background:#f7f2e9;border:1px solid #e9e1d5;border-radius:14px;font-family:Arial,sans-serif;font-size:30px;font-weight:800;letter-spacing:8px;color:#07101c">{{ .Token }}</td></tr></table>` +
      paragraph("If you didn’t request this code, you can safely ignore this email."),
  }),

  mailer_notifications_password_changed_enabled: true,
  mailer_subjects_password_changed_notification: "Your Galstyan’s Speaking Club password was changed",
  mailer_templates_password_changed_notification_content: emailShell({
    preheader: "Security notice for your GSC member account.",
    heading: "Your password was changed",
    content:
      paragraph("The password for your Galstyan’s Speaking Club member account was changed.") +
      paragraph("If you made this change, no action is needed. If you didn’t, return to the website and reset your password immediately."),
  }),
};

export const productionAuthUrlConfig = {
  site_url: siteUrl,
  uri_allow_list: `${siteUrl}/**,https://www.galstyansspeakingclub.ru/**`,
};
