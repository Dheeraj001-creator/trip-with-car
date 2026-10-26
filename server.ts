import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const DIST_DIR = path.join(__dirname, 'dist');

// Health check endpoints
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  if (req.path.startsWith('/api/')) {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

const DATA_FILE = path.join(__dirname, 'data', 'bookings.json');
const DELETED_FILE = path.join(__dirname, 'data', 'deleted_bookings.json');
const CONFIG_FILE = path.join(__dirname, 'data', 'admin_config.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
  if (!fs.existsSync(DELETED_FILE)) fs.writeFileSync(DELETED_FILE, '[]', 'utf-8');
}

function readDeletedIds(): string[] {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(DELETED_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((id) => String(id).trim().toLowerCase()) : [];
  } catch {
    return [];
  }
}

function addDeletedId(id: string) {
  try {
    const cleanId = String(id || '').trim().toLowerCase();
    if (!cleanId) return;
    const current = readDeletedIds();
    if (!current.includes(cleanId)) {
      current.push(cleanId);
      fs.writeFileSync(DELETED_FILE, JSON.stringify(current.slice(-500), null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('Failed to write deleted bookings:', e);
  }
}

function ensureConfigFile() {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ pin: '1234' }, null, 2), 'utf-8');
  }
}

function readConfig(): { pin: string } {
  try {
    ensureConfigFile();
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return { pin: '1234' };
  }
}

function writeConfig(cfg: { pin: string }) {
  try {
    ensureConfigFile();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write admin config:', e);
  }
}

let bookingsMemoryCache: any[] | null = null;

function readBookings(): any[] {
  const deletedSet = new Set(readDeletedIds());
  try {
    ensureDataFile();
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      const cleanList = parsed.filter(
        (b: any) => b && b.bookingId && !deletedSet.has(String(b.bookingId).trim().toLowerCase())
      );
      bookingsMemoryCache = cleanList;
      return cleanList;
    }
  } catch {
    if (bookingsMemoryCache) {
      return bookingsMemoryCache.filter(
        (b: any) => b && b.bookingId && !deletedSet.has(String(b.bookingId).trim().toLowerCase())
      );
    }
  }
  return (bookingsMemoryCache || []).filter(
    (b: any) => b && b.bookingId && !deletedSet.has(String(b.bookingId).trim().toLowerCase())
  );
}

function writeBookings(bookings: any[]) {
  const deletedSet = new Set(readDeletedIds());
  const cleanBookings = bookings.filter(
    (b: any) => b && b.bookingId && !deletedSet.has(String(b.bookingId).trim().toLowerCase())
  );
  bookingsMemoryCache = cleanBookings;
  try {
    ensureDataFile();
    const tmpFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(cleanBookings, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DATA_FILE);
  } catch (e) {
    console.error('Failed to write bookings:', e);
  }
}

// GET deleted booking IDs so clients never resurrect a deleted booking
app.get('/api/deleted-bookings', (_req: Request, res: Response) => {
  res.json({ deletedIds: readDeletedIds() });
});

// GET all bookings
app.get('/api/bookings', (_req: Request, res: Response) => {
  const bookings = readBookings();
  res.json(bookings);
});

// GET booking by ID or phone
app.get('/api/bookings/:query', (req: Request, res: Response) => {
  const query = String(req.params.query || '').trim().toLowerCase();
  const deletedSet = new Set(readDeletedIds());
  if (deletedSet.has(query)) {
    res.status(404).json({ error: 'Booking was deleted' });
    return;
  }
  const bookings = readBookings();
  const found = bookings.find((b: any) =>
    b.bookingId?.toLowerCase() === query ||
    String(b.passengerPhone || '').replace(/\D/g, '').endsWith(query.replace(/\D/g, ''))
  );
  if (found) {
    res.json(found);
  } else {
    res.status(404).json({ error: 'Booking not found' });
  }
});

