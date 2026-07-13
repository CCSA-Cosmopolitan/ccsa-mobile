import { Platform } from 'react-native';
import API_CONFIG from '../config/api';

/**
 * Enhanced Phone Verification Service with Network Handling
 * 
 * Features:
 * - Development mode with mock verification
 * - Production mode with backend SMS service
 * - Proper timeout and error handling
 * - Network connectivity checks
 */

class EmailVerificationService {
  constructor() {
    this.verificationId = null;
    this.email = null;
  }

  async checkNetworkConnectivity() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Network connectivity check failed:', error.message);
      return false;
    }
  }

  async sendCodeViaBackend(email) {
    try {
      const API_BASE_URL = API_CONFIG.BASE_URL;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 8000); 

      console.log(`✉️ Attempting backend Email to: ${email} via ${API_BASE_URL}`);

      const response = await fetch(`${API_BASE_URL}/api/email/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Backend Email service error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Backend Email sent successfully');
      return data.pinId || `backend_${Date.now()}`;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Email service request timed out. Please try again.');
      }
      throw error;
    }
  }

  async sendVerificationCode(email) {
    try {
      if (!email || email.trim() === '') {
        throw new Error('Email is required');
      }
      
      this.email = email.toLowerCase().trim();
      
      console.log(`✉️ Attempting to send verification code to: ${this.email}`);

      this.verificationId = await this.sendCodeViaBackend(this.email);
      console.log('✅ Verification code sent via backend service');
      return this.verificationId;
    } catch (error) {
      console.error('❌ Error sending verification code:', error);
      throw this.handleError(error);
    }
  }

  async verifyCode(verificationCode) {
    try {
      if (!this.verificationId) {
        throw new Error('No verification ID found. Please request a new code.');
      }
      
      if (!verificationCode || verificationCode.length !== 6) {
        throw new Error('Please enter a 6-digit verification code');
      }

      return await this.verifyCodeViaBackend(verificationCode);
    } catch (error) {
      console.error('❌ Error verifying code:', error);
      throw this.handleError(error);
    }
  }

  async verifyCodeViaBackend(verificationCode) {
    try {
      const API_BASE_URL = API_CONFIG.BASE_URL;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 8000);

      const response = await fetch(`${API_BASE_URL}/api/email/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pinId: this.verificationId,
          code: verificationCode,
          email: this.email 
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Invalid verification code. Please check and try again.');
        }
        throw new Error(`Verification service error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log('✅ Backend verification successful');
        return true;
      } else {
        throw new Error(data.error || 'Invalid verification code');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Verification request timed out. Please try again.');
      }
      throw error;
    }
  }

  handleError(error) {
    if (error.message && !error.code) return error;
    if (error.name === 'AbortError') return new Error('Request timed out. Please check your network connection and try again.');
    if (error.message && error.message.includes('Network request failed')) return new Error('Network error. Please check your internet connection and try again.');
    return new Error(error.message || 'Email verification failed. Please try again.');
  }

  clearVerification() {
    this.verificationId = null;
    this.email = null;
  }
}

export default EmailVerificationService;
