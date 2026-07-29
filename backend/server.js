const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const db = require('./db/db');
const { evaluatePassword } = require('./services/password_service');
const { BruteForceGuard, generateCaptchaChallenge, validateCaptcha } = require('./services/brute_force_service');
const { TokenSessionManager } = require('./services/token_service');
const { GoogleAuthService } = require('./services/google_auth_service');
const { AnomalyDetector } = require('./services/anomaly_service');
const { ActiveSessionsService } = require('./services/session_service');

const app = express();
const PORT = process.env.PORT || 5000;

const FRONTEND_URL = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

const bruteForceGuard = new BruteForceGuard(3, 30);
let activeSessions = [];

function detectDevice(req) {
  const ua = req.headers['user-agent'] || '';
  let browser = 'Chrome';
  let os = 'Windows';

  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

  if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, os, rawUA: ua };
}

function resolveClientLocation(req) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (ip.includes('::ffff:')) ip = ip.split('::ffff:')[1];
  if (ip === '::1' || ip === '127.0.0.1') ip = '127.0.0.1 (Localhost)';

  return {
    city: ip === '127.0.0.1 (Localhost)' ? 'Local Development' : 'Detected City',
    country: ip === '127.0.0.1 (Localhost)' ? 'Local Machine' : 'Detected Country',
    ip
  };
}

async function createSession(user, authMethod, req) {
  const now = Date.now();
  const device = detectDevice(req);
  const location = resolveClientLocation(req);

  const currentSessionInfo = { browser: device.browser, os: device.os, location, ip: location.ip };
  const securityAlerts = AnomalyDetector.analyze(user, currentSessionInfo);

  const users = await db.getUsers();
  const dbUser = users.find(u => u.id === user.id);
  if (dbUser) {
    if (!dbUser.knownDevices) dbUser.knownDevices = [];
    if (!dbUser.knownLocations) dbUser.knownLocations = [];
    if (!dbUser.knownDevices.some(d => d.browser === device.browser && d.os === device.os)) {
      dbUser.knownDevices.push({ browser: device.browser, os: device.os });
    }
    if (!dbUser.knownLocations.some(l => l.country === location.country)) {
      dbUser.knownLocations.push({ city: location.city, country: location.country });
    }
    await db.saveUser(dbUser);
  }

  const sessionId = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
  const tokens = TokenSessionManager.createTokenPair();

  const sessionObj = {
    sessionId,
    userId: user.id,
    user: { id: user.id, email: user.email, username: user.username, fullName: user.fullName, provider: user.provider },
    authMethod,
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    refreshToken: tokens.refreshToken,
    refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    device: `${device.browser} on ${device.os}`,
    browser: device.browser,
    os: device.os,
    ip: location.ip,
    location: `${location.city}, ${location.country}`,
    createdTimestamp: now,
    lastActiveTimestamp: now,
    securityAlerts
  };

  activeSessions.push(sessionObj);
  return sessionObj;
}

// REST Endpoints
app.post('/api/validate-password', (req, res) => {
  const result = evaluatePassword(req.body.password || '');
  res.json(result);
});

app.post('/api/lockout-status', (req, res) => {
  const identifier = req.body.identifier || '';
  const status = bruteForceGuard.isLocked(identifier);
  const record = bruteForceGuard.getRecord(identifier);
  let challenge = null;
  if (record.captchaRequired) challenge = generateCaptchaChallenge();
  res.json({ ...status, captchaRequired: record.captchaRequired, challenge });
});

app.post('/api/login', async (req, res) => {
  const { identifier, password, captchaAnswer, expectedCaptchaAnswer } = req.body;

  const lockStatus = bruteForceGuard.isLocked(identifier || '');
  if (lockStatus.locked) {
    return res.status(429).json({ error: `Account locked. Try again in ${lockStatus.remainingSeconds}s.` });
  }

  const record = bruteForceGuard.getRecord(identifier || '');
  if (record.captchaRequired && expectedCaptchaAnswer) {
    if (!validateCaptcha(captchaAnswer, expectedCaptchaAnswer)) {
      return res.status(400).json({ error: 'Incorrect CAPTCHA answer.' });
    }
  }

  const users = await db.getUsers();
  const user = users.find(u => 
    u.email.toLowerCase() === (identifier || '').toLowerCase() || 
    u.username.toLowerCase() === (identifier || '').toLowerCase()
  );

  if (!user || user.passwordHash !== password) {
    const failRecord = bruteForceGuard.recordFailure(identifier || '');
    return res.status(401).json({
      error: failRecord.lockedUntil ? 'Account locked for 30s due to failed attempts.' : 'Invalid credentials.',
      locked: !!failRecord.lockedUntil,
      captchaRequired: failRecord.captchaRequired
    });
  }

  bruteForceGuard.recordSuccess(identifier || '');
  const session = await createSession(user, 'Email & Password', req);
  res.json({ success: true, session });
});

app.post('/api/register', async (req, res) => {
  const { fullName, email, username, password } = req.body;

  const pwdCheck = evaluatePassword(password || '');
  if (!pwdCheck.isValid) {
    return res.status(400).json({ error: 'Password does not satisfy complexity rules.' });
  }

  const users = await db.getUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    email: email.trim(),
    username: username.trim(),
    passwordHash: password,
    fullName: fullName.trim(),
    provider: 'local',
    createdAt: new Date().toISOString(),
    knownDevices: [],
    knownLocations: []
  };

  await db.saveUser(newUser);
  const session = await createSession(newUser, 'Email & Password', req);
  res.status(201).json({ success: true, session });
});

app.post('/api/google-auth', async (req, res) => {
  const users = await db.getUsers();
  const { user, isNew } = GoogleAuthService.handleGoogleLogin(req.body, users);
  if (isNew) await db.saveUser(user);

  const session = await createSession(user, 'Google OAuth 2.0', req);
  res.json({ success: true, session });
});

app.get('/api/sessions', (req, res) => {
  res.json({ sessions: activeSessions });
});

app.delete('/api/sessions/:sessionId', (req, res) => {
  activeSessions = ActiveSessionsService.revokeSession(activeSessions, req.params.sessionId);
  res.json({ success: true });
});

app.post('/api/sessions/revoke-others', (req, res) => {
  activeSessions = ActiveSessionsService.revokeAllOtherSessions(activeSessions, req.body.currentSessionId);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  INSA Cyber Talent Backend running at http://localhost:${PORT}`);
  console.log(`====================================================`);
});
