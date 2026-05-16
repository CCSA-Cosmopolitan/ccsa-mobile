import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCorrectionStore } from '../../store/correctionStore';

const PRIMARY = '#013358';

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginLeft: 4 }}>
        <Text style={{
          fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1,
          textTransform: 'uppercase', flex: 1,
        }}>
          {title}
        </Text>
        {action}
      </View>
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

function Field({ label, value, last = false }: { label: string; value: string | null | undefined; last?: boolean }) {
  return (
    <View style={{
      paddingHorizontal: 16, paddingVertical: 13,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: '#f1f5f9',
    }}>
      <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{label}</Text>
      <Text style={{
        fontSize: 14, color: value ? '#0f172a' : '#cbd5e1',
        fontWeight: value ? '500' : '400',
      }}>
        {value || '—'}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colour =
    status === 'Verified'  ? { bg: '#dcfce7', text: '#166534' } :
    status === 'Rejected'  ? { bg: '#fee2e2', text: '#991b1b' } :
                             { bg: '#dbeafe', text: '#1e40af' };
  return (
    <View style={{ backgroundColor: colour.bg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ color: colour.text, fontSize: 12, fontWeight: '600' }}>{status}</Text>
    </View>
  );
}

export default function FarmerCorrectionDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { farmerId } = route.params as { farmerId: string };
  const {
    selectedFarmer, loadingDetail, detailError, selectFarmer, clearSelected,
    farms, loadingFarms, loadFarms,
  } = useCorrectionStore();

  useEffect(() => {
    selectFarmer(farmerId);
    loadFarms(farmerId);
    return () => clearSelected();
  }, [farmerId]);

  const farmer = selectedFarmer;
  const name = farmer
    ? [farmer.firstName, farmer.middleName, farmer.lastName].filter(Boolean).join(' ')
    : '';

  if (loadingDetail) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={{ color: '#64748b', marginTop: 12 }}>Loading farmer record…</Text>
      </View>
    );
  }

  if (detailError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#f1f5f9' }}>
        <Ionicons name="warning-outline" size={48} color="#f87171" />
        <Text style={{ color: '#ef4444', fontSize: 15, marginTop: 12, textAlign: 'center' }}>{detailError}</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: PRIMARY, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!farmer) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={{ backgroundColor: PRIMARY, paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 }} numberOfLines={1}>
            {name}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
            marginRight: 14,
          }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 20 }}>
              {farmer.firstName?.[0] ?? '?'}
            </Text>
          </View>
          <View>
            <Text style={{ color: '#bfdbfe', fontSize: 12, marginBottom: 4 }}>NIN: {farmer.nin}</Text>
            <StatusBadge status={farmer.status} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Section title="Personal Information">
          <Field label="First Name"        value={farmer.firstName} />
          <Field label="Middle Name"       value={farmer.middleName} />
          <Field label="Last Name"         value={farmer.lastName} />
          <Field label="Date of Birth"     value={farmer.dateOfBirth?.split('T')[0]} />
          <Field label="Gender"            value={farmer.gender} />
          <Field label="Marital Status"    value={farmer.maritalStatus} />
          <Field label="Employment Status" value={farmer.employmentStatus} last />
        </Section>

        <Section title="Contact Information">
          <Field label="Phone"    value={farmer.phone} />
          <Field label="WhatsApp" value={farmer.whatsAppNumber} />
          <Field label="Email"    value={farmer.email} />
          <Field label="Address"  value={farmer.address} last />
        </Section>

        <Section title="Location">
          <Field label="State"        value={farmer.state} />
          <Field label="LGA"          value={farmer.lga} />
          <Field label="Ward"         value={farmer.ward} />
          <Field label="Polling Unit" value={farmer.pollingUnit} last />
        </Section>

        <Section title="Financial Information">
          <Field label="Bank Name"      value={farmer.bankName} />
          <Field label="Account Number" value={farmer.accountNumber} />
          <Field label="Account Name"   value={farmer.accountName} />
          <Field label="BVN"            value={farmer.bvn} last />
        </Section>

        {/* Referees with Edit action */}
        <Section
          title={`Referees (${farmer.referees?.length ?? 0})`}
          action={
            <TouchableOpacity
              onPress={() => navigation.navigate('RefereeEdit', { farmerId: farmer.id })}
              style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff',
                borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
              }}
            >
              <Ionicons name="create-outline" size={14} color={PRIMARY} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: PRIMARY, fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
          }
        >
          {(farmer.referees?.length ?? 0) === 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>No referees on record</Text>
            </View>
          ) : (
            farmer.referees.map((ref: any, i: number) => (
              <Field
                key={ref.id}
                label={`${ref.firstName} ${ref.lastName} · ${ref.relationship}`}
                value={ref.phone}
                last={i === farmer.referees.length - 1}
              />
            ))
          )}
        </Section>

        {/* Farms */}
        <Section title={`Farms (${farms.length})`}>
          {loadingFarms ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={PRIMARY} />
            </View>
          ) : farms.length === 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>No farms registered</Text>
            </View>
          ) : (
            farms.map((farm: any, i: number) => (
              <TouchableOpacity
                key={farm.id}
                onPress={() => navigation.navigate('FarmCorrectionDetail', { farmId: farm.id, farmerId: farmer.id })}
                activeOpacity={0.75}
                style={{
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderBottomWidth: i < farms.length - 1 ? 1 : 0,
                  borderBottomColor: '#f1f5f9',
                  flexDirection: 'row', alignItems: 'center',
                }}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="leaf-outline" size={18} color="#065f46" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 14 }}>
                    {farm.primaryCrop ?? 'Unspecified Crop'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                    {farm.farmState ?? '—'}{farm.farmSize != null ? ` · ${farm.farmSize} ha` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </TouchableOpacity>
            ))
          )}
        </Section>
      </ScrollView>

      {/* Edit Farmer FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CorrectionEdit', { farmerId: farmer.id })}
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
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Edit Farmer</Text>
      </TouchableOpacity>
    </View>
  );
}
