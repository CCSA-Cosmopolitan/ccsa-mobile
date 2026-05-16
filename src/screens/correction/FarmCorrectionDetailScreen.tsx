import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCorrectionStore } from '../../store/correctionStore';

const PRIMARY = '#013358';
const BG = '#f1f5f9';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{
        fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1,
        textTransform: 'uppercase', marginBottom: 8, marginLeft: 4,
      }}>
        {title}
      </Text>
      <View style={{
        backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
      }}>
        {children}
      </View>
    </View>
  );
}

function Field({ label, value, last = false }: { label: string; value: string | number | null | undefined; last?: boolean }) {
  const display = value !== null && value !== undefined && value !== '' ? String(value) : '—';
  return (
    <View style={{
      paddingHorizontal: 16, paddingVertical: 13,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: '#f1f5f9',
    }}>
      <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{label}</Text>
      <Text style={{
        fontSize: 14, color: display === '—' ? '#cbd5e1' : '#0f172a',
        fontWeight: display === '—' ? '400' : '500',
      }}>
        {display}
      </Text>
    </View>
  );
}

export default function FarmCorrectionDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { farmId, farmerId } = route.params;
  const { selectedFarm, loadingFarms, farmError, selectFarm, clearSelectedFarm } = useCorrectionStore();

  useEffect(() => {
    selectFarm(farmId);
    return () => clearSelectedFarm();
  }, [farmId]);

  if (loadingFarms) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={{ color: '#64748b', marginTop: 12 }}>Loading farm record…</Text>
      </View>
    );
  }

  if (farmError || !selectedFarm) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: BG }}>
        <Ionicons name="warning-outline" size={48} color="#f87171" />
        <Text style={{ color: '#ef4444', fontSize: 15, marginTop: 12, textAlign: 'center' }}>
          {farmError ?? 'Farm not found'}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: PRIMARY, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const farm = selectedFarm;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={{ backgroundColor: PRIMARY, paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 }}>Farm Record</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 52, height: 52, borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
            marginRight: 14,
          }}>
            <Ionicons name="leaf" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {farm.primaryCrop ?? 'Unspecified Crop'}
            </Text>
            <Text style={{ color: '#93c5fd', fontSize: 12, marginTop: 2 }}>
              {farm.farmState ?? '—'}{farm.farmLocalGovernment ? ` · ${farm.farmLocalGovernment}` : ''}
            </Text>
            {farm.farmSize != null && (
              <Text style={{ color: '#bfdbfe', fontSize: 12, marginTop: 1 }}>
                {farm.farmSize} ha
              </Text>
            )}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Section title="Crop Information">
          <Field label="Primary Crop"       value={farm.primaryCrop} />
          <Field label="Secondary Crops"    value={farm.secondaryCrop?.join(', ')} />
          <Field label="Crop Variety"       value={farm.cropVariety} />
          <Field label="Produce Category"   value={farm.produceCategory} last />
        </Section>

        <Section title="Farm Location">
          <Field label="State"              value={farm.farmState} />
          <Field label="Local Government"   value={farm.farmLocalGovernment} />
          <Field label="Ward"               value={farm.farmWard} />
          <Field label="Polling Unit"       value={farm.farmPollingUnit} />
          <Field label="Landforms"          value={farm.landforms} />
          <Field label="Latitude"           value={farm.farmLatitude} />
          <Field label="Longitude"          value={farm.farmLongitude} last />
        </Section>

        <Section title="Farm Details">
          <Field label="Farm Size (ha)"     value={farm.farmSize} />
          <Field label="Farm Area"          value={farm.farmArea} />
          <Field label="Farm Elevation"     value={farm.farmElevation} />
          <Field label="Farm Ownership"     value={farm.farmOwnership} />
          <Field label="Farming Season"     value={farm.farmingSeason} />
          <Field label="Farming Experience" value={farm.farmingExperience != null ? `${farm.farmingExperience} years` : null} last />
        </Section>

        <Section title="Soil Information">
          <Field label="Soil Type"          value={farm.soilType} />
          <Field label="Soil pH"            value={farm.soilPH} />
          <Field label="Soil Fertility"     value={farm.soilFertility} last />
        </Section>

        <Section title="Yield Information">
          <Field label="Year"               value={farm.year} />
          <Field label="Yield Season"       value={farm.yieldSeason} />
          <Field label="Crop"               value={farm.crop} />
          <Field label="Quantity (kg)"      value={farm.quantity} last />
        </Section>
      </ScrollView>

      {/* Edit FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate('FarmEdit', { farmId: farm.id })}
        style={{
          position: 'absolute', bottom: 32, right: 24, backgroundColor: PRIMARY,
          borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14,
          flexDirection: 'row', alignItems: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="create-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Edit Farm</Text>
      </TouchableOpacity>
    </View>
  );
}