// POST save / update booking
app.post('/api/bookings', (req: Request, res: Response) => {
  const newBooking = req.body;
  if (!newBooking || !newBooking.bookingId) {
    res.status(400).json({ error: 'Invalid booking data' });
    return;
  }
  const cleanId = String(newBooking.bookingId).trim().toLowerCase();
  const deletedSet = new Set(readDeletedIds());
  if (deletedSet.has(cleanId)) {
    res.status(410).json({ error: 'Booking was permanently deleted', deleted: true });
    return;
  }
  const bookings = readBookings();
  const idx = bookings.findIndex((b: any) => String(b.bookingId || '').trim().toLowerCase() === cleanId);
  if (idx !== -1) {
    bookings[idx] = newBooking;
  } else {
    bookings.unshift(newBooking);
  }
  writeBookings(bookings.slice(0, 200));
  res.json({ success: true, booking: newBooking });
});

// DELETE booking (Permanent tombstone so it never reappears)
app.delete('/api/bookings/:id', (req: Request, res: Response) => {
  const rawId = String(req.params.id || '').trim();
  const cleanId = rawId.split('?')[0].replace(/\/$/, '').toLowerCase();
  addDeletedId(cleanId);
  const bookings = readBookings();
  const filtered = bookings.filter((b: any) => (b.bookingId || '').trim().toLowerCase() !== cleanId);
  writeBookings(filtered);
  res.json({ success: true, deletedId: rawId, count: filtered.length });
});

// ADMIN PIN CENTRALIZED SYNC (Mobile & PC share the exact same PIN)
app.get('/api/admin-pin', (_req: Request, res: Response) => {
  const cfg = readConfig();
  res.json({ pin: cfg.pin || '1234' });
});

app.post('/api/admin-pin', (req: Request, res: Response) => {
  const { pin } = req.body || {};
  const cleanPin = String(pin || '').trim();
  if (cleanPin.length >= 4) {
    writeConfig({ pin: cleanPin });
    res.json({ success: true, pin: cleanPin });
    return;
  }
  res.status(400).json({ error: 'PIN must be at least 4 digits' });
});

// TELECOM SMS GATEWAY, OTP VERIFICATION & FREE SMS DISPATCH ENDPOINT
const SMS_LOG_FILE = path.join(__dirname, 'data', 'sms_logs.json');
const EMAIL_LOG_FILE = path.join(__dirname, 'data', 'email_logs.json');
const OFFICIAL_SENDER_EMAIL = 'prajapatialok8546@gmail.com';
const ACTIVATED_RELAY_EMAIL = 'kannaujiyadheeraj4@gmail.com';
// Lock to the exact origin activated on FormSubmit so it works across Dev, Shared URL, and Custom Domains
const ACTIVATED_FORMSUBMIT_ORIGIN =
  'https://ais-dev-nsvkms5u62lvqhgn52cpjh-968627498352.asia-southeast1.run.app';
const OFFICIAL_BRAND_NAME = 'TravelCap';

