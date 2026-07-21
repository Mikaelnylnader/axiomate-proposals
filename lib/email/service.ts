import { Resend } from "resend";
import {
  clientSignedEmail,
  adminSignedNotification,
  bothSignedEmail,
  paymentConfirmationEmail,
  adminPaymentNotification,
  proposalLinkEmail,
} from "@/lib/email/templates";
import { formatMoney } from "@/lib/validation/money";

// ---- Low-level ----

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

async function send(to: string, subject: string, html: string) {
  const resend = getResend();
  if (!resend) return;
  const from = process.env.EMAIL_FROM || "AxiomateAI <onboarding@resend.dev>";
  await resend.emails.send({ from, to, subject, html });
}

function appUrl(path = ""): string {
  return `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${path}`;
}

// ---- High-level ----

export async function sendClientSignedEmails(params: {
  token: string;
  proposalNumber: string;
  proposalTitle: string;
  signerName: string;
  signerEmail: string;
}) {
  const { token, proposalNumber, proposalTitle, signerName, signerEmail } = params;
  const paymentLink = appUrl(`/p/${token}/pay`);
  const proposalLink = appUrl(`/p/${token}`);

  await send(
    signerEmail,
    `Agreement Signed — ${proposalNumber}`,
    clientSignedEmail({ clientName: signerName, proposalTitle, paymentLink }),
  );

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail) {
    await send(
      adminEmail,
      `Proposal Signed — ${proposalNumber}`,
      adminSignedNotification({ clientName: signerName, clientEmail: signerEmail, proposalNumber, proposalTitle, proposalLink }),
    );
  }
}

export async function sendAdminSignedEmail(params: {
  token: string;
  proposalNumber: string;
  proposalTitle: string;
  clientName: string;
  clientEmail: string;
}) {
  const { token, proposalNumber, proposalTitle, clientName, clientEmail } = params;
  const paymentLink = appUrl(`/p/${token}/pay`);

  await send(
    clientEmail,
    `Both Parties Signed — ${proposalNumber}`,
    bothSignedEmail({ clientName, proposalTitle, paymentLink }),
  );
}

export async function sendPaymentEmails(params: {
  token: string;
  proposalNumber: string;
  proposalTitle: string;
  amountMinor: number;
  currency: string;
  clientName: string;
  clientEmail: string;
}) {
  const { token, proposalNumber, proposalTitle, amountMinor, currency, clientName, clientEmail } = params;
  const amount = formatMoney(amountMinor, currency);
  const proposalLink = appUrl(`/p/${token}`);

  await send(
    clientEmail,
    `Payment Received — ${proposalNumber}`,
    paymentConfirmationEmail({ clientName, proposalNumber, proposalTitle, amount, proposalLink }),
  );

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail) {
    await send(
      adminEmail,
      `Payment Completed — ${proposalNumber}`,
      adminPaymentNotification({ clientName, clientEmail, proposalNumber, proposalTitle, amount }),
    );
  }
}

export async function sendProposalLink(params: {
  proposalNumber: string;
  proposalTitle: string;
  token: string;
  clientName: string;
  clientEmail: string;
}) {
  const { proposalNumber, proposalTitle, token, clientName, clientEmail } = params;
  const link = appUrl(`/p/${token}`);

  await send(
    clientEmail,
    `Your Proposal — ${proposalNumber}`,
    proposalLinkEmail({ clientName, proposalTitle, proposalLink: link }),
  );
}
