import {
  hashPassword,
  comparePassword,
  generateVerificationToken,
  generateResetToken,
  isValidEmail,
  isStrongPassword,
} from '../utils/auth';

describe('Auth Utilities', () => {
  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await hashPassword(password);

      const isMatch = await comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword123';
      const hashedPassword = await hashPassword(password);

      const isMatch = await comparePassword(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate a verification token', () => {
      const token = generateVerificationToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should generate unique tokens', () => {
      const token1 = generateVerificationToken();
      const token2 = generateVerificationToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateResetToken', () => {
    it('should generate a reset token', () => {
      const token = generateResetToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should generate unique tokens', () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test@.com',
        'test.example.com',
        'test@example',
        '',
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('isStrongPassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'TestPassword123',
        'MyStrong123Pass',
        'Secure1Password',
        'Complex123Pass!',
      ];

      strongPasswords.forEach(password => {
        expect(isStrongPassword(password)).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password', // No uppercase, no number
        'PASSWORD123', // No lowercase
        'TestPassword', // No number
        'test123', // No uppercase
        'Test1', // Too short
        '', // Empty
        '1234567', // No letters
      ];

      weakPasswords.forEach(password => {
        expect(isStrongPassword(password)).toBe(false);
      });
    });
  });
});