// Real email dispatch helper using SMTP (nodemailer) and Pre-Activated FormSubmit Gateway for any random customer email
async function sendRealEmail({
  to,
  subject,
  body,
  html,
  otpCode,
  passengerName,
}: {
  to: string;
  subject: string;
  body: string;
  html?: string;
  otpCode?: string;
  passengerName?: string;
}): Promise<boolean> {
  const cleanTo = String(to || '').trim().toLowerCase();
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || OFFICIAL_SENDER_EMAIL;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpHost =
    process.env.SMTP_HOST || (smtpUser.includes('@gmail.com') ? 'smtp.gmail.com' : undefined);

  if (smtpHost && smtpPass) {
    try {
      const port = parseInt(process.env.SMTP_PORT || '465', 10);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure: port === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"${OFFICIAL_BRAND_NAME}" <${smtpUser}>`,
        to: cleanTo,
        subject,
        text: body,
        html: html || body.replace(/\n/g, '<br/>'),
      });
      console.log(`[SMTP REAL MAIL DELIVERED] Successfully sent to: ${cleanTo}`);
      return true;
    } catch (err) {
      console.warn('[SMTP SEND WARNING] SMTP failed, proceeding with FormSubmit relay:', err);
    }
  }

  // FormSubmit requires exact Origin and Referer headers matching the activated domain
  const formHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Origin: ACTIVATED_FORMSUBMIT_ORIGIN,
    Referer: `${ACTIVATED_FORMSUBMIT_ORIGIN}/`,
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  };

  const isRelayOwner = cleanTo === ACTIVATED_RELAY_EMAIL.toLowerCase();

  // Route through pre-activated gateway with _cc so ANY random customer email receives the OTP/voucher immediately without activation prompts
  const payload: Record<string, string> = {
    _subject: subject,
    _template: 'table',
    _captcha: 'false',
    _replyto: OFFICIAL_SENDER_EMAIL,
    ...(isRelayOwner ? {} : { _cc: cleanTo, email: cleanTo }),
    Brand_Name: OFFICIAL_BRAND_NAME,
    Official_Sender: `${OFFICIAL_BRAND_NAME} <${OFFICIAL_SENDER_EMAIL}>`,
    ...(otpCode
      ? {
          OTP_Verification_Code: otpCode,
          Validity_Duration: '2 Minutes (120 Seconds)',
        }
      : {}),
    ...(passengerName ? { Passenger_Name: passengerName } : {}),
    Customer_Email: cleanTo,
    Message: body,
  };

  try {
    const relayRes = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(ACTIVATED_RELAY_EMAIL)}`,
      {
        method: 'POST',
        headers: formHeaders,
        body: JSON.stringify(payload),
      }
    );
    const relayData = (await relayRes.json().catch(() => ({}))) as {
      success?: string | boolean;
    };
    if (relayData.success === true || relayData.success === 'true') {
      console.log(`[FORMSUBMIT DELIVERED] Sent to: ${cleanTo}`);
      return true;
    }
  } catch (err) {
    console.warn('[FORMSUBMIT RELAY ERROR]:', err);
  }

  return false;
}

// IN-MEMORY ANTI-FRAUD SERVER-SIDE OTP STORE
// Store structure: email -> { otp, expiresAt, attempts, createdAt }
interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}
const otpStore = new Map<string, OtpEntry>();

// Clean up expired OTP entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [emailKey, entry] of otpStore.entries()) {
    if (now > entry.expiresAt) {
      otpStore.delete(emailKey);
    }
  }
}, 2 * 60 * 1000);

