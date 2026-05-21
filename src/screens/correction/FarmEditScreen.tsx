import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCorrectionStore } from '../../store/correctionStore';
import StateSelect from '../../components/common/StateSelect';
import LGASelect from '../../components/common/LGASelect';
import WardSelect from '../../components/common/WardSelect';
import PollingUnitSelect from '../../components/common/PollingUnitSelect';
import EnhancedCustomSelect from '../../components/common/EnhancedCustomSelect';
import FarmPolygonMapper from '../../components/common/FarmPolygonMapper';
import { calculateFarmSizeFromPolygon } from '../../utils/farmCalculations';
import type { FarmEditableFields } from '../../types/correction';

const PRIMARY = '#013358';
const BG = '#f1f5f9';

// ─── Option arrays ────────────────────────────────────────────────────────────

const FARM_OWNERSHIP = [
  { label: 'Select Ownership Type', value: '' },
  { label: 'Owned', value: 'OWNED' },
  { label: 'Rented', value: 'RENTED' },
  { label: 'Leased', value: 'LEASED' },
  { label: 'Family Land', value: 'FAMILY' },
  { label: 'Community Land', value: 'COMMUNITY' },
];

const FARM_SEASONS = [
  { label: 'Select Farm Season', value: '' },
  { label: 'Wet Season', value: 'WET' },
  { label: 'Dry Season', value: 'DRY' },
  { label: 'Year Round', value: 'YEAR_ROUND' },
];

const SOIL_TYPES = [
  { label: 'Select Soil Type', value: '' },
  { label: 'Clay', value: 'CLAY' },
  { label: 'Sandy', value: 'SANDY' },
  { label: 'Loamy', value: 'LOAMY' },
  { label: 'Silty', value: 'SILTY' },
  { label: 'Peaty', value: 'PEATY' },
  { label: 'Rocky', value: 'ROCKY' },
];

