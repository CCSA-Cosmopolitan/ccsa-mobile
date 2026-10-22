import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HouseholdRecord, householdService } from '../../services/householdService';

interface InfoRowProps {
  label: string;
  value?: string | number | null;
  highlight?: boolean;
}

function InfoRow({ label, value, highlight }: InfoRowProps) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>
        {String(value)}
      </Text>
    </View>
  );
}

export default function HouseholdDetailsScreen({ route, navigation }: { route: any; navigation: any }) {
  const household: HouseholdRecord = route.params?.household;
  const [syncing, setSyncing] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<HouseholdRecord>(household);

  if (!currentRecord) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
        <Text style={styles.notFoundText}>Household record not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Return</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isSynced = currentRecord.status === 'synced';
  const fullName = [
    currentRecord.headFirstName,
    currentRecord.headMiddleName,
    currentRecord.headLastName,
  ]
    .filter(Boolean)
    .join(' ');

  const calcAge = (dobStr?: string | null): number | null => {
    if (!dobStr) return null;
    const d = new Date(dobStr);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age >= 0 && age < 125 ? age : null;
  };

  const age = calcAge(currentRecord.headDateOfBirth);

  const handleOpenMap = () => {
    if (currentRecord.latitude && currentRecord.longitude) {
      const lat = currentRecord.latitude;
      const lng = currentRecord.longitude;
      const label = encodeURIComponent(`Dwelling ${currentRecord.houseNumber}`);
      const url = Platform.select({
        ios: `maps:0,0?q=${label}@${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}(${label})`,
      });
      if (url) {
        Linking.openURL(url).catch(() => {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
        });
      }
    } else {
      Alert.alert('No Coordinates', 'GPS coordinates were not recorded for this dwelling.');
    }
  };

  const handleSyncThis = async () => {
    try {
      setSyncing(true);
      const res = await householdService.syncHouseholds();
      if (res.synced > 0) {
        setCurrentRecord({ ...currentRecord, status: 'synced' });
        Alert.alert('Synced', 'Household data uploaded to FIMS cloud registry.');
      } else {
        Alert.alert('Sync Result', 'Record is already synced or network is offline.');
      }
    } catch (e: any) {
      Alert.alert('Sync Error', e.message || 'Failed to sync');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── Top Header Card ── */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          {currentRecord.headPhotoUrl ? (
            <Image source={{ uri: currentRecord.headPhotoUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>
                {(currentRecord.headFirstName?.[0] || 'H') + (currentRecord.headLastName?.[0] || 'H')}
              </Text>
            </View>
          )}

          <View style={styles.nameSection}>
            <Text style={styles.houseNumberText}>{currentRecord.houseNumber}</Text>
            <Text style={styles.fullName}>{fullName}</Text>
            <Text style={styles.subText}>
              {currentRecord.headGender || 'MALE'}
              {age !== null ? ` • ${age} years old` : ''}
              {currentRecord.headNin ? ` • NIN: ${currentRecord.headNin}` : ''}
            </Text>
          </View>
        </View>

        {/* Status & Verified Pills */}
        <View style={styles.pillsRow}>
          <View style={[styles.badge, isSynced ? styles.badgeSynced : styles.badgePending]}>
            <Ionicons
              name={isSynced ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={isSynced ? '#059669' : '#d97706'}
            />
            <Text style={[styles.badgeText, isSynced ? styles.badgeTextSynced : styles.badgeTextPending]}>
              {isSynced ? 'Synced to Cloud' : 'Offline Pending'}
            </Text>
          </View>

          {currentRecord.headNinVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#013358" />
              <Text style={styles.verifiedBadgeText}>NIMC Verified</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => navigation.navigate('HouseholdSlip', { household: currentRecord })}
          >
            <Ionicons name="document-text-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnPrimaryText}>Dwelling Slip</Text>
          </TouchableOpacity>

          {currentRecord.latitude && currentRecord.longitude ? (
            <TouchableOpacity style={styles.actionBtnSecondary} onPress={handleOpenMap}>
              <Ionicons name="navigate-outline" size={18} color="#013358" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnSecondaryText}>View GPS</Text>
            </TouchableOpacity>
          ) : !isSynced ? (
            <TouchableOpacity style={styles.actionBtnSecondary} onPress={handleSyncThis} disabled={syncing}>
              <Ionicons name="cloud-upload-outline" size={18} color="#013358" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnSecondaryText}>{syncing ? 'Syncing...' : 'Sync Now'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.content}>
        {/* ── Section 1: Dwelling Front Photo ── */}
        {currentRecord.houseFrontPhotoUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dwelling Exterior Front</Text>
            <Image source={{ uri: currentRecord.houseFrontPhotoUrl }} style={styles.frontPhoto} />
          </View>
        )}

        {/* ── Section 2: Location & Administrative Boundary ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dwelling Location & Boundary</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Assigned House Code" value={currentRecord.houseNumber} highlight />
            <InfoRow label="State" value={currentRecord.state} />
            <InfoRow label="Local Government (LGA)" value={currentRecord.lga} />
            <InfoRow label="Ward" value={currentRecord.ward} />
            <InfoRow label="Polling Unit (PU)" value={currentRecord.pollingUnit} />
            <InfoRow label="Street / Landmark" value={currentRecord.address} />
            {currentRecord.latitude && currentRecord.longitude && (
              <InfoRow
                label="Dwelling GPS"
                value={`${currentRecord.latitude.toFixed(6)}, ${currentRecord.longitude.toFixed(6)} (±${Math.round(currentRecord.accuracy || 0)}m)`}
              />
            )}
            <InfoRow label="Reverse Geocoded Address" value={currentRecord.gpsAddress} />
            <InfoRow
              label="Capture Timestamp"
              value={
                currentRecord.locationCapturedAt
                  ? new Date(currentRecord.locationCapturedAt).toLocaleString('en-GB')
                  : currentRecord.timestamp
                  ? new Date(currentRecord.timestamp).toLocaleString('en-GB')
                  : null
              }
            />
          </View>
        </View>

        {/* ── Section 3: Head of Household Personal Profile ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Head of Household Profile</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Full Name" value={fullName} />
            <InfoRow label="National ID (NIN)" value={currentRecord.headNin} highlight />
            <InfoRow
              label="Date of Birth"
              value={
                currentRecord.headDateOfBirth
                  ? `${currentRecord.headDateOfBirth}${age !== null ? ` (${age} yrs)` : ''}`
                  : null
              }
            />
            <InfoRow label="Gender" value={currentRecord.headGender} />
            <InfoRow label="Marital Status" value={currentRecord.headMaritalStatus} />
            <InfoRow label="Employment Status" value={currentRecord.headEmploymentStatus} />
            <InfoRow label="Education Level" value={currentRecord.headEducationLevel} />
            <InfoRow
              label="Phone Number"
              value={currentRecord.headPhone ? `${currentRecord.headPhone} (${currentRecord.headPhoneVerified ? 'Validated' : 'Not Validated'})` : null}
            />
            <InfoRow label="Email Address" value={currentRecord.headEmail} />
            <InfoRow
              label="Origin"
              value={[currentRecord.headStateOfOrigin, currentRecord.headLgaOfOrigin].filter(Boolean).join(' / ')}
            />
            <InfoRow label="Registered Residence" value={currentRecord.headResidenceAddress} />
          </View>
        </View>

        {/* ── Section 4: Family Members & Occupants ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Members & Occupants</Text>
          <View style={styles.infoCard}>
            <InfoRow
              label="Total Household Occupants"
              value={`${currentRecord.totalHouseholdMembers || 1} people`}
              highlight
            />
            <InfoRow label="Spouses / Wives" value={currentRecord.wivesCount || 0} />
            <InfoRow label="Biological Children" value={currentRecord.childrenCount || 0} />
            <InfoRow label="Other Dependents / Relatives" value={currentRecord.otherDependentsCount || 0} />
            <InfoRow label="Vulnerability / Welfare Notes" value={currentRecord.dependentsNotes} />
          </View>
        </View>

        {/* ── Section 5: Connectivity & Energy Source ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connectivity & Productive Energy</Text>
          <View style={styles.infoCard}>
            <InfoRow
              label="Available Telecom Networks"
              value={(currentRecord.telcoProviders || []).join(', ') || 'None recorded'}
            />
            <InfoRow label="Dominant Data Reception" value={currentRecord.networkType || 'N/A'} />
            <InfoRow label="Primary Electricity Source" value={currentRecord.primaryEnergySource} highlight />
            <InfoRow
              label="Productive Use of Energy (PUE)"
              value={currentRecord.hasPUE ? `Yes • ${currentRecord.pueType || 'Commercial'}` : 'No'}
            />
            {currentRecord.hasPUE && (
              <>
                <InfoRow
                  label="Daily Customer Footfall"
                  value={currentRecord.commercialCustomersCount ? `${currentRecord.commercialCustomersCount} daily` : null}
                />
                <InfoRow
                  label="Machinery / Appliances"
                  value={(currentRecord.pueEquipment || []).join(', ')}
                />
              </>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#013358',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#013358',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  nameSection: {
    flex: 1,
  },
  houseNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#013358',
    letterSpacing: 0.5,
  },
  fullName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 2,
  },
  subText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  badgeSynced: {
    backgroundColor: '#d1fae5',
  },
  badgePending: {
    backgroundColor: '#fef3c7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextSynced: {
    color: '#065f46',
  },
  badgeTextPending: {
    color: '#92400e',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369a1',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#013358',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionBtnSecondaryText: {
    color: '#013358',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 24,
    gap: 20,
  },
  section: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 10,
  },
  frontPhoto: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f1f5f9',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1.2,
    textAlign: 'right',
  },
  infoValueHighlight: {
    color: '#013358',
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  notFoundText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#013358',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
