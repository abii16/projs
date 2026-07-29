class ActiveSessionsService {
  static getActiveSessions(sessionsStore, userId) {
    return sessionsStore.filter(s => s.userId === userId);
  }

  static revokeSession(sessionsStore, sessionId) {
    return sessionsStore.filter(s => s.sessionId !== sessionId);
  }

  static revokeAllOtherSessions(sessionsStore, currentSessionId) {
    return sessionsStore.filter(s => s.sessionId === currentSessionId);
  }
}

module.exports = { ActiveSessionsService };
