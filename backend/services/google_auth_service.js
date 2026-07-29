const { OAuth2Client } = require('google-auth-library');

const client = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

class GoogleAuthService {
  static async verifyIdToken(idToken) {
    if (!client) {
      throw new Error('Google Client ID not configured in .env');
    }
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      googleId: payload.sub
    };
  }

  static handleGoogleLogin(googleProfile, users) {
    let user = users.find(u => u.email.toLowerCase() === googleProfile.email.toLowerCase());
    let isNew = false;

    if (!user) {
      isNew = true;
      user = {
        id: 'usr_g_' + Date.now(),
        email: googleProfile.email,
        username: googleProfile.email.split('@')[0],
        passwordHash: null,
        fullName: googleProfile.name,
        provider: 'google',
        createdAt: new Date().toISOString(),
        knownDevices: [],
        knownLocations: []
      };
      users.push(user);
    }

    return { user, isNew };
  }
}

module.exports = { GoogleAuthService };
