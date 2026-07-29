class AnomalyDetector {
  static analyze(user, currentSession) {
    const alerts = [];
    const knownDevices = user.knownDevices || [];
    const knownLocations = user.knownLocations || [];

    const isNewDevice = !knownDevices.some(d => d.browser === currentSession.browser && d.os === currentSession.os);
    const isNewLocation = !knownLocations.some(l => l.country === currentSession.location.country);

    if (isNewDevice) {
      alerts.push({
        id: 'alert_' + Date.now(),
        type: 'NEW_DEVICE',
        title: 'New Device Detected',
        message: `Sign-in from unfamiliar device (${currentSession.browser} on ${currentSession.os}).`,
        timestamp: new Date().toISOString(),
        location: `${currentSession.location.city}, ${currentSession.location.country}`,
        ip: currentSession.ip
      });
    }

    if (isNewLocation) {
      alerts.push({
        id: 'alert_' + (Date.now() + 1),
        type: 'UNUSUAL_LOCATION',
        title: 'Unfamiliar Location',
        message: `Login originating from ${currentSession.location.city}, ${currentSession.location.country}.`,
        timestamp: new Date().toISOString(),
        location: `${currentSession.location.city}, ${currentSession.location.country}`,
        ip: currentSession.ip
      });
    }

    return alerts;
  }
}

module.exports = { AnomalyDetector };