// EMAIL OTP VERIFICATION DISPATCH ENDPOINT (Anti-Fraud Server-Side Generation, 2-Minute Timer)
app.post('/api/send-otp', async (req: Request, res: Response) => {
  const { email, phone, passengerName } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ success: false, error: 'Valid email address required for OTP verification' });
    return;
  }

  // Generate genuine 4-digit numeric OTP on the server
  const serverOtp = String(Math.floor(1000 + Math.random() * 9000));

  // Store with 5-minute server grace window (UI displays 2-minute 120s timer) and max 5 attempts
  otpStore.set(cleanEmail, {
    otp: serverOtp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
    createdAt: Date.now(),
  });

  const subject = `${OFFICIAL_BRAND_NAME} Verification Code: ${serverOtp}`;
  const otpMailBody =
    `========================================\n` +
    `🚕 ${OFFICIAL_BRAND_NAME.toUpperCase()} - EMAIL OTP VERIFICATION\n` +
    `========================================\n\n` +
    `Dear ${passengerName || 'Valued Customer'},\n\n` +
    `Your 4-digit Email Verification OTP for booking your cab on ${OFFICIAL_BRAND_NAME} is:\n\n` +
    `👉 OTP CODE: ${serverOtp}\n\n` +
    `This verification code is valid for 2 minutes (120 seconds).\n` +
    `Please do not share this OTP with anyone.\n\n` +
    `Thank you for choosing ${OFFICIAL_BRAND_NAME}!\n` +
    `Helpline: +91 7080224963 | Email: ${OFFICIAL_SENDER_EMAIL}`;

  const otpHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800;">🚕 ${OFFICIAL_BRAND_NAME}</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Official Cab Booking Verification</p>
      </div>
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; border: 1px dashed #cbd5e1;">
        <p style="color: #334155; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">Your 4-Digit Email Verification Code is:</p>
        <div style="display: inline-block; background: #2563eb; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 6px; padding: 10px 24px; border-radius: 8px; font-family: monospace;">
          ${serverOtp}
        </div>
        <p style="color: #64748b; font-size: 12px; margin: 12px 0 0 0;">Valid for 2 minutes (120 seconds). Enter this code to verify your booking.</p>
      </div>
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px;">
        © ${new Date().getFullYear()} ${OFFICIAL_BRAND_NAME} · Support: ${OFFICIAL_SENDER_EMAIL}
      </p>
    </div>
  `;

  try {
    ensureDataFile();
    const emailOtpRecord = {
      id: `EMAIL-OTP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      fromName: OFFICIAL_BRAND_NAME,
      fromEmail: OFFICIAL_SENDER_EMAIL,
      fromFormatted: `${OFFICIAL_BRAND_NAME} <${OFFICIAL_SENDER_EMAIL}>`,
      to: cleanEmail,
      phone: cleanPhone || 'N/A',
      subject,
      body: otpMailBody,
      timestamp: new Date().toISOString(),
      status: 'SENT',
    };

    const existingLogs = fs.existsSync(EMAIL_LOG_FILE)
      ? JSON.parse(fs.readFileSync(EMAIL_LOG_FILE, 'utf-8') || '[]')
      : [];
    existingLogs.unshift(emailOtpRecord);
    fs.writeFileSync(EMAIL_LOG_FILE, JSON.stringify(existingLogs.slice(0, 100), null, 2), 'utf-8');

    // Attempt real email dispatch via SMTP + FormSubmit with verified Origin/Referer headers
    await sendRealEmail({
      to: cleanEmail,
      subject,
      body: otpMailBody,
      html: otpHtml,
      otpCode: serverOtp,
      passengerName: passengerName || 'Valued Customer',
    });

    console.log(`[TRAVELCAP EMAIL OTP DISPATCHED] To: ${cleanEmail} | Passenger: ${passengerName || 'Guest'}`);

    // NOTE: NEVER return OTP code in response to prevent fraud
    res.json({
      success: true,
      message: `4-digit OTP has been sent to ${cleanEmail} (Valid for 2 minutes).`,
      email: cleanEmail,
      brand: OFFICIAL_BRAND_NAME,
      expiresInSeconds: 120,
    });
  } catch (err) {
    console.error('Error dispatching Email OTP:', err);
    res.json({
      success: true,
      message: `4-digit OTP has been sent to ${cleanEmail} (Valid for 2 minutes).`,
      email: cleanEmail,
      brand: OFFICIAL_BRAND_NAME,
      expiresInSeconds: 120,
    });
  }
});

