const ACCESS_TOKEN_TTL_SEC = 15 * 60;
const REFRESH_TOKEN_TTL_SEC = 7 * 24 * 60 * 60;

class TokenSessionManager {
  static createTokenPair() {
    const now = Date.now();
    return {
      accessToken: 'at_' + Math.random().toString(36).substring(2) + '.' + Math.random().toString(36).substring(2),
      accessTokenExpiresAt: now + ACCESS_TOKEN_TTL_SEC * 1000,
      refreshToken: 'rt_' + Math.random().toString(36).substring(2) + '.' + Math.random().toString(36).substring(2),
      refreshTokenExpiresAt: now + REFRESH_TOKEN_TTL_SEC * 1000,
      lastActiveTimestamp: now
    };
  }

  static rotateTokens(session) {
    const now = Date.now();
    if (now > session.refreshTokenExpiresAt) {
      throw new Error('Refresh token expired.');
    }
    const newTokens = this.createTokenPair();
    session.accessToken = newTokens.accessToken;
    session.accessTokenExpiresAt = newTokens.accessTokenExpiresAt;
    session.refreshToken = newTokens.refreshToken;
    session.refreshTokenExpiresAt = newTokens.refreshTokenExpiresAt;
    session.lastActiveTimestamp = now;
    return session;
  }

  static getRemainingAccessTime(session) {
    if (!session || !session.accessTokenExpiresAt) return 0;
    return Math.max(0, session.accessTokenExpiresAt - Date.now());
  }
}

module.exports = { TokenSessionManager, ACCESS_TOKEN_TTL_SEC, REFRESH_TOKEN_TTL_SEC };
