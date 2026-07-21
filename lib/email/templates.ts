const LOGO =
  "https://vibe.filesafe.space/1783600225777213225/attachments/c4378c64-e397-4302-8eb0-9bd2d8f57e57.png";

const BUTTON =
  "display:inline-block;padding:14px 28px;background:#f59e0b;color:#0a0a0a;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;";

function emailLayout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="padding:32px 40px 0 40px;text-align:center;">
        <img src="${LOGO}" alt="AxiomateAI" style="height:28px;margin-bottom:24px;" />
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 32px 40px;line-height:1.7;color:#333;font-size:15px;">
        ${body}
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px;background:#fafafa;border-top:1px solid #eee;text-align:center;font-size:12px;color:#999;">
        <p style="margin:0;">AxiomateAI &mdash; Signal-Based B2B Introductions</p>
        <p style="margin:4px 0 0 0;">
          <a href="https://axiomateai.com" style="color:#999;text-decoration:none;">axiomateai.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---- Templates ----

interface BaseParams {
  clientName: string;
  proposalNumber: string;
  proposalTitle: string;
}

interface LinkParams extends BaseParams {
  proposalLink: string;
}

interface PaymentParams extends BaseParams {
  proposalLink: string;
  paymentLink: string;
}

export function clientSignedEmail({
  clientName,
  proposalTitle,
  paymentLink,
}: {
  clientName: string;
  proposalTitle: string;
  paymentLink: string;
}): string {
  return emailLayout(`
    <h2 style="font-size:18px;font-weight:700;color:#111;margin:0 0 8px 0;">Agreement Signed</h2>
    <p style="margin:0 0 16px 0;">Hi ${clientName},</p>
    <p style="margin:0 0 16px 0;">
      You have signed the <strong>${proposalTitle}</strong>. The next step is to complete payment to begin the engagement.
    </p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${paymentLink}" style="${BUTTON}">Complete Payment &rarr;</a>
    </p>
    <p style="margin:16px 0 0 0;font-size:13px;color:#888;">
      If the button doesn't work, copy this link: <a href="${paymentLink}" style="color:#f59e0b;">${paymentLink}</a>
    </p>
  `);
}

export function adminSignedNotification({
  clientName,
  clientEmail,
  proposalNumber,
  proposalLink,
}: LinkParams & { clientEmail: string }): string {
  return emailLayout(`
    <h2 style="font-size:18px;font-weight:700;color:#111;margin:0 0 8px 0;">Proposal Signed</h2>
    <p style="margin:0 0 16px 0;">
      <strong>${clientName}</strong> (${clientEmail}) has signed the agreement.
    </p>
    <p style="margin:0 0 4px 0;"><strong>Proposal:</strong> ${proposalNumber}</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${proposalLink}" style="${BUTTON}">View Proposal &rarr;</a>
    </p>
  `);
}

export function bothSignedEmail({
  clientName,
  proposalTitle,
  paymentLink,
}: {
  clientName: string;
  proposalTitle: string;
  paymentLink: string;
}): string {
  return emailLayout(`
    <h2 style="font-size:18px;font-weight:700;color:#111;margin:0 0 8px 0;">Both Parties Signed</h2>
    <p style="margin:0 0 16px 0;">Hi ${clientName},</p>
    <p style="margin:0 0 16px 0;">
      Both you and the Connector have signed the <strong>${proposalTitle}</strong>. You can now complete payment to begin the engagement.
    </p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${paymentLink}" style="${BUTTON}">Complete Payment &rarr;</a>
    </p>
  `);
}

export function paymentConfirmationEmail({
  clientName,
  proposalNumber,
  proposalTitle,
  amount,
  proposalLink,
}: BaseParams & { amount: string; proposalLink: string }): string {
  return emailLayout(`
    <h2 style="font-size:18px;font-weight:700;color:#111;margin:0 0 8px 0;">Payment Received</h2>
    <p style="margin:0 0 16px 0;">Hi ${clientName},</p>
    <p style="margin:0 0 16px 0;">
      Your payment of <strong>${amount}</strong> for <strong>${proposalTitle}</strong> (${proposalNumber}) has been received. The engagement is now underway.
    </p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${proposalLink}" style="${BUTTON}">View Agreement &rarr;</a>
    </p>
  `);
}

export function adminPaymentNotification({
  clientName,
  clientEmail,
  proposalNumber,
  proposalTitle,
  amount,
}: BaseParams & { clientEmail: string; amount: string }): string {
  return emailLayout(`
    <h2 style="font-size:18px;font-weight:700;color:#111;margin:0 0 8px 0;">Payment Completed</h2>
    <p style="margin:0 0 16px 0;">
      <strong>${clientName}</strong> (${clientEmail}) has paid <strong>${amount}</strong>.
    </p>
    <p style="margin:0 0 4px 0;"><strong>Proposal:</strong> ${proposalNumber}</p>
    <p style="margin:0 0 4px 0;"><strong>Title:</strong> ${proposalTitle}</p>
  `);
}

export function proposalLinkEmail({
  clientName,
  proposalTitle,
  proposalLink,
}: Omit<LinkParams, "proposalNumber">): string {
  return emailLayout(`
    <h2 style="font-size:18px;font-weight:700;color:#111;margin:0 0 8px 0;">Your Proposal</h2>
    <p style="margin:0 0 16px 0;">Hi ${clientName},</p>
    <p style="margin:0 0 16px 0;">
      Your proposal is ready: <strong>${proposalTitle}</strong>. Please review and sign the agreement using the link below.
    </p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${proposalLink}" style="${BUTTON}">View &amp; Sign Proposal &rarr;</a>
    </p>
    <p style="margin:16px 0 0 0;font-size:13px;color:#888;">
      If the button doesn't work, copy this link: <a href="${proposalLink}" style="color:#f59e0b;">${proposalLink}</a>
    </p>
  `);
}