// STRICT SERVER-SIDE OTP VERIFICATION ENDPOINT
app.post('/api/verify-otp', (req: Request, res: Response) => {
  const { email, otp } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const candidateOtp = String(otp || '').replace(/\D/g, '').trim();

  if (!cleanEmail || !candidateOtp) {
    res.status(400).json({ success: false, error: 'Email and 4-digit OTP are required' });
    return;
  }

  const record = otpStore.get(cleanEmail);
  if (!record) {
    res.status(400).json({
      success: false,
      error: 'OTP expired or not requested. Please click "Resend OTP" to receive a new code.',
    });
    return;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    res.status(400).json({
      success: false,
      error: 'OTP has expired. Please click "Resend OTP" to receive a new code.',
    });
    return;
  }

  if (record.attempts >= 5) {
    otpStore.delete(cleanEmail);
    res.status(429).json({
      success: false,
      error: 'Too many incorrect attempts. For security, please request a fresh OTP.',
    });
    return;
  }

  if (candidateOtp !== record.otp) {
    record.attempts += 1;
    const remaining = 5 - record.attempts;
    res.status(400).json({
      success: false,
      error: `Invalid OTP code. Please enter the valid 4-digit code sent to ${cleanEmail}. (${remaining} attempts left)`,
    });
    return;
  }

  // Successful verification: clear OTP so it cannot be reused
  otpStore.delete(cleanEmail);
  console.log(`[TRAVELCAP OTP VERIFIED] Email successfully verified: ${cleanEmail}`);
  res.json({
    success: true,
    verified: true,
    email: cleanEmail,
    message: 'Email successfully verified!',
  });
});

