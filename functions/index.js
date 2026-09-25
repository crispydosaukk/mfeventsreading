const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors")({ origin: true });
const path = require("path");
const fs = require("fs");

setGlobalOptions({ region: "europe-west2" });

if (!admin.apps.length) {
  admin.initializeApp();
}

const logoFilePath = path.join(__dirname, "assets", "logomf.png");
const hasLocalLogo = fs.existsSync(logoFilePath);
const logoSrc = hasLocalLogo ? "cid:madrasflavourslogo" : "https://madrasflavourseventreading.co.uk/assets/images/logomf.png";
const emailAttachments = hasLocalLogo
  ? [{ filename: "logomf.png", path: logoFilePath, cid: "madrasflavourslogo" }]
  : [];

async function fetchEmailConfig() {
  const defaultConfig = {
    enabled: true,
    recipients: ["rahulbadugu22@gmail.com", "catering@madrasflavours.co.uk", "Digitalbotsolutions@gmail.com"],
    sendCustomerConfirmation: true,
    smtp: {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      user: process.env.SMTP_USER || process.env.EMAIL_USER || "mfcentralkitchen@gmail.com",
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || "rfznermtzbowtinn",
      fromName: "Madras Flavours Events",
      fromEmail: process.env.SMTP_FROM || "mfcentralkitchen@gmail.com",
    },
  };
  try {
    const db = admin.firestore();
    const snap = await db.collection("site_data").doc("email_settings").get();
    if (snap.exists) {
      const data = snap.data() || {};
      const enabled = data.enabled !== false;
      let recipients = [];
      if (Array.isArray(data.recipients) && data.recipients.length > 0) {
        recipients = data.recipients
          .filter((r) => r && r.enabled !== false && typeof r.email === "string" && r.email.includes("@"))
          .map((r) => r.email.trim().toLowerCase());
      } else if (typeof data.emails === "string" && data.emails.trim().length > 0) {
        recipients = data.emails.split(",").map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"));
      }
      if (recipients.length === 0) recipients = defaultConfig.recipients;
      const smtpData = data.smtp || {};
      const smtp = {
        host: smtpData.host || defaultConfig.smtp.host,
        port: Number(smtpData.port) || defaultConfig.smtp.port,
        secure: Boolean(smtpData.secure),
        user: smtpData.user || defaultConfig.smtp.user,
        pass: smtpData.pass || defaultConfig.smtp.pass,
        fromName: smtpData.fromName || defaultConfig.smtp.fromName,
        fromEmail: smtpData.fromEmail || smtpData.user || defaultConfig.smtp.fromEmail,
      };
      return { enabled, recipients, sendCustomerConfirmation: data.sendCustomerConfirmation !== false, smtp };
    }
    const legacySnap = await db.collection("site_data").doc("notification_settings").get();
    if (legacySnap.exists) {
      const leg = legacySnap.data() || {};
      const enabled = leg.enabled !== false;
      let recipients = [];
      if (typeof leg.emails === "string" && leg.emails.trim().length > 0) {
        recipients = leg.emails.split(",").map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"));
      }
      return { ...defaultConfig, enabled, recipients: recipients.length > 0 ? recipients : defaultConfig.recipients };
    }
  } catch (err) {
    console.error("Error fetching email configuration:", err);
  }
  return defaultConfig;
}