const SOIL_FERTILITY_LEVELS = [
  { label: 'Select Soil Fertility', value: '' },
  { label: 'Very High', value: 'VERY_HIGH' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
  { label: 'Very Low', value: 'VERY_LOW' },
];

const YIELD_SEASONS = [
  { label: 'Select Yield Season', value: '' },
  { label: 'First Season (March–July)', value: 'FIRST_SEASON' },
  { label: 'Second Season (Aug–Dec)', value: 'SECOND_SEASON' },
  { label: 'Year Round', value: 'YEAR_ROUND' },
  { label: 'Dry Season', value: 'DRY_SEASON' },
  { label: 'Wet Season', value: 'WET_SEASON' },
];

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

  const [form, setForm] = useState<Partial<FarmEditableFields> & { farmPolygon?: any; farmLatitude?: number | null; farmLongitude?: number | null }>({
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
    farmLatitude:        (f as any)?.farmLatitude ?? null,
    farmLongitude:       (f as any)?.farmLongitude ?? null,
    farmPolygon:         (f as any)?.farmPolygon ?? [],
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
        farmLatitude: loc.coords.latitude,
        farmLongitude: loc.coords.longitude,
      }));
    } catch {
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handlePolygonUpdate = (pts: Array<{ latitude: number; longitude: number }>) => {
    const newPolygon = pts;
    let newSize = form.farmSize;
    if (pts.length >= 3) {
      try {
        const calculated = calculateFarmSizeFromPolygon(pts);
        if (typeof calculated === 'number' && !isNaN(calculated)) {
          newSize = calculated;
        }
      } catch {
        // keep existing size if calculation fails
      }
    }
    setForm((p) => ({ ...p, farmPolygon: newPolygon, farmSize: newSize }));
  };

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
    (Object.keys(form) as (keyof typeof form)[]).forEach((key) => {
      const original = f ? (f as any)[key] : undefined;
      const current = (form as any)[key];
      if (key === 'farmPolygon') {
        if (JSON.stringify(original ?? []) !== JSON.stringify(current ?? [])) {
          (diff as any)[key] = current;
        }
      } else {
        const originalStr = String(original ?? '');
        const currentStr = String(current ?? '');
        if (originalStr !== currentStr) {
          (diff as any)[key] = current;
        }
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
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>State</Text>
            <StateSelect
              selectedValue={form.farmState ?? ''}
              onValueChange={(v: string) => setForm((p) => ({ ...p, farmState: v, farmLocalGovernment: '', farmWard: '', farmPollingUnit: '' }))}
              placeholder="Select State"
              error={null}
            />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>LGA</Text>
            <LGASelect
              selectedState={form.farmState ?? ''}
              selectedValue={form.farmLocalGovernment ?? ''}
              onValueChange={(v: string) => setForm((p) => ({ ...p, farmLocalGovernment: v, farmWard: '', farmPollingUnit: '' }))}
              placeholder="Select LGA"
              error={null}
            />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>Ward</Text>
            <WardSelect
              selectedState={form.farmState ?? ''}
              selectedLGA={form.farmLocalGovernment ?? ''}
              selectedValue={form.farmWard ?? ''}
              onValueChange={(v: string) => setForm((p) => ({ ...p, farmWard: v, farmPollingUnit: '' }))}
              placeholder="Select Ward"
              error={null}
            />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>Polling Unit</Text>
            <PollingUnitSelect
              selectedState={form.farmState ?? ''}
              selectedLGA={form.farmLocalGovernment ?? ''}
              selectedWard={form.farmWard ?? ''}
              selectedValue={form.farmPollingUnit ?? ''}
              onValueChange={(v: string) => setForm((p) => ({ ...p, farmPollingUnit: v }))}
              placeholder="Select Polling Unit"
              error={null}
            />
          </View>
          <EditField label="Landforms" value={str(form.landforms)} onChange={setStr('landforms')} />
        </CardSection>

        <SectionHeader title="GPS Center Point" />
        <CardSection>
          <TouchableOpacity
            onPress={captureGPS}
            disabled={gpsLoading}
            activeOpacity={0.85}
            style={{
              backgroundColor: PRIMARY, borderRadius: 10,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              paddingVertical: 12, marginBottom: 10,
              opacity: gpsLoading ? 0.7 : 1,
            }}
          >
            {gpsLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="location-outline" size={18} color="#fff" style={{ marginRight: 8 }} />}
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: gpsLoading ? 8 : 0 }}>
              {gpsLoading ? 'Getting Location…' : 'Capture GPS Center Point'}
            </Text>
          </TouchableOpacity>
          {typeof form.farmLatitude === 'number' && typeof form.farmLongitude === 'number' ? (
            <View style={{
              backgroundColor: '#dcfce7', borderRadius: 8, padding: 10,
              flexDirection: 'row', alignItems: 'center',
            }}>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" style={{ marginRight: 6 }} />
              <Text style={{ color: '#15803d', fontSize: 13, fontWeight: '500' }}>
                {`Lat: ${(form.farmLatitude as number).toFixed(6)}   Lng: ${(form.farmLongitude as number).toFixed(6)}`}
              </Text>
            </View>
          ) : (
            <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>
              No GPS center point captured
            </Text>
          )}
        </CardSection>

        <SectionHeader title="Farm Boundary" />
        <CardSection>
          <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
            Map the boundary of this farm by placing points on the map. Farm size will be auto-calculated.
          </Text>
          <FarmPolygonMapper
            onPolygonUpdate={handlePolygonUpdate}
            initialPolygon={form.farmPolygon ?? []}
          />
          {Array.isArray(form.farmPolygon) && form.farmPolygon.length >= 3 && (
            <View style={{
              backgroundColor: '#eff6ff', borderRadius: 8, padding: 10, marginTop: 8,
              flexDirection: 'row', alignItems: 'center',
            }}>
              <Ionicons name="map-outline" size={14} color="#2563eb" style={{ marginRight: 6 }} />
              <Text style={{ color: '#1d4ed8', fontSize: 12 }}>
                {form.farmPolygon.length} boundary points captured
                {form.farmSize ? `  •  ~${(form.farmSize as number).toFixed(2)} ha` : ''}
              </Text>
            </View>
          )}
        </CardSection>

        <SectionHeader title="Farm Details" />
        <CardSection>
          <EditField label="Farm Size (ha)"      value={str(form.farmSize)}           onChange={setNum('farmSize')}           keyboardType="decimal-pad" hint="Hectares" />
          <EditField label="Farm Area"           value={str(form.farmArea)}           onChange={setNum('farmArea')}           keyboardType="decimal-pad" />
          <EditField label="Farm Elevation (m)"  value={str(form.farmElevation)}      onChange={setNum('farmElevation')}      keyboardType="decimal-pad" />
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>Farm Ownership</Text>
            <EnhancedCustomSelect
              options={FARM_OWNERSHIP}
              selectedValue={form.farmOwnership ?? ''}
              onValueChange={(v: string) => setForm((p) => ({ ...p, farmOwnership: v }))}
              placeholder="Select Ownership Type"
              icon="home-outline"
              title="Farm Ownership"
            />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>Farming Season</Text>
            <EnhancedCustomSelect
              options={FARM_SEASONS}
              selectedValue={form.farmingSeason ?? ''}
              onValueChange={(v: string) => setForm((p) => ({ ...p, farmingSeason: v }))}
              placeholder="Select Farm Season"
              icon="sunny-outline"
              title="Farming Season"
            />
          </View>
          <EditField label="Farming Experience" value={str(form.farmingExperience)} onChange={setInt('farmingExperience')} keyboardType="number-pad" hint="Years" />
        </CardSection>

        <SectionHeader title="Soil Information" />
        <CardSection>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>Soil Type</Text>
            <EnhancedCustomSelect
              options={SOIL_TYPES}
              selectedValue={form.soilType ?? ''}
              onValueChange={(v: string) => setForm((p) => ({ ...p, soilType: v }))}
              placeholder="Select Soil Type"
              icon="layers-outline"
              title="Soil Type"
            />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>Soil Fertility</Text>
            <EnhancedCustomSelect
              options={SOIL_FERTILITY_LEVELS}
              selectedValue={form.soilFertility ?? ''}
              onValueChange={(v: string) => setForm((p) => ({ ...p, soilFertility: v }))}
              placeholder="Select Soil Fertility"
              icon="leaf-outline"
              title="Soil Fertility"
            />
          </View>
          <EditField label="Soil pH" value={str(form.soilPH)} onChange={setNum('soilPH')} keyboardType="decimal-pad" hint="0 – 14" />
        </CardSection>

        <SectionHeader title="Yield Information" />
        <CardSection>
          <EditField label="Year"          value={str(form.year)}        onChange={setNum('year')}     keyboardType="number-pad" />
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>Yield Season</Text>
            <EnhancedCustomSelect
              options={YIELD_SEASONS}
              selectedValue={form.yieldSeason ?? ''}
              onValueChange={(v: string) => setForm((p) => ({ ...p, yieldSeason: v }))}
              placeholder="Select Yield Season"
              icon="calendar-outline"
              title="Yield Season"
            />
          </View>
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