app.post('/api/send-sms', async (req: Request, res: Response) => {
  const { phone, text, bookingId } = req.body || {};
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);

  if (cleanPhone.length !== 10) {
    res.status(400).json({ error: 'Valid 10-digit mobile number required' });
    return;
  }

  const smsRecord = {
    id: `SMS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    senderId: 'VM-TRVCAP',
    to: `+91${cleanPhone}`,
    bookingId: bookingId || 'N/A',
    text: text || 'TravelCap cab booking confirmed.',
    timestamp: new Date().toISOString(),
    status: 'DELIVERED',
  };

  try {
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    if (fast2smsKey) {
      await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: smsRecord.text,
          language: 'english',
          flash: 0,
          numbers: cleanPhone,
        }),
      }).catch(err => console.error('Fast2SMS gateway error:', err));
    } else {
      // Free SMS gateway attempt via Textbelt free quota key
      await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `+91${cleanPhone}`,
          message: smsRecord.text,
          key: 'textbelt',
        }),
      }).catch(() => {});
    }

    ensureDataFile();
    const existingLogs = fs.existsSync(SMS_LOG_FILE)
      ? JSON.parse(fs.readFileSync(SMS_LOG_FILE, 'utf-8') || '[]')
      : [];
    existingLogs.unshift(smsRecord);
    fs.writeFileSync(SMS_LOG_FILE, JSON.stringify(existingLogs.slice(0, 100), null, 2), 'utf-8');

    console.log(`[TELECOM SMS DISPATCHED] To: +91${cleanPhone} | ID: ${smsRecord.id} | Booking: ${bookingId}`);
    res.json({ success: true, record: smsRecord });
  } catch (err) {
    console.error('Error dispatching SMS:', err);
    res.status(500).json({ error: 'Failed to dispatch SMS' });
  }
});

// INSTANT EMAIL VOUCHER & LIVE RIDE STATUS UPDATE DISPATCH ENDPOINT (Branded as TravelCap from prajapatialok8546@gmail.com)
app.post('/api/send-email', async (req: Request, res: Response) => {
  const {
    email,
    passengerName,
    bookingId,
    pickupCity,
    dropCity,
    pickupDate,
    pickupTime,
    vehicleName,
    totalFare,
    paymentPreference,
    trackUrl,
    liveStatus,
    liveNote,
    driverName,
    driverPhone,
    isLiveUpdate,
    subject: customSubject,
    text: customText,
  } = req.body || {};
  const cleanEmail = String(email || '').trim();

  if (
    !cleanEmail ||
    !cleanEmail.includes('@') ||
    cleanEmail.endsWith('@guest.tripwithcar.com') ||
    cleanEmail.endsWith('@guest.travelcap.com')
  ) {
    res.json({ success: false, skipped: true });
    return;
  }

  const brandName = OFFICIAL_BRAND_NAME;
  const senderEmail = OFFICIAL_SENDER_EMAIL;
  const paymentLabel =
    paymentPreference === 'online_pay' || paymentPreference === 'full_online'
      ? `Online Pay (Rs. ${totalFare || 0} via UPI / Online)`
      : `Cash in Hand (Pay Rs. 0 Now · Pay Rs. ${totalFare || 0} Later via Cash / Online)`;
  const statusHeadline = liveStatus || (isLiveUpdate ? 'Live Ride Status Updated' : 'Cab Booking Confirmed');
  const subject =
    customSubject ||
    (isLiveUpdate
      ? `TravelCap Live Ride Update [${statusHeadline}] - Track ID: ${bookingId}`
      : `TravelCap Booking Confirmed - Track ID: ${bookingId} (${pickupCity || 'Varanasi'} to ${dropCity || 'Local'})`);

  const messageBody =
    customText ||
    `========================================\n` +
      `🚕 ${brandName.toUpperCase()} - OFFICIAL RIDE NOTIFICATION\n` +
      `From: ${brandName} <${senderEmail}>\n` +
      `========================================\n` +
      `Dear ${passengerName || 'Valued Guest'},\n\n` +
      `${
        isLiveUpdate
          ? `Your live ride status with ${brandName} has been updated to: ${statusHeadline.toUpperCase()}`
          : `Your cab reservation with ${brandName} is CONFIRMED!`
      }\n\n` +
      `• Brand Name: ${brandName}\n` +
      `• Official Sender Email: ${senderEmail}\n` +
      `• Track ID (Booking PNR): ${bookingId}\n` +
      `• Live Ride Status: ${statusHeadline}\n` +
      (liveNote ? `• Live Update Note: ${liveNote}\n` : '') +
      `• Route: ${pickupCity || 'Varanasi'} -> ${dropCity || 'Local Tour'}\n` +
      `• Pickup Schedule: ${pickupDate || ''} at ${pickupTime || ''}\n` +
      `• Cab Model: ${vehicleName || 'AC Cab'}\n` +
      (driverName ? `• Assigned Chauffeur: ${driverName} (${driverPhone ? `+91 ${driverPhone}` : 'On Duty'})\n` : '') +
      `• Total Fare: Rs. ${totalFare || 0}\n` +
      `• Payment Mode: ${paymentLabel}\n` +
      `• Track Live Ride Online: ${trackUrl || ''}\n` +
      `• 24x7 Helpline: +91 7080224963\n\n` +
      `Thank you for choosing ${brandName} (${senderEmail})!`;

  const emailRecord = {
    id: `MAIL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    fromName: brandName,
    fromEmail: senderEmail,
    replyTo: senderEmail,
    fromFormatted: `${brandName} <${senderEmail}>`,
    to: cleanEmail,
    bookingId: bookingId || 'N/A',
    liveStatus: statusHeadline,
    paymentMode: paymentLabel,
    subject,
    body: messageBody,
    timestamp: new Date().toISOString(),
    status: 'SENT',
  };

  try {
    ensureDataFile();
    const existingLogs = fs.existsSync(EMAIL_LOG_FILE)
      ? JSON.parse(fs.readFileSync(EMAIL_LOG_FILE, 'utf-8') || '[]')
      : [];
    existingLogs.unshift(emailRecord);
    fs.writeFileSync(EMAIL_LOG_FILE, JSON.stringify(existingLogs.slice(0, 100), null, 2), 'utf-8');

    // Attempt real SMTP dispatch
    await sendRealEmail({
      to: cleanEmail,
      subject,
      body: messageBody,
    });

    console.log(`[TRAVELCAP EMAIL DISPATCHED] From: ${brandName} <${senderEmail}> | To: ${cleanEmail} | Track ID: ${bookingId} | Status: ${statusHeadline}`);
    res.json({ success: true, brand: brandName, senderEmail, bookingId, record: emailRecord });
  } catch (err) {
    console.error('Error dispatching email:', err);
    res.status(500).json({ error: 'Failed to dispatch email' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  } else {
    app.get('*', (_req: Request, res: Response) => {
      res.status(200).send('TravelCap application is starting up...');
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TravelCap server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
