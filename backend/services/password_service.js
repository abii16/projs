const COMMON_WEAK_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'admin', 'welcome', 
  'login', 'password123', '123456789', 'iloveyou', 'sunshine', '123123'
]);

function evaluatePassword(password) {
  if (!password) {
    return {
      score: 0,
      label: 'None',
      checks: { length: false, uppercase: false, lowercase: false, number: false, special: false, notCommon: true },
      isValid: false
    };
  }

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    notCommon: !COMMON_WEAK_PASSWORDS.has(password.toLowerCase())
  };

  let points = 0;
  if (checks.length) points += 25;
  if (checks.uppercase) points += 15;
  if (checks.lowercase) points += 15;
  if (checks.number) points += 15;
  if (checks.special) points += 20;
  if (password.length >= 12) points += 10;
  if (!checks.notCommon) points = Math.min(points, 20);

  let label = 'Weak';
  if (points >= 80 && checks.notCommon) label = 'Strong';
  else if (points >= 50 && checks.notCommon) label = 'Fair';

  const isValid = checks.length && checks.uppercase && checks.lowercase && (checks.number || checks.special) && checks.notCommon;

  return { score: Math.min(points, 100), label, checks, isValid };
}

module.exports = { evaluatePassword };