function buildAdminEmailHtml(data, bookingId) {
  const name = data.name || "Customer";
  const phone = data.phone || "N/A";
  const email = data.email || "N/A";
  const date = data.date || "To be confirmed";
  const timeOfDay = data.timeOfDay || data.timeSession || "Flexible";
  const eventType = data.eventType || "Catering";
  const serviceType = data.serviceType || "Standard";
  const guests = data.guests || data.totalGuests || "N/A";
  const postCode = data.postCode || data.address || "N/A";
  const packageChosen = data.selectedPackage || data.package || data.selectedMenu || "Not Selected";
  const baseAmount = data.baseAmount ? `\u00a3${Number(data.baseAmount).toFixed(2)}` : null;
  const totalAmount = (data.totalAmount || data.grandTotal) ? `\u00a3${Number(data.totalAmount || data.grandTotal).toFixed(2)}` : null;
  const deposit = data.deposit ? `\u00a3${Number(data.deposit).toFixed(2)}` : null;
  const message = data.message || data.notes || "";
  const cleanPhone = phone.replace(/[^0-9+]/g, "");
  const cleanWhatsAppDigits = cleanPhone.replace(/\D/g, "");
  const whatsappLink = cleanWhatsAppDigits ? `https://api.whatsapp.com/send?phone=${cleanWhatsAppDigits}` : null;
  const guestsBreakdown = [
    data.adults !== undefined && data.adults !== null ? `${data.adults} Adults` : null,
    data.kids4to10 !== undefined && data.kids4to10 > 0 ? `${data.kids4to10} Kids (4-10)` : null,
    data.kidsUnder4 !== undefined && data.kidsUnder4 > 0 ? `${data.kidsUnder4} Kids (<4)` : null,
  ].filter(Boolean).join(" \u2022 ");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>New Booking Order</title></head>
<body style="margin:0;padding:0;background-color:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0F172A;"><tr><td align="center" style="padding:24px 8px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background-color:#FFFFFF;border-radius:18px;overflow:hidden;box-shadow:0 10px 35px rgba(0,0,0,0.3);border:1px solid #1E293B;">
<tr><td style="background:linear-gradient(135deg,#1A0A0A 0%,#2D1500 50%,#1A1000 100%);padding:28px 24px;text-align:center;border-bottom:3px solid #F5A623;">
<div style="margin-bottom:12px;"><img src="${logoSrc}" alt="Madras Flavours Events" width="180" style="max-width:180px;height:auto;display:block;margin:0 auto;" /></div>
<span style="display:inline-block;background:rgba(245,166,35,0.2);color:#FCD34D;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;padding:5px 14px;border-radius:20px;border:1px solid rgba(245,166,35,0.4);margin-bottom:8px;">&#128276; NEW BOOKING ORDER RECEIVED</span>
<h1 style="color:#FFFFFF;margin:0;font-size:22px;font-weight:800;">Madras Flavours Events</h1>
<p style="color:#FCD34D;font-size:13px;font-weight:600;margin:6px 0 0 0;">Authentic South Indian Catering &middot; Reading</p>
</td></tr>
<tr><td style="padding:28px 24px;background-color:#FFFFFF;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;margin-bottom:20px;">
<tr><td style="padding:12px 18px;background-color:#F1F5F9;border-bottom:1px solid #E2E8F0;"><span style="font-size:11px;font-weight:800;text-transform:uppercase;color:#475569;">&#128100; Customer Contact Profile</span></td></tr>
<tr><td style="padding:16px 18px;">
<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#64748B;">Client Name</div>
<div style="font-size:17px;font-weight:800;color:#0F172A;margin-bottom:8px;">${name}</div>
<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#64748B;">Phone</div>
<div style="font-size:14px;font-weight:700;margin-bottom:8px;"><a href="tel:${cleanPhone}" style="color:#D97706;text-decoration:none;">${phone}</a></div>
<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#64748B;">Email</div>
<div style="font-size:14px;font-weight:700;"><a href="mailto:${email}" style="color:#2563EB;text-decoration:none;">${email}</a></div>
</td></tr></table>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#FFFBEB;border:1px solid #FEF3C7;border-radius:14px;margin-bottom:20px;">
<tr><td style="padding:12px 18px;background-color:#FEF3C7;border-bottom:1px solid #FDE68A;"><span style="font-size:11px;font-weight:800;text-transform:uppercase;color:#92400E;">&#128197; Event &amp; Service Specifications</span></td></tr>
<tr><td style="padding:16px 18px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
<tr>
<td width="50%" style="padding-bottom:12px;vertical-align:top;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#92400E;">Event Type</div><div style="font-size:14px;font-weight:800;color:#0F172A;">${eventType}</div></td>
<td width="50%" style="padding-bottom:12px;vertical-align:top;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#92400E;">Service Style</div><div style="font-size:14px;font-weight:800;color:#0F172A;">${serviceType}</div></td>
</tr>
<tr>
<td width="50%" style="padding-bottom:12px;vertical-align:top;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#92400E;">Date</div><div style="font-size:14px;font-weight:800;color:#D97706;">${date}</div></td>
<td width="50%" style="padding-bottom:12px;vertical-align:top;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#92400E;">Time Session</div><div style="font-size:14px;font-weight:800;color:#0F172A;">${timeOfDay}</div></td>
</tr>
<tr>
<td width="50%" style="padding-bottom:12px;vertical-align:top;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#92400E;">Guests Count</div><div style="font-size:14px;font-weight:800;color:#0F172A;">${guests} Guests</div>${guestsBreakdown ? `<div style="font-size:11px;color:#64748B;margin-top:2px;">${guestsBreakdown}</div>` : ""}</td>
<td width="50%" style="padding-bottom:12px;vertical-align:top;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#92400E;">Event Location</div><div style="font-size:13px;font-weight:700;color:#0F172A;">${postCode}</div></td>
</tr>
</table>
<div style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px 14px;margin-top:6px;">
<div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#92400E;">Package / Menu</div>
<div style="font-size:15px;font-weight:800;color:#78350F;margin-top:2px;">${packageChosen}</div>
${(totalAmount || baseAmount) ? `<div style="font-size:13px;font-weight:700;color:#92400E;margin-top:6px;">${totalAmount ? `Total Estimate: ${totalAmount}` : `Est. Base: ${baseAmount}`}${deposit ? ` &bull; Deposit: ${deposit}` : ""}</div>` : ""}
</div>
${message ? `<div style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:12px 14px;margin-top:10px;"><div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#475569;">Customer Special Notes</div><div style="font-size:13px;color:#1E293B;margin-top:4px;line-height:1.5;white-space:pre-wrap;">${message}</div></div>` : ""}
</td></tr></table>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:22px;"><tr>
${whatsappLink ? `<td align="center" style="padding:4px;"><a href="${whatsappLink}" target="_blank" style="display:inline-block;background-color:#16A34A;color:#FFFFFF;font-size:13px;font-weight:800;padding:12px 20px;border-radius:10px;text-decoration:none;">&#128172; Open WhatsApp Chat</a></td>` : ""}
<td align="center" style="padding:4px;"><a href="tel:${cleanPhone}" style="display:inline-block;background-color:#D97706;color:#FFFFFF;font-size:13px;font-weight:800;padding:12px 20px;border-radius:10px;text-decoration:none;">&#128222; Call Customer</a></td>
</tr></table>
<div style="border-top:1px solid #E2E8F0;padding-top:14px;text-align:center;">
<p style="margin:0;font-size:12px;color:#64748B;">Dispatched by Madras Flavours Events Notification Service.</p>
<p style="margin:4px 0 0 0;font-size:11px;color:#94A3B8;">Reference: ${bookingId || "New Entry"} &bull; ${new Date().toLocaleString("en-GB")}</p>
</div>
</td></tr></table></td></tr></table></body></html>`;
}

function buildCustomerEmailHtml(data) {
  const name = data.name || "Valued Guest";
  const date = data.date || "To be confirmed";
  const timeOfDay = data.timeOfDay || data.timeSession || "Flexible";
  const eventType = data.eventType || "Catering";
  const guests = data.guests || data.totalGuests || "N/A";
  const packageChosen = data.selectedPackage || data.package || data.selectedMenu || "Not Selected";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Thank You for Your Enquiry</title></head>
<body style="margin:0;padding:0;background-color:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0F172A;"><tr><td align="center" style="padding:24px 8px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#FFFFFF;border-radius:18px;overflow:hidden;box-shadow:0 10px 35px rgba(0,0,0,0.3);border:1px solid #1E293B;">
<tr><td style="background:linear-gradient(135deg,#1A0A0A 0%,#2D1500 100%);padding:28px 20px;text-align:center;border-bottom:3px solid #F5A623;">
<div style="margin-bottom:12px;"><img src="${logoSrc}" alt="Madras Flavours Events" width="180" style="max-width:180px;height:auto;display:block;margin:0 auto;" /></div>
<span style="display:inline-block;background:rgba(245,166,35,0.2);color:#FCD34D;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;padding:5px 14px;border-radius:20px;border:1px solid rgba(245,166,35,0.4);margin-bottom:8px;">&#10003; ENQUIRY CONFIRMATION</span>
<h1 style="color:#FFFFFF;margin:0;font-size:22px;font-weight:800;">Madras Flavours Events</h1>
<p style="color:#FCD34D;font-size:12px;font-weight:600;margin:5px 0 0 0;">Authentic South Indian Catering &middot; Reading</p>
</td></tr>
<tr><td style="padding:24px 20px;background-color:#FFFFFF;">
<h2 style="font-size:17px;font-weight:800;color:#0F172A;margin:0 0 10px 0;">Hello ${name},</h2>
<p style="font-size:14px;line-height:1.6;color:#475569;margin:0 0 18px 0;">Thank you for choosing Madras Flavours Events! We have received your booking request. Our team will review the details and get back to you shortly with availability and pricing proposals.</p>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;margin-bottom:20px;">
<tr><td style="padding:12px 16px;background-color:#FEF3C7;border-bottom:1px solid #FDE68A;"><span style="font-size:11px;font-weight:800;text-transform:uppercase;color:#92400E;">Your Requested Event Details</span></td></tr>
<tr><td style="padding:16px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
<tr>
<td width="50%" style="padding-bottom:8px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#64748B;">Event</div><div style="font-size:13px;font-weight:700;color:#0F172A;">${eventType}</div></td>
<td width="50%" style="padding-bottom:8px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#64748B;">Requested Date</div><div style="font-size:13px;font-weight:700;color:#D97706;">${date}</div></td>
</tr>
<tr>
<td width="50%" style="padding-bottom:8px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#64748B;">Time Slot</div><div style="font-size:13px;font-weight:700;color:#0F172A;">${timeOfDay}</div></td>
<td width="50%" style="padding-bottom:8px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#64748B;">Guests</div><div style="font-size:13px;font-weight:700;color:#0F172A;">${guests}</div></td>
</tr>
</table>
<div style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:10px 12px;margin-top:6px;">
<div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#92400E;">Package</div>
<div style="font-size:13px;font-weight:800;color:#78350F;">${packageChosen}</div>
</div>
</td></tr></table>
<div style="text-align:center;margin-bottom:20px;">
<a href="https://api.whatsapp.com/send?phone=447507271506&text=Hi%20Madras%20Flavours%20Events%2C%20I%20submitted%20a%20booking%20enquiry%20for%20${encodeURIComponent(date)}.%20I%20would%20like%20to%20discuss%20details." target="_blank" style="display:inline-block;background-color:#16A34A;color:#FFFFFF;font-size:13px;font-weight:800;padding:11px 22px;border-radius:8px;text-decoration:none;">&#128172; Chat on WhatsApp with Event Planner</a>
</div>
<div style="border-top:1px solid #E2E8F0;padding-top:16px;text-align:center;">
<p style="margin:0;font-size:13px;font-weight:800;color:#0F172A;">Madras Flavours Events Team</p>
<p style="margin:3px 0 0 0;font-size:12px;color:#64748B;">Authentic South Indian Catering &middot; Reading</p>
</div>
</td></tr></table></td></tr></table></body></html>`;
}

