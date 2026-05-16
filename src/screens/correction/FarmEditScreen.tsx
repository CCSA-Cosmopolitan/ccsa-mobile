import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCorrectionStore } from '../../store/correctionStore';
import type { FarmEditableFields } from '../../types/correction';

const PRIMARY = '#013358';
const BG = '#f1f5f9';

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1,
      textTransform: 'uppercase', marginTop: 24, marginBottom: 12,
    }}>
      {title}
    </Text>
  );
}

function EditField({
  label, value, onChange, keyboardType = 'default', placeholder, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'number-pad';
  placeholder?: string;
  hint?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>{label}</Text>
      <TextInput
        style={{
          backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
          borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 11,
          fontSize: 14, color: '#0f172a',
        }}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? label}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        autoCapitalize="words"
      />
      {hint && (
        <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{hint}</Text>
      )}
    </View>
  );
}

function CardSection({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 12, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, marginBottom: 8,
    }}>
      {children}
    </View>
  );
}

export default function FarmEditScreen({ route, navigation }: { route: any; navigation: any }) {
  const { farmId } = route.params;
  const { selectedFarm, savingFarm, saveFarmError, updateFarm } = useCorrectionStore();
  const f = selectedFarm;

  const [form, setForm] = useState<Partial<FarmEditableFields>>({
    primaryCrop:         f?.primaryCrop ?? '',
    cropVariety:         f?.cropVariety ?? '',
    produceCategory:     f?.produceCategory ?? '',
    farmState:           f?.farmState ?? '',
    farmLocalGovernment: f?.farmLocalGovernment ?? '',
    farmWard:            f?.farmWard ?? '',
    farmPollingUnit:     f?.farmPollingUnit ?? '',
    landforms:           f?.landforms ?? '',
    farmSize:            f?.farmSize ?? undefined,
    farmArea:            f?.farmArea ?? undefined,
    farmElevation:       f?.farmElevation ?? undefined,
    farmOwnership:       f?.farmOwnership ?? '',
    farmingSeason:       f?.farmingSeason ?? '',
    farmingExperience:   f?.farmingExperience ?? undefined,
    soilType:            f?.soilType ?? '',
    soilFertility:       f?.soilFertility ?? '',
    soilPH:              f?.soilPH ?? undefined,
    year:                f?.year ?? undefined,
    yieldSeason:         f?.yieldSeason ?? '',
    crop:                f?.crop ?? '',
    quantity:            f?.quantity ?? undefined,
  });

  const str = (v: string | number | undefined) => (v !== undefined && v !== null ? String(v) : '');
  const num = (v: string): number | undefined => {
    const n = parseFloat(v);
    return isNaN(n) ? undefined : n;
  };
  const int = (v: string): number | undefined => {
    const n = parseInt(v, 10);
    return isNaN(n) ? undefined : n;
  };

  const setStr = (key: keyof FarmEditableFields) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));
  const setNum = (key: keyof FarmEditableFields) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: num(v) }));
  const setInt = (key: keyof FarmEditableFields) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: int(v) }));

  const getChangedFields = (): Partial<FarmEditableFields> => {
    const diff: Partial<FarmEditableFields> = {};
    (Object.keys(form) as (keyof FarmEditableFields)[]).forEach((key) => {
      const original = f ? String((f as any)[key] ?? '') : '';
      const current = String((form as any)[key] ?? '');
      if (original !== current) {
        (diff as any)[key] = (form as any)[key];
      }
    });
    return diff;
  };

  const handleSubmit = async () => {
    const changes = getChangedFields();
    if (Object.keys(changes).length === 0) {
      Alert.alert('No Changes', 'No fields have been modified.');
      return;
    }

    const changeList = Object.keys(changes)
      .map((k) => `• ${k}`)
      .join('\n');

    Alert.alert(
      'Submit Farm Correction',
      `The following fields will be sent for admin review:\n\n${changeList}\n\nThis will create a pending correction request.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              await updateFarm(farmId, changes);
              Alert.alert(
                'Correction Submitted',
                'Your farm correction is pending admin review.',
                [{ text: 'OK', onPress: () => navigation.goBack() }],
              );
            } catch {
              // error shown via saveFarmError
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={{ backgroundColor: PRIMARY, paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#93c5fd', fontSize: 11, fontWeight: '600' }}>FARM CORRECTION</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Edit Farm Record</Text>
          </View>
        </View>
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8,
          paddingHorizontal: 12, paddingVertical: 8, marginTop: 8,
        }}>
          <Text style={{ color: '#bfdbfe', fontSize: 12 }}>
            Changes will be submitted for admin review before taking effect.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {saveFarmError && (
          <View style={{
            backgroundColor: '#fef2f2', borderRadius: 10, padding: 12,
            flexDirection: 'row', alignItems: 'center', marginBottom: 16,
          }}>
            <Ionicons name="warning-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={{ color: '#b91c1c', fontSize: 13, flex: 1 }}>{saveFarmError}</Text>
          </View>
        )}

        <SectionHeader title="Crop Information" />
        <CardSection>
          <EditField label="Primary Crop"     value={str(form.primaryCrop)}     onChange={setStr('primaryCrop')} />
          <EditField label="Crop Variety"     value={str(form.cropVariety)}     onChange={setStr('cropVariety')} />
          <EditField label="Produce Category" value={str(form.produceCategory)} onChange={setStr('produceCategory')} />
        </CardSection>

        <SectionHeader title="Farm Location" />
        <CardSection>
          <EditField label="State"            value={str(form.farmState)}           onChange={setStr('farmState')} />
          <EditField label="Local Government" value={str(form.farmLocalGovernment)} onChange={setStr('farmLocalGovernment')} />
          <EditField label="Ward"             value={str(form.farmWard)}            onChange={setStr('farmWard')} />
          <EditField label="Polling Unit"     value={str(form.farmPollingUnit)}     onChange={setStr('farmPollingUnit')} />
          <EditField label="Landforms"        value={str(form.landforms)}           onChange={setStr('landforms')} />
        </CardSection>

        <SectionHeader title="Farm Details" />
        <CardSection>
          <EditField label="Farm Size (ha)"      value={str(form.farmSize)}           onChange={setNum('farmSize')}           keyboardType="decimal-pad" hint="Hectares" />
          <EditField label="Farm Area"           value={str(form.farmArea)}           onChange={setNum('farmArea')}           keyboardType="decimal-pad" />
          <EditField label="Farm Elevation (m)"  value={str(form.farmElevation)}      onChange={setNum('farmElevation')}      keyboardType="decimal-pad" />
          <EditField label="Farm Ownership"      value={str(form.farmOwnership)}      onChange={setStr('farmOwnership')} />
          <EditField label="Farming Season"      value={str(form.farmingSeason)}      onChange={setStr('farmingSeason')} />
          <EditField label="Farming Experience"  value={str(form.farmingExperience)}  onChange={setInt('farmingExperience')}  keyboardType="number-pad" hint="Years" />
        </CardSection>

        <SectionHeader title="Soil Information" />
        <CardSection>
          <EditField label="Soil Type"     value={str(form.soilType)}     onChange={setStr('soilType')} />
          <EditField label="Soil Fertility" value={str(form.soilFertility)} onChange={setStr('soilFertility')} />
          <EditField label="Soil pH"        value={str(form.soilPH)}       onChange={setNum('soilPH')} keyboardType="decimal-pad" hint="0 – 14" />
        </CardSection>

        <SectionHeader title="Yield Information" />
        <CardSection>
          <EditField label="Year"          value={str(form.year)}        onChange={setNum('year')}     keyboardType="number-pad" />
          <EditField label="Yield Season"  value={str(form.yieldSeason)} onChange={setStr('yieldSeason')} />
          <EditField label="Crop Name"     value={str(form.crop)}        onChange={setStr('crop')} />
          <EditField label="Quantity (kg)" value={str(form.quantity)}    onChange={setNum('quantity')} keyboardType="decimal-pad" />
        </CardSection>
      </ScrollView>

      {/* Sticky footer */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', padding: 16,
        borderTopWidth: 1, borderTopColor: '#e2e8f0',
        shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 8,
      }}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={savingFarm}
          activeOpacity={0.85}
          style={{
            backgroundColor: savingFarm ? '#94a3b8' : PRIMARY,
            borderRadius: 12, paddingVertical: 15,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {savingFarm ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          )}
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginLeft: savingFarm ? 8 : 0 }}>
            {savingFarm ? 'Submitting…' : 'Submit Farm Correction'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
