import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { SmtpConfig } from '@/app/data/emailNotificationConfig';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      provider,
      resendApiKey: customResendKey,
      smtp,
      testRecipient,
    }: {
      provider?: 'resend' | 'smtp';
      resendApiKey?: string;
      smtp?: SmtpConfig;
      testRecipient: string;
    } = body;

    if (!testRecipient || !testRecipient.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid test recipient email address.' },
        { status: 400 }
      );
    }

    const resendApiKey =
      customResendKey ||
      process.env.RESEND_API_KEY ||
      '';
    const isResend = provider !== 'smtp' && Boolean(resendApiKey);

    const testHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA; padding: 24px; color: #1F2937;">
  <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #E5E7EB; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="width: 52px; height: 52px; background: #ECFDF5; color: #059669; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 16px;">
      ✓
    </div>
    <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 20px;">Email Integration Working!</h2>
    <p style="color: #4B5563; font-size: 14px; margin: 0 0 16px 0;">
      This test message confirms that your mail service is configured correctly and sending emails from <strong>Madras Flavours Events Reading</strong>.
    </p>
    <div style="background: #F9FAFB; border-radius: 10px; padding: 14px; font-size: 12px; text-align: left; color: #4B5563; border: 1px solid #E5E7EB;">
      <p style="margin: 3px 0;"><strong>Delivery Method:</strong> ${isResend ? 'Resend HTTPS API (Hosting Firewall Safe)' : 'SMTP Direct Socket'}</p>
      <p style="margin: 3px 0;"><strong>Delivered To:</strong> ${testRecipient}</p>
      <p style="margin: 3px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-GB')}</p>
    </div>
    <p style="margin: 16px 0 0 0; font-size: 12px; color: #9CA3AF;">
      Madras Flavours Events Reading • System Notification
    </p>
  </div>
</body>
</html>
    `;

    if (isResend) {
      // 1. Attempt sending with custom domain
      const senderDomain = 'bookings@madrasflavoursreading.events';
      const senderName = smtp?.fromName || 'Madras Flavours Events Reading';
      const fromAddress = `"${senderName}" <${senderDomain}>`;

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [testRecipient.trim()],
          subject: '[Success] Madras Flavours Events: Email Service Test Succeeded',
          html: testHtml,
        }),
      });

      const resendData = await resendRes.json();

      // If domain not yet verified in Resend DNS and test is to registered owner, attempt onboarding fallback
      if (!resendRes.ok && (resendData.message?.includes('not verified') || resendData.message?.includes('domain'))) {
        const fallbackFrom = `"${senderName}" <onboarding@resend.dev>`;
        const retryRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: fallbackFrom,
            to: [testRecipient.trim()],
            subject: '✅ Madras Flavours Events: Email Service Test Succeeded',
            html: testHtml,
          }),
        });
        const retryData = await retryRes.json();
        if (retryRes.ok) {
          return NextResponse.json({
            success: true,
            message: `Test email sent successfully via sandbox to ${testRecipient}! (Complete GoDaddy DNS verification in Resend to send from @madrasflavoursreading.events to any inbox).`,
            messageId: retryData.id,
          });
        }
      }

      if (!resendRes.ok) {
        return NextResponse.json(
          {
            success: false,
            error: resendData.message || resendData.error || 'Failed to dispatch test email via Resend API.',
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Test email successfully sent to ${testRecipient} via Resend!`,
        messageId: resendData.id,
      });
    }

    // SMTP Fallback
    if (!smtp || !smtp.host || !smtp.user || !smtp.pass) {
      return NextResponse.json(
        { success: false, error: 'Please enter SMTP credentials or configure a Resend API key.' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port) || 587,
      secure: Boolean(smtp.secure),
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const sender = `"${smtp.fromName || 'Madras Flavours Events Test'}" <${smtp.fromEmail || smtp.user}>`;

    const info = await transporter.sendMail({
      from: sender,
      to: testRecipient.trim(),
      subject: '✅ Madras Flavours Events: SMTP Mail Server Test Succeeded',
      html: testHtml,
    });

    return NextResponse.json({
      success: true,
      message: `Test email successfully sent to ${testRecipient}!`,
      messageId: info.messageId,
    });
  } catch (err: any) {
    console.error('Error sending test email:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to send test email. Please check your configuration.',
      },
      { status: 500 }
    );
  }
}