async function dispatchOrderEmails(data, bookingId) {
  const config = await fetchEmailConfig();
  if (!config.enabled) {
    console.log(`[Cloud Functions] Notifications disabled. Skipping: ${bookingId}`);
    return { success: true, skipped: true, reason: "notifications_disabled" };
  }
  const recipients = config.recipients;
  if (!recipients || recipients.length === 0) {
    console.warn("[Cloud Functions] No recipients configured.");
    return { success: false, skipped: true, reason: "no_recipients" };
  }
  const smtp = config.smtp;
  if (!smtp || !smtp.user || !smtp.pass) {
    console.warn("[Cloud Functions] SMTP credentials missing.");
    return { success: false, reason: "smtp_not_configured" };
  }
  const transporter = nodemailer.createTransport({
    host: smtp.host || "smtp.gmail.com",
    port: Number(smtp.port) || 587,
    secure: Boolean(smtp.secure),
    auth: { user: smtp.user, pass: smtp.pass },
    tls: { rejectUnauthorized: false },
  });
  const fromSender = `"${smtp.fromName || "Madras Flavours Events"}" <${smtp.fromEmail || smtp.user}>`;
  const serviceName = data.eventType || data.serviceType || "Booking";
  const customerName = data.name || "Customer";
  const eventDate = data.date || "TBD";
  const adminSubject = `[New Order] ${customerName} - ${serviceName} on ${eventDate}`;
  const tasks = [];
  recipients.forEach((recipientEmail) => {
    tasks.push(transporter.sendMail({ from: fromSender, to: recipientEmail, subject: adminSubject, html: buildAdminEmailHtml(data, bookingId), attachments: emailAttachments }));
  });
  const customerEmail = data.email && typeof data.email === "string" ? data.email.trim() : null;
  if (config.sendCustomerConfirmation !== false && customerEmail && customerEmail.includes("@")) {
    tasks.push(transporter.sendMail({ from: fromSender, to: customerEmail, subject: "Thank You for Your Enquiry - Madras Flavours Events", html: buildCustomerEmailHtml(data), attachments: emailAttachments }));
  }
  const results = await Promise.allSettled(tasks);
  const adminResults = results.slice(0, recipients.length);
  const adminSuccess = adminResults.some((r) => r.status === "fulfilled");
  adminResults.forEach((res, idx) => {
    if (res.status === "rejected") console.error(`[Cloud Functions] Failed to deliver to ${recipients[idx]}:`, res.reason);
    else console.log(`[Cloud Functions] Sent notification to ${recipients[idx]}`);
  });
  return { success: adminSuccess, recipients, totalDispatched: tasks.length };
}

