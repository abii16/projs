class BruteForceGuard {
  constructor(maxAttempts = 3, lockoutDurationSec = 30) {
    this.maxAttempts = maxAttempts;
    this.lockoutDurationSec = lockoutDurationSec;
    this.attempts = {};
  }

  getRecord(identifier) {
    const key = (identifier || 'global').toLowerCase();
    const record = this.attempts[key] || { count: 0, lockedUntil: null, captchaRequired: false };
    if (record.lockedUntil && Date.now() > record.lockedUntil) {
      record.count = 0;
      record.lockedUntil = null;
      record.captchaRequired = false;
      this.attempts[key] = record;
    }
    return record;
  }

  recordFailure(identifier) {
    const key = (identifier || 'global').toLowerCase();
    const record = this.getRecord(key);
    record.count += 1;
    if (record.count >= 2) record.captchaRequired = true;
    if (record.count >= this.maxAttempts) {
      record.lockedUntil = Date.now() + this.lockoutDurationSec * 1000;
    }
    this.attempts[key] = record;
    return record;
  }

  recordSuccess(identifier) {
    const key = (identifier || 'global').toLowerCase();
    delete this.attempts[key];
  }

  isLocked(identifier) {
    const record = this.getRecord(identifier);
    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      const remainingSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
      return { locked: true, remainingSeconds };
    }
    return { locked: false, remainingSeconds: 0 };
  }
}

function generateCaptchaChallenge() {
  const num1 = Math.floor(Math.random() * 9) + 1;
  const num2 = Math.floor(Math.random() * 9) + 1;
  return { questionText: `${num1} + ${num2} = ?`, answer: num1 + num2 };
}

function validateCaptcha(userAnswer, expectedAnswer) {
  const parsed = parseInt(String(userAnswer).trim(), 10);
  return !isNaN(parsed) && parsed === expectedAnswer;
}

module.exports = { BruteForceGuard, generateCaptchaChallenge, validateCaptcha };
