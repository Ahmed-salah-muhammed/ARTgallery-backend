import nodemailer from "nodemailer";

const BRAND = "A R T. Gallery";

/**
 * Build a nodemailer transport from EMAIL_* env vars.
 * Returns null when SMTP isn't configured so callers can fall back to
 * console-logging the link (useful in local dev).
 */
function buildTransport() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, EMAIL_PASSWORD } = process.env;

  if (!EMAIL_HOST || !EMAIL_USERNAME || !EMAIL_PASSWORD) {
    return null;
  }

  const port = Number(EMAIL_PORT) || 587;

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port,
    secure: port === 465, // true for 465, false for 587/2525
    auth: {
      user: EMAIL_USERNAME,
      pass: EMAIL_PASSWORD,
    },
  });
}

function layout({ title, intro, buttonLabel, url, footer }) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#ffffff;color:#131b2e;">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-size:22px;font-weight:900;letter-spacing:0.18em;">${BRAND}</span>
    </div>
    <h1 style="font-size:22px;font-weight:900;margin:0 0 12px;">${title}</h1>
    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 24px;">${intro}</p>
    <div style="text-align:center;margin:0 0 28px;">
      <a href="${url}" style="display:inline-block;background:#131b2e;color:#ffffff;text-decoration:none;font-weight:800;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;padding:14px 32px;border-radius:12px;">${buttonLabel}</a>
    </div>
    <p style="font-size:12px;line-height:1.6;color:#94a3b8;margin:0 0 8px;">Or copy this link into your browser:</p>
    <p style="font-size:12px;word-break:break-all;color:#3a5594;margin:0 0 28px;"><a href="${url}" style="color:#3a5594;">${url}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 16px;" />
    <p style="font-size:11px;color:#94a3b8;margin:0;">${footer}</p>
  </div>`;
}

async function send({ to, subject, html }, devLabel, url) {
  const transport = buildTransport();

  // Always surface the link in the server log — handy for local testing and
  // as a fallback when SMTP credentials aren't configured.
  console.log(`\n✉  ${devLabel} for ${to}\n   ${url}\n`);

  if (!transport) {
    console.warn(
      "   (SMTP not configured — set EMAIL_HOST/EMAIL_USERNAME/EMAIL_PASSWORD in config/.env to actually send mail.)"
    );
    return;
  }

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM || `${BRAND} <no-reply@artgallery.com>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    // Don't fail the whole request if mail delivery hiccups — the link is logged.
    console.error(`   Email send failed: ${err.message}`);
  }
}

export async function sendVerificationEmail(user, url) {
  const html = layout({
    title: "Verify your email",
    intro: `Welcome to ${BRAND}, ${user.firstName}! Confirm your email address to activate your account. This link expires in 24 hours.`,
    buttonLabel: "Verify email",
    url,
    footer: `If you didn't create an account with ${BRAND}, you can safely ignore this email.`,
  });

  await send(
    { to: user.email, subject: `Verify your ${BRAND} account`, html },
    "Verification link",
    url
  );
}

export async function sendPasswordResetEmail(user, url) {
  const html = layout({
    title: "Reset your password",
    intro: `We received a request to reset the password for your ${BRAND} account. This link expires in 10 minutes.`,
    buttonLabel: "Reset password",
    url,
    footer: `If you didn't request a password reset, you can safely ignore this email — your password won't change.`,
  });

  await send(
    { to: user.email, subject: `Reset your ${BRAND} password`, html },
    "Password reset link",
    url
  );
}