exports.onBookingRequestCreated = onDocumentCreated(
  { document: "booking_requests/{bookingId}", region: "europe-west2" },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const bookingId = event.params.bookingId;
    const bookingData = snap.data() || {};
    if (bookingData.emailNotificationSent) {
      console.log(`[Cloud Functions] ${bookingId} already notified. Skipping.`);
      return;
    }
    console.log(`[Cloud Functions] New booking_requests entry: ${bookingId}`);
    try {
      const result = await dispatchOrderEmails(bookingData, bookingId);
      if (result && result.success) {
        await snap.ref.set({ emailNotificationSent: true, emailSentAt: new Date().toISOString(), notifiedRecipients: result.recipients || [] }, { merge: true });
      }
    } catch (error) {
      console.error(`[Cloud Functions] Error in onBookingRequestCreated for ${bookingId}:`, error);
    }
  }
);

exports.onBookingCreated = onDocumentCreated(
  { document: "bookings/{bookingId}", region: "europe-west2" },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const bookingId = event.params.bookingId;
    const bookingData = snap.data() || {};
    if (bookingData.emailNotificationSent) return;
    try {
      const db = admin.firestore();
      const reqDoc = await db.collection("booking_requests").doc(bookingId).get();
      if (reqDoc.exists && reqDoc.data()?.emailNotificationSent) {
        console.log(`[Cloud Functions] ${bookingId} already emailed via booking_requests. Skipping.`);
        return;
      }
      const result = await dispatchOrderEmails(bookingData, bookingId);
      if (result && result.success) {
        await snap.ref.set({ emailNotificationSent: true, emailSentAt: new Date().toISOString(), notifiedRecipients: result.recipients || [] }, { merge: true });
      }
    } catch (error) {
      console.error(`[Cloud Functions] Error in onBookingCreated for ${bookingId}:`, error);
    }
  }
);

exports.sendBookingEmail = onCall(async (request) => {
  try {
    const data = request.data || {};
    const bookingId = data.bookingId || data.id || `CALL-${Date.now()}`;
    const result = await dispatchOrderEmails(data, bookingId);
    return { success: result.success !== false, message: result.success ? "Email sent successfully" : "Emails skipped or failed", recipients: result.recipients };
  } catch (error) {
    console.error("[Cloud Functions] Error in sendBookingEmail:", error);
    throw new HttpsError("internal", error.message || "Failed to dispatch email");
  }
});

exports.sendBookingEmailHttp = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed. Use POST." });
    try {
      const data = req.body || {};
      const bookingId = data.bookingId || data.id || `HTTP-${Date.now()}`;
      const result = await dispatchOrderEmails(data, bookingId);
      return res.status(200).json(result);
    } catch (error) {
      console.error("[Cloud Functions] Error in sendBookingEmailHttp:", error);
      return res.status(500).json({ error: error.message || "Failed to send email" });
    }
  });
});