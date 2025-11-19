import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller } from 'react-hook-form';
import BankSelect from '../common/BankSelect';

export default function BankInfoStep({ control, errors }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="card-outline" size={48} color="#013358" />
        <Text style={styles.title}>Banking Information</Text>
        <Text style={styles.description}>
          Enter the farmer's banking details for financial transactions
        </Text>
      </View>

      <View style={styles.form}>
        {/* BVN */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bank Verification Number (BVN) *</Text>
          <Controller
            control={control}
            name="bankInfo.bvn"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="finger-print" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 11-digit BVN"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  maxLength={11}
                />
              </View>
            )}
          />
          {errors?.bankInfo?.bvn && (
            <Text style={styles.errorText}>{errors.bankInfo.bvn.message}</Text>
          )}
        </View>

        {/* Bank Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bank Name *</Text>
          <Controller
            control={control}
            name="bankInfo.bankName"
            render={({ field: { onChange, value } }) => (
              <BankSelect
                selectedValue={value}
                onValueChange={onChange}
                placeholder="Select your bank"
                error={!!errors?.bankInfo?.bankName}
              />
            )}
          />
          {errors?.bankInfo?.bankName && (
            <Text style={styles.errorText}>{errors.bankInfo.bankName.message}</Text>
          )}
        </View>

        {/* Account Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Account Name *</Text>
          <Controller
            control={control}
            name="bankInfo.accountName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter account holder name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                />
              </View>
            )}
          />
          {errors?.bankInfo?.accountName && (
            <Text style={styles.errorText}>{errors.bankInfo.accountName.message}</Text>
          )}
        </View>

        {/* Account Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Account Number *</Text>
          <Controller
            control={control}
            name="bankInfo.accountNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="card" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit account number"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            )}
          />
          {errors?.bankInfo?.accountNumber && (
            <Text style={styles.errorText}>{errors.bankInfo.accountNumber.message}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#013358',
    marginVertical: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#013358',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 5,
    marginLeft: 5,
  },
});
