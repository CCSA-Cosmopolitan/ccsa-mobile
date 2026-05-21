import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCorrectionStore } from '../../store/correctionStore';
import StateSelect from '../../components/common/StateSelect';
import LGASelect from '../../components/common/LGASelect';
import WardSelect from '../../components/common/WardSelect';
import PollingUnitSelect from '../../components/common/PollingUnitSelect';
import type { EditableFields } from '../../types/correction';

const PRIMARY = '#013358';

// ─── Field input ──────────────────────────────────────────────────────────────

function EditField({
  label,
  value,
  onChange,
  keyboardType = 'default',
  autoCapitalize = 'words',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: '#fff',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          paddingHorizontal: 14,
          paddingVertical: 11,
          fontSize: 14,
          color: '#0f172a',
        }}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? label}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginTop: 20,
        marginBottom: 12,
      }}
    >
      {title}
    </Text>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FarmerEditScreen({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const { farmerId } = route.params as { farmerId: string };
  const { selectedFarmer, saving, saveError, updateFarmer } = useCorrectionStore();

  const f = selectedFarmer;

  // ── Local form state (pre-populated from store) ────────────────────────────
  const [form, setForm] = useState<EditableFields>({
    firstName:        f?.firstName        ?? '',
    middleName:       f?.middleName       ?? '',
    lastName:         f?.lastName         ?? '',
    dateOfBirth:      f?.dateOfBirth?.split('T')[0] ?? '',
    gender:           f?.gender           ?? '',
    maritalStatus:    f?.maritalStatus    ?? '',
    employmentStatus: f?.employmentStatus ?? '',
    phone:            f?.phone            ?? '',
    email:            f?.email            ?? '',
    whatsAppNumber:   f?.whatsAppNumber   ?? '',
    address:          f?.address          ?? '',
    state:            f?.state            ?? '',
    lga:              f?.lga              ?? '',
    ward:             f?.ward             ?? '',
    pollingUnit:      f?.pollingUnit      ?? '',
    bankName:         f?.bankName         ?? '',
    accountNumber:    f?.accountNumber    ?? '',
    accountName:      f?.accountName      ?? '',
    bvn:              f?.bvn              ?? '',
    latitude:         f?.latitude         ?? undefined,
    longitude:        f?.longitude        ?? undefined,
  });

  const [gpsLoading, setGpsLoading] = useState(false);

  const captureGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to capture GPS coordinates.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setForm((p) => ({
        ...p,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      }));
    } catch {
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setGpsLoading(false);
    }
  };

  const set = (key: keyof EditableFields) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Compute diff for confirmation summary ──────────────────────────────────
  const getChangedFields = (): Partial<EditableFields> => {
    const diff: Partial<EditableFields> = {};
    (Object.keys(form) as (keyof EditableFields)[]).forEach((key) => {
      const original = String((f as any)?.[key] ?? '');
      const current  = String(form[key] ?? '');
      if (current !== original) (diff as any)[key] = form[key];
    });
    return diff;
  };

  const handleSave = async () => {
    const changes = getChangedFields();
    if (Object.keys(changes).length === 0) {
      Alert.alert('No Changes', 'You have not changed any fields.');
      return;
    }

    const changedLabels = Object.keys(changes).join(', ');

    Alert.alert(
      'Confirm Correction',
      `You are about to update: ${changedLabels}.\n\nThis change will be logged with your name and timestamp.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save Correction',
          style: 'default',
          onPress: async () => {
            try {
              await updateFarmer(farmerId, changes);
              Alert.alert('Saved', 'Farmer record has been updated successfully.', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('CorrectionDetail', { farmerId }),
                },
              ]);
            } catch (e: unknown) {
              // saveError is also set in the store; the Alert below is immediate feedback
              const msg = e instanceof Error ? e.message : 'Update failed';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  if (!f) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#94a3b8' }}>No farmer loaded</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f1f5f9' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View
        style={{
          backgroundColor: PRIMARY,
          paddingTop: 52,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
            Edit Farmer Record
          </Text>
          <Text style={{ color: '#93c5fd', fontSize: 12, marginTop: 1 }} numberOfLines={1}>
            NIN: {f.nin}
          </Text>
        </View>
      </View>

      {/* Note: NIN is read-only */}
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 12,
          backgroundColor: '#fef9c3',
          borderRadius: 10,
          padding: 10,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Ionicons name="lock-closed-outline" size={14} color="#92400e" style={{ marginRight: 6 }} />
        <Text style={{ color: '#92400e', fontSize: 12 }}>
          NIN cannot be edited. All changes are logged.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Personal ── */}
        <SectionHeader title="Personal Information" />
        <EditField label="First Name"    value={form.firstName    ?? ''} onChange={set('firstName')} />
        <EditField label="Middle Name"   value={form.middleName   ?? ''} onChange={set('middleName')} />
        <EditField label="Last Name"     value={form.lastName     ?? ''} onChange={set('lastName')} />
        <EditField
          label="Date of Birth (YYYY-MM-DD)"
          value={form.dateOfBirth ?? ''}
          onChange={set('dateOfBirth')}
          placeholder="e.g. 1990-01-15"
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
        />
        <EditField label="Gender"            value={form.gender           ?? ''} onChange={set('gender')} placeholder="Male / Female" />
        <EditField label="Marital Status"    value={form.maritalStatus    ?? ''} onChange={set('maritalStatus')} />
        <EditField label="Employment Status" value={form.employmentStatus ?? ''} onChange={set('employmentStatus')} />

        {/* ── Contact ── */}
        <SectionHeader title="Contact Information" />
        <EditField label="Phone"     value={form.phone          ?? ''} onChange={set('phone')}     keyboardType="phone-pad"  autoCapitalize="none" />
        <EditField label="WhatsApp"  value={form.whatsAppNumber ?? ''} onChange={set('whatsAppNumber')} keyboardType="phone-pad" autoCapitalize="none" />
        <EditField label="Email"     value={form.email          ?? ''} onChange={set('email')}     keyboardType="email-address" autoCapitalize="none" />
        <EditField label="Address"   value={form.address        ?? ''} onChange={set('address')} />

        {/* ── Location ── */}
        <SectionHeader title="Location" />
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>State</Text>
          <StateSelect
            selectedValue={form.state ?? ''}
            onValueChange={(v: string) => setForm((p) => ({ ...p, state: v, lga: '', ward: '', pollingUnit: '' }))}
            placeholder="Select State"
            error={null}
          />
        </View>
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>LGA</Text>
          <LGASelect
            selectedState={form.state ?? ''}
            selectedValue={form.lga ?? ''}
            onValueChange={(v: string) => setForm((p) => ({ ...p, lga: v, ward: '', pollingUnit: '' }))}
            placeholder="Select LGA"
            error={null}
          />
        </View>
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>Ward</Text>
          <WardSelect
            selectedState={form.state ?? ''}
            selectedLGA={form.lga ?? ''}
            selectedValue={form.ward ?? ''}
            onValueChange={(v: string) => setForm((p) => ({ ...p, ward: v, pollingUnit: '' }))}
            placeholder="Select Ward"
            error={null}
          />
        </View>
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>Polling Unit</Text>
          <PollingUnitSelect
            selectedState={form.state ?? ''}
            selectedLGA={form.lga ?? ''}
            selectedWard={form.ward ?? ''}
            selectedValue={form.pollingUnit ?? ''}
            onValueChange={(v: string) => setForm((p) => ({ ...p, pollingUnit: v }))}
            placeholder="Select Polling Unit"
            error={null}
          />
        </View>

        {/* ── GPS Coordinates ── */}
        <SectionHeader title="GPS Coordinates" />
        <View style={{
          backgroundColor: '#fff', borderRadius: 12,
          padding: 14, marginBottom: 14,
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
        }}>
          <TouchableOpacity
            onPress={captureGPS}
            disabled={gpsLoading}
            activeOpacity={0.85}
            style={{
              backgroundColor: PRIMARY, borderRadius: 10,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              paddingVertical: 12, opacity: gpsLoading ? 0.7 : 1,
            }}
          >
            {gpsLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="location-outline" size={18} color="#fff" style={{ marginRight: 8 }} />}
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: gpsLoading ? 8 : 0 }}>
              {gpsLoading ? 'Getting Location…' : 'Capture GPS Coordinates'}
            </Text>
          </TouchableOpacity>

          {typeof form.latitude === 'number' && typeof form.longitude === 'number' ? (
            <View style={{
              backgroundColor: '#dcfce7', borderRadius: 8,
              padding: 10, marginTop: 10,
              flexDirection: 'row', alignItems: 'center',
            }}>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" style={{ marginRight: 6 }} />
              <Text style={{ color: '#15803d', fontSize: 13, fontWeight: '500' }}>
                {`Lat: ${(form.latitude as number).toFixed(6)}   Lng: ${(form.longitude as number).toFixed(6)}`}
              </Text>
            </View>
          ) : (
            <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
              No GPS coordinates captured
            </Text>
          )}
        </View>

        {/* ── Financial ── */}
        <SectionHeader title="Financial Information" />
        <EditField label="Bank Name"      value={form.bankName      ?? ''} onChange={set('bankName')} />
        <EditField label="Account Number" value={form.accountNumber ?? ''} onChange={set('accountNumber')} keyboardType="number-pad" autoCapitalize="none" />
        <EditField label="Account Name"   value={form.accountName   ?? ''} onChange={set('accountName')} />
        <EditField label="BVN"            value={form.bvn           ?? ''} onChange={set('bvn')} keyboardType="number-pad" autoCapitalize="none" />

        {saveError ? (
          <View style={{ backgroundColor: '#fee2e2', borderRadius: 10, padding: 12, marginTop: 8 }}>
            <Text style={{ color: '#991b1b', fontSize: 13 }}>{saveError}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Save bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          padding: 16,
          paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        }}
      >
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: PRIMARY,
            borderRadius: 12,
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save Correction</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
