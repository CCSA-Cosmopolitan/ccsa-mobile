import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller } from 'react-hook-form';
import CustomSelect from '../common/CustomSelect';

const GENDER_OPTIONS = [
  { label: 'Select Gender', value: '' },
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { label: 'Select Employment Status', value: '' },
  { label: 'Employed', value: 'EMPLOYED' },
  { label: 'Self-Employed', value: 'SELF_EMPLOYED' },
  { label: 'Unemployed', value: 'UNEMPLOYED' },
  { label: 'Student', value: 'STUDENT' },
  { label: 'Retired', value: 'RETIRED' },
];

const MARITAL_STATUS_OPTIONS = [
  { label: 'Select Marital Status', value: '' },
  { label: 'Single', value: 'SINGLE' },
  { label: 'Married', value: 'MARRIED' },
  { label: 'Divorced', value: 'DIVORCED' },
  { label: 'Widowed', value: 'WIDOWED' },
];

export default function PersonalInfoStep({ control, errors }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-outline" size={48} color="#013358" />
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.description}>
          Complete the farmer's personal details
        </Text>
      </View>

      <View style={styles.form}>
        {/* First Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name *</Text>
          <Controller
            control={control}
            name="personalInfo.firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.personalInfo?.firstName && styles.inputError]}
                  placeholder="Enter first name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                />
              </View>
            )}
          />
          {errors.personalInfo?.firstName && (
            <Text style={styles.errorText}>{errors.personalInfo.firstName.message}</Text>
          )}
        </View>

        {/* Middle Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Middle Name</Text>
          <Controller
            control={control}
            name="personalInfo.middleName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter middle name (optional)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                />
              </View>
            )}
          />
        </View>

        {/* Last Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <Controller
            control={control}
            name="personalInfo.lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.personalInfo?.lastName && styles.inputError]}
                  placeholder="Enter last name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                />
              </View>
            )}
          />
          {errors.personalInfo?.lastName && (
            <Text style={styles.errorText}>{errors.personalInfo.lastName.message}</Text>
          )}
        </View>

        {/* Date of Birth */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <Controller
            control={control}
            name="personalInfo.dateOfBirth"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.personalInfo?.dateOfBirth && styles.inputError]}
                  placeholder="YYYY-MM-DD"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              </View>
            )}
          />
          {errors.personalInfo?.dateOfBirth && (
            <Text style={styles.errorText}>{errors.personalInfo.dateOfBirth.message}</Text>
          )}
        </View>

        {/* Gender */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender *</Text>
          <Controller
            control={control}
            name="personalInfo.gender"
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                options={GENDER_OPTIONS}
                selectedValue={value || ''}
                onValueChange={(val) => {
                  console.log('Gender selected:', val);
                  onChange(val);
                }}
                placeholder="Select Gender"
                error={!!errors.personalInfo?.gender}
              />
            )}
          />
          {errors.personalInfo?.gender && (
            <Text style={styles.errorText}>{errors.personalInfo.gender.message}</Text>
          )}
        </View>

        {/* Employment Status */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Employment Status *</Text>
          <Controller
            control={control}
            name="personalInfo.employmentStatus"
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                options={EMPLOYMENT_STATUS_OPTIONS}
                selectedValue={value || ''}
                onValueChange={(val) => {
                  console.log('Employment Status selected:', val);
                  onChange(val);
                }}
                placeholder="Select Employment Status"
                error={!!errors.personalInfo?.employmentStatus}
              />
            )}
          />
          {errors.personalInfo?.employmentStatus && (
            <Text style={styles.errorText}>{errors.personalInfo.employmentStatus.message}</Text>
          )}
        </View>

        {/* Marital Status */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Marital Status *</Text>
          <Controller
            control={control}
            name="personalInfo.maritalStatus"
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                options={MARITAL_STATUS_OPTIONS}
                selectedValue={value || ''}
                onValueChange={(val) => {
                  console.log('Marital Status selected:', val);
                  onChange(val);
                }}
                placeholder="Select Marital Status"
                error={!!errors.personalInfo?.maritalStatus}
              />
            )}
          />
          {errors.personalInfo?.maritalStatus && (
            <Text style={styles.errorText}>{errors.personalInfo.maritalStatus.message}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
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
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
  },
});
