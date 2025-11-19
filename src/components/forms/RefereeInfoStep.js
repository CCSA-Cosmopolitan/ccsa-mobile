import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useFieldArray } from 'react-hook-form';

const RELATION_OPTIONS = [
  'Father',
  'Mother',
  'Spouse',
  'Sibling',
  'Child',
  'Relative',
  'Friend',
  'Colleague',
  'Neighbor',
  'Community Leader',
  'Other',
];

export default function RefereeInfoStep({ control, errors, watch, setValue }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'referees',
  });

  const addReferee = () => {
    if (fields.length < 3) {
      append({ fullName: '', phoneNumber: '', relation: '' });
    }
  };

  const removeReferee = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="people-outline" size={48} color="#013358" />
        <Text style={styles.title}>Referee Information</Text>
        <Text style={styles.description}>
          Add 1-3 referees who can vouch for the farmer's identity
        </Text>
      </View>

      <View style={styles.form}>
        {fields.map((field, index) => (
          <View key={field.id} style={styles.refereeContainer}>
            <View style={styles.refereeHeader}>
              <Text style={styles.refereeTitle}>Referee {index + 1}</Text>
              {fields.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeReferee(index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <Controller
                control={control}
                name={`referees.${index}.fullName`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={[
                        styles.input,
                        errors.referees?.[index]?.fullName && styles.inputError
                      ]}
                      placeholder="Enter referee's full name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                    />
                  </View>
                )}
              />
              {errors.referees?.[index]?.fullName && (
                <Text style={styles.errorText}>
                  {errors.referees[index].fullName.message}
                </Text>
              )}
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <Controller
                control={control}
                name={`referees.${index}.phoneNumber`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={[
                        styles.input,
                        errors.referees?.[index]?.phoneNumber && styles.inputError
                      ]}
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
              {errors.referees?.[index]?.phoneNumber && (
                <Text style={styles.errorText}>
                  {errors.referees[index].phoneNumber.message}
                </Text>
              )}
            </View>

            {/* Relation */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relationship *</Text>
              <Controller
                control={control}
                name={`referees.${index}.relation`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="heart-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={[
                        styles.input,
                        errors.referees?.[index]?.relation && styles.inputError
                      ]}
                      placeholder="e.g., Brother, Friend, Colleague"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                    />
                  </View>
                )}
              />
              {errors.referees?.[index]?.relation && (
                <Text style={styles.errorText}>
                  {errors.referees[index].relation.message}
                </Text>
              )}
            </View>

            {/* Quick Select Relations */}
            <View style={styles.quickSelectContainer}>
              <Text style={styles.quickSelectLabel}>Quick Select:</Text>
              <View style={styles.quickSelectButtons}>
                {RELATION_OPTIONS.slice(0, 6).map((relation) => (
                  <TouchableOpacity
                    key={relation}
                    style={styles.quickSelectButton}
                    onPress={() => {
                      const currentValue = watch(`referees.${index}.relation`);
                      if (currentValue !== relation) {
                        setValue(`referees.${index}.relation`, relation);
                      }
                    }}
                  >
                    <Text style={styles.quickSelectButtonText}>{relation}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}

        {/* Add Referee Button */}
        {fields.length < 3 && (
          <TouchableOpacity style={styles.addButton} onPress={addReferee}>
            <Ionicons name="add-circle-outline" size={24} color="#013358" />
            <Text style={styles.addButtonText}>Add Another Referee</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.infoItem}>
          <Ionicons name="information-circle-outline" size={20} color="#013358" />
          <Text style={styles.infoText}>
            Referees help verify the farmer's identity and build trust in the community
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
          <Text style={styles.infoText}>
            At least one referee is required, up to 3 referees can be added
          </Text>
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
  refereeContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  refereeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refereeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  inputGroup: {
    marginBottom: 16,
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
    backgroundColor: '#ffffff',
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
  quickSelectContainer: {
    marginTop: 8,
  },
  quickSelectLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  quickSelectButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSelectButton: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  quickSelectButtonText: {
    fontSize: 12,
    color: '#3730a3',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#013358',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    color: '#013358',
    fontWeight: '600',
    marginLeft: 8,
  },
  info: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});
