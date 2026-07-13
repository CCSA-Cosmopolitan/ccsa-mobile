import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrationSchema } from '../utils/validation';
import { useAuth } from '../store/AuthContext';
import LoadingScreen from './LoadingScreen';
import brand from '../theme/brand';

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        role: 'AGENT',
      };
      await signUp(data.email, data.password, userData);
      Alert.alert('Success', 'Account created successfully!');
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Creating account..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <Ionicons name="leaf" size={60} color={brand.colors.primary} />
            </View>
            
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join as an Enrolment Agent
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, errors.firstName && styles.inputError]}
                      placeholder="Enter your first name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                    />
                  </View>
                )}
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName.message}</Text>
              )}
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, errors.lastName && styles.inputError]}
                      placeholder="Enter your last name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                    />
                  </View>
                )}
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName.message}</Text>
              )}
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <Controller
                control={control}
                name="phoneNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, errors.phoneNumber && styles.inputError]}
                      placeholder="08012345678"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="phone-pad"
                      maxLength={11}
                    />
                  </View>
                )}
              />
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, errors.email && styles.inputError]}
                      placeholder="Enter your email"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                )}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, errors.password && styles.inputError]}
                      placeholder="Create a password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#9ca3af"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, errors.confirmPassword && styles.inputError]}
                      placeholder="Confirm your password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#9ca3af"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
              )}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>Create Account</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
  },
  backButton: {
    position: 'absolute',
    top: 32,
    left: 0,
    padding: 8,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: brand.colors.primaryExtraLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: brand.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: brand.colors.darkGray,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: brand.colors.darkGray,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: brand.colors.primaryLight,
    borderRadius: 12,
    backgroundColor: brand.colors.offWhite,
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: brand.colors.text,
  },
  inputError: {
    borderColor: brand.colors.error,
  },
  eyeButton: {
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: brand.colors.error,
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: brand.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  registerButtonText: {
    color: brand.colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: brand.colors.darkGray,
  },
  loginLink: {
    fontSize: 16,
    color: brand.colors.primary,
    fontWeight: '600',
  },
});
