export interface EmailRecipient {
  id: string;
  email: string;
  name: string;
  enabled: boolean;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export interface EmailNotificationConfig {
  enabled: boolean;
  provider?: 'resend' | 'smtp';
  resendApiKey?: string;
  recipients: EmailRecipient[];
  sendCustomerConfirmation: boolean;
  smtp: SmtpConfig;
  updatedAt?: string;
}

export const DEFAULT_EMAIL_NOTIFICATION_CONFIG: EmailNotificationConfig = {
  enabled: true,
  provider: 'resend',
  resendApiKey: '',
  recipients: [
    {
      id: 'recipient-1',
      email: 'rahulbadugu22@gmail.com',
      name: 'Rahul',
      enabled: true,
    },
    {
      id: 'recipient-2',
      email: 'madrasflavoursreading@gmail.com',
      name: 'Madras Flavours Reading',
      enabled: true,
    },
    {
      id: 'recipient-3',
      email: 'Digitalbotsolutions@gmail.com',
      name: 'Digital Bot Solutions',
      enabled: true,
    },
  ],
  sendCustomerConfirmation: true,
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'zingbiteuk@gmail.com',
    pass: 'yyozpzropaysxtah',
    fromName: 'Madras Flavours Events Reading',
    fromEmail: 'bookings@madrasflavoursreading.events',
  },
};

export function sanitizeEmailNotificationConfig(data: any): EmailNotificationConfig {
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_EMAIL_NOTIFICATION_CONFIG };
  }

  let recipients: EmailRecipient[] = [];

  if (Array.isArray(data.recipients) && data.recipients.length > 0) {
    recipients = data.recipients
      .map((r: any, idx: number) => ({
        id: String(r.id || `recipient-${idx + 1}`),
        email: String(r.email || '').trim().toLowerCase(),
        name: String(r.name || 'Admin Recipient').trim(),
        enabled: r.enabled !== false,
      }))
      .filter((r: EmailRecipient) => Boolean(r.email && r.email.includes('@')));
  } else if (typeof data.emails === 'string' && data.emails.trim().length > 0) {
    // Backwards compatibility with legacy comma-separated emails
    recipients = data.emails
      .split(',')
      .map((e: string) => e.trim().toLowerCase())
      .filter((e: string) => e.includes('@'))
      .map((email: string, idx: number) => ({
        id: `recipient-legacy-${idx + 1}`,
        email,
        name: email.split('@')[0],
        enabled: true,
      }));
  }

  if (recipients.length === 0) {
    recipients = [...DEFAULT_EMAIL_NOTIFICATION_CONFIG.recipients];
  }

  const resendApiKey = String(
    data.resendApiKey || process.env.RESEND_API_KEY || DEFAULT_EMAIL_NOTIFICATION_CONFIG.resendApiKey || ''
  ).trim();

  const provider: 'resend' | 'smtp' =
    data.provider === 'smtp' ? 'smtp' : (resendApiKey ? 'resend' : 'smtp');

  const smtpData = data.smtp || {};
  const smtp: SmtpConfig = {
    host: String(smtpData.host || process.env.SMTP_HOST || DEFAULT_EMAIL_NOTIFICATION_CONFIG.smtp.host),
    port: Number(smtpData.port || process.env.SMTP_PORT) || DEFAULT_EMAIL_NOTIFICATION_CONFIG.smtp.port,
    secure: smtpData.secure !== undefined ? Boolean(smtpData.secure) : DEFAULT_EMAIL_NOTIFICATION_CONFIG.smtp.secure,
    user: String(smtpData.user || process.env.SMTP_USER || DEFAULT_EMAIL_NOTIFICATION_CONFIG.smtp.user),
    pass: String(smtpData.pass || process.env.SMTP_PASS || DEFAULT_EMAIL_NOTIFICATION_CONFIG.smtp.pass),
    fromName: String(smtpData.fromName || DEFAULT_EMAIL_NOTIFICATION_CONFIG.smtp.fromName),
    fromEmail: String(smtpData.fromEmail || DEFAULT_EMAIL_NOTIFICATION_CONFIG.smtp.fromEmail),
  };

  return {
    enabled: data.enabled !== false,
    provider,
    resendApiKey,
    recipients,
    sendCustomerConfirmation: data.sendCustomerConfirmation !== false,
    smtp,
    updatedAt: data.updatedAt,
  };
}

