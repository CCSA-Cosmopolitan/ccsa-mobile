import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmailVerificationService from '../../services/emailVerificationService';

// Create an instance of the email verification service
const emailVerificationService = new EmailVerificationService();

export default function EmailVerificationModal({ 
  visible, 
  email, 
  onVerificationComplete, 
  onCancel 
}) {
  const [step, setStep] = useState('send'); // 'send' or 'verify'
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verificationId, setVerificationId] = useState(null);
  
  const codeInputs = useRef([]);
  const countdownInterval = useRef(null);

  useEffect(() => {
    if (countdown > 0) {
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }

    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [countdown]);

  useEffect(() => {
    // Reset state when modal opens
    if (visible) {
      setStep('send');
      setVerificationCode('');
      setCountdown(0);
      setVerificationId(null);
    }
  }, [visible]);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Email address is required');
      return;
    }

    try {
      setLoading(true);
      
      const id = await emailVerificationService.sendVerificationCode(email);
      setVerificationId(id);
      setStep('verify');
      setCountdown(60); // 60 second countdown
      
      Alert.alert(
        'Code Sent', 
        `A verification code has been sent to ${email}`
      );
    } catch (error) {
      console.error('Send code error:', error);
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    try {
      setLoading(true);
      
      const isValid = await emailVerificationService.verifyCode(verificationCode);
      
      if (isValid) {
        Alert.alert(
          'Verification Successful', 
          'Your email address has been verified!',
          [
            {
              text: 'OK',
              onPress: () => {
                emailVerificationService.clearVerification();
                onVerificationComplete(email);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Verify code error:', error);
      Alert.alert('Verification Failed', error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setVerificationCode('');
    // Clear the input fields
    codeInputs.current.forEach(input => input?.clear());
    
    await handleSendCode();
  };

  const handleCodeChange = (text, index) => {
    const newCode = verificationCode.split('');
    newCode[index] = text;
    const updatedCode = newCode.join('');
    
    setVerificationCode(updatedCode);
    
    // Auto-focus next input
    if (text && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key, index) => {
    // Handle backspace
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const renderSendStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="phone-portrait-outline" size={48} color="#013358" />
      </View>
      
      <Text style={styles.title}>Verify Email Address</Text>
      <Text style={styles.description}>
        We'll send a verification code to confirm this email address
      </Text>
      
      <View style={styles.phoneDisplay}>
        <Ionicons name="mail-outline" size={20} color="#6b7280" />
        <Text style={styles.phoneNumber}>
          {email}
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSendCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={20} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Send Code</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVerifyStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="shield-checkmark-outline" size={48} color="#10b981" />
      </View>
      
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.description}>
        Enter the 6-digit code sent to{'\n'}
        {email}
      </Text>
      
      <View style={styles.codeInputContainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <TextInput
            key={index}
            ref={(ref) => (codeInputs.current[index] = ref)}
            style={styles.codeInput}
            value={verificationCode[index] || ''}
            onChangeText={(text) => handleCodeChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
          />
        ))}
      </View>
      
      <View style={styles.resendContainer}>
        {countdown > 0 ? (
          <Text style={styles.countdownText}>
            Resend code in {countdown}s
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResendCode}>
            <Text style={styles.resendText}>Resend Code</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            verificationCode.length !== 6 && styles.disabledButton
          ]}
          onPress={handleVerifyCode}
          disabled={loading || verificationCode.length !== 6}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Verify</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => setStep('send')}
        >
          <Text style={styles.secondaryButtonText}>Change Email</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        {step === 'send' ? renderSendStep() : renderVerifyStep()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    padding: 8,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  phoneDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 32,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    letterSpacing: 1,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  resendContainer: {
    marginBottom: 32,
  },
  countdownText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  resendText: {
    fontSize: 16,
    color: '#013358',
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#013358',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});
