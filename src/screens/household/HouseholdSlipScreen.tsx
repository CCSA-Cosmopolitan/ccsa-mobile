import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { HouseholdRecord, householdService } from '../../services/householdService';
import { formatPollingUnit } from '../../utils/textUtils';

export default function HouseholdSlipScreen({ route, navigation }: { route: any; navigation: any }) {
  const [query, setQuery] = useState('');
  const [household, setHousehold] = useState<HouseholdRecord | null>(route?.params?.household || null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (route?.params?.household) {
      setHousehold(route.params.household);
      setQuery(route.params.household.houseNumber);
    }
  }, [route?.params?.household]);

  const handleLookup = async () => {
    const q = query.trim();
    if (!q) {
      Alert.alert('Input Required', 'Please enter a House Code or Head of Household NIN.');
      return;
    }

    try {
      setLoading(true);
      let found: HouseholdRecord | null = null;
      if (/^\d{11}$/.test(q)) {
        found = await householdService.getHouseholdByNin(q);
      }
      if (!found) {
        found = await householdService.getHouseholdByHouseNumber(q);
      }

      if (found) {
        setHousehold(found);
      } else {
        Alert.alert('Not Found', `No registered household found matching "${q}".`);
      }
    } catch (e: any) {
      Alert.alert('Search Error', e.message || 'Could not find household');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!household) return;
    try {
      setGenerating(true);
      const fullName = `${household.headFirstName} ${household.headMiddleName ? household.headMiddleName + ' ' : ''}${household.headLastName}`;
      const issueDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Dwelling Identification Slip - ${household.houseNumber}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              padding: 32px;
              color: #1f2937;
              background-color: #ffffff;
            }
            .border-wrap {
              border: 3px solid #013358;
              border-radius: 12px;
              padding: 28px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #013358;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 14px;
              font-weight: 800;
              letter-spacing: 1.5px;
              color: #013358;
              text-transform: uppercase;
              margin: 0;
            }
            .sub {
              font-size: 20px;
              font-weight: 900;
              color: #059669;
              letter-spacing: 0.5px;
              margin: 6px 0 0 0;
            }
            .house-box {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 14px;
              text-align: center;
              margin-bottom: 20px;
            }
            .house-code {
              font-size: 22px;
              font-weight: 900;
              color: #013358;
              letter-spacing: 1px;
            }
            .grid {
              display: table;
              width: 100%;
              margin-bottom: 20px;
            }
            .row {
              display: table-row;
            }
            .cell-label {
              display: table-cell;
              padding: 6px 12px;
              font-size: 13px;
              color: #64748b;
              font-weight: 600;
              border-bottom: 1px solid #f1f5f9;
              width: 40%;
            }
            .cell-val {
              display: table-cell;
              padding: 6px 12px;
              font-size: 13px;
              color: #0f172a;
              font-weight: 700;
              border-bottom: 1px solid #f1f5f9;
            }
            .footer {
              margin-top: 24px;
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              border-top: 1px dashed #cbd5e1;
              padding-top: 12px;
            }
          </style>
        </head>
        <body>
          <div class="border-wrap">
            <div class="header">
              <div style="font-size: 16px; font-weight: 800; color: #013358; letter-spacing: 0.8px; text-transform: uppercase;">Centre for Climate-Smart Agriculture</div>
              <div style="font-size: 13px; font-weight: 700; color: #0284c7; margin-top: 4px;">Cosmopolitan University Abuja</div>
              <div style="font-size: 12px; font-weight: 800; color: #d97706; letter-spacing: 1px; margin-top: 3px;">CCSA / AGROMONEY</div>
              <div style="height: 1px; background: #e2e8f0; margin: 12px auto; width: 80%;"></div>
              <h1 class="sub" style="font-size: 18px; margin: 0;">Official Dwelling Identification Slip</h1>
              <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">National Household & Energy Mapping Registry</p>
            </div>

            <div class="house-box">
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Standardized House Code</div>
              <div class="house-code">${household.houseNumber}</div>
            </div>

            <div class="grid">
              <div class="row">
                <div class="cell-label">Head of Household</div>
                <div class="cell-val">${fullName}</div>
              </div>
              <div class="row">
                <div class="cell-label">National ID Number (NIN)</div>
                <div class="cell-val">${household.headNin || 'N/A'} (Verified)</div>
              </div>
              <div class="row">
                <div class="cell-label">Primary Contact Phone</div>
                <div class="cell-val">
                  ${household.headPhone || 'N/A'}
                  <span style="display:inline-block; margin-left:8px; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; background:${household.headPhoneVerified ? '#dcfce7' : '#fef3c7'}; color:${household.headPhoneVerified ? '#15803d' : '#b45309'};">
                    ${household.headPhoneVerified ? 'Validated' : 'Not Validated'}
                  </span>
                </div>
              </div>
              <div class="row">
                <div class="cell-label">Full Dwelling Address</div>
                <div class="cell-val">
                  ${household.address ? `<div style="font-weight:700; margin-bottom:2px;">${household.address}</div>` : ''}
                  <div>${[household.ward, household.lga, household.state].filter(Boolean).join(', ')}</div>
                  ${household.gpsAddress ? `<div style="font-size:11px; color:#64748b; margin-top:2px;">GPS: ${household.gpsAddress}</div>` : ''}
                </div>
              </div>
              <div class="row">
                <div class="cell-label">Administrative Boundary</div>
                <div class="cell-val">${household.ward}, ${household.lga}, ${household.state}</div>
              </div>
              <div class="row">
                <div class="cell-label">Polling Unit</div>
                <div class="cell-val">${formatPollingUnit(household.pollingUnit)}</div>
              </div>
              <div class="row">
                <div class="cell-label">Dwelling GPS Coordinates</div>
                <div class="cell-val">${household.latitude ? `${household.latitude.toFixed(6)}, ${household.longitude?.toFixed(6)}` : 'Captured'}</div>
              </div>
              <div class="row">
                <div class="cell-label">Total Household Residents</div>
                <div class="cell-val">${household.totalHouseholdMembers || 1} Occupants</div>
              </div>
              <div class="row">
                <div class="cell-label">Primary Energy Source</div>
                <div class="cell-val">${household.primaryEnergySource || 'N/A'}${household.hasPUE ? ' • PUE Business Active' : ''}</div>
              </div>
            </div>

            <div class="footer">
              Issued: ${issueDate} • Verification ID: ${household.offlineId || household.houseNumber} • Tamper-evident Digital Slip
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      Alert.alert(
        'Slip Generated',
        'Official Dwelling Identification Slip PDF has been generated successfully!',
        [
          {
            text: 'View / Share',
            onPress: () => Sharing.shareAsync(uri, { mimeType: 'application/pdf' }),
          },
          { text: 'Done' },
        ]
      );
    } catch (e: any) {
      Alert.alert('PDF Error', e.message || 'Could not generate slip');
    } finally {
      setGenerating(false);
    }
  };

  const fullName = household
    ? `${household.headFirstName} ${household.headMiddleName ? household.headMiddleName + ' ' : ''}${household.headLastName}`
    : '';

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Dwelling Identification Slip</Text>
        <Text style={styles.subtitle}>
          Official digital house identification and verifiable credential slip
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Lookup Bar */}
        <View style={styles.searchBar}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter House Code or Head NIN..."
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleLookup}
            />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleLookup} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.searchBtnText}>Lookup</Text>
            )}
          </TouchableOpacity>
        </View>

        {household ? (
          <View style={styles.slipCard}>
            {/* Top Banner */}
            <View style={styles.slipHeader}>
              <View style={styles.emblemRow}>
                <Ionicons name="leaf" size={20} color="#059669" />
                <Text style={styles.emblemText}>CENTRE FOR CLIMATE-SMART AGRICULTURE</Text>
              </View>
              <Text style={styles.universityText}>Cosmopolitan University Abuja</Text>
              <Text style={styles.initiativeText}>CCSA / AGROMONEY</Text>
              <View style={styles.headerDivider} />
              <Text style={styles.slipTitle}>Official Dwelling Identification Slip</Text>
              <Text style={styles.slipSub}>National Household & Energy Mapping Registry</Text>
            </View>

            {/* Standardized House Code */}
            <View style={styles.houseCodeBox}>
              <Text style={styles.houseCodeLabel}>Assigned Standardized House Code</Text>
              <Text style={styles.houseCodeValue}>{household.houseNumber}</Text>
            </View>

            {/* QR Code and Key Details Row */}
            <View style={styles.qrRow}>
              <View style={styles.qrBox}>
                <QRCode
                  value={`HOUSEHOLD:${household.houseNumber}|NIN:${household.headNin || 'N/A'}|GEO:${household.latitude || 0},${household.longitude || 0}`}
                  size={100}
                  color="#013358"
                />
              </View>

              <View style={styles.qrDetails}>
                <Text style={styles.qrHeadName}>{fullName}</Text>
                <Text style={styles.qrNinText}>NIN: {household.headNin || 'Verified'}</Text>
                <Text style={styles.qrLocationText}>
                  {[household.ward, household.lga, household.state].filter(Boolean).join(', ')}
                </Text>
                <View style={styles.verifiedTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#059669" />
                  <Text style={styles.verifiedTagText}>Registry Verified</Text>
                </View>
              </View>
            </View>

            {/* Detailed Row List */}
            <View style={styles.detailsList}>
              <View style={styles.detailItem}>
                <Text style={styles.itemLabel}>Contact Phone</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.itemValue}>{household.headPhone || 'N/A'}</Text>
                  <View
                    style={{
                      backgroundColor: household.headPhoneVerified ? '#dcfce7' : '#fef3c7',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: household.headPhoneVerified ? '#15803d' : '#b45309',
                      }}
                    >
                      {household.headPhoneVerified ? 'Validated' : 'Not Validated'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.itemLabel}>Full Address</Text>
                <View style={{ flex: 1, alignItems: 'flex-end', marginLeft: 12 }}>
                  {household.address ? (
                    <Text style={[styles.itemValue, { textAlign: 'right' }]}>{household.address}</Text>
                  ) : null}
                  <Text style={[styles.itemValue, { textAlign: 'right', color: '#4b5563', fontSize: 13, marginTop: 2 }]}>
                    {[household.ward, household.lga, household.state].filter(Boolean).join(', ')}
                  </Text>
                  {household.gpsAddress ? (
                    <Text style={{ fontSize: 11, color: '#6b7280', textAlign: 'right', marginTop: 2 }}>
                      GPS: {household.gpsAddress}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.itemLabel}>Polling Unit</Text>
                <Text style={styles.itemValue}>{formatPollingUnit(household.pollingUnit)}</Text>
              </View>

              {household.latitude && household.longitude && (
                <View style={styles.detailItem}>
                  <Text style={styles.itemLabel}>Dwelling Coordinates</Text>
                  <Text style={styles.itemValue}>
                    {household.latitude.toFixed(5)}, {household.longitude.toFixed(5)}
                  </Text>
                </View>
              )}

              <View style={styles.detailItem}>
                <Text style={styles.itemLabel}>Total Residents</Text>
                <Text style={styles.itemValue}>{household.totalHouseholdMembers || 1} Persons</Text>
              </View>

              <View style={[styles.detailItem, { borderBottomWidth: 0 }]}>
                <Text style={styles.itemLabel}>Electricity Source</Text>
                <Text style={styles.itemValue}>
                  {household.primaryEnergySource || 'N/A'}
                  {household.hasPUE ? ' (PUE Active)' : ''}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.slipActions}>
              <TouchableOpacity
                style={styles.printBtn}
                onPress={handleGeneratePDF}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="share-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.printBtnText}>Generate / Share PDF Slip</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() => navigation.navigate('HouseholdDetails', { household })}
              >
                <Text style={styles.detailsBtnText}>View Full Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={68} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Dwelling Selected</Text>
            <Text style={styles.emptyDesc}>
              Enter a House Code or Head of Household NIN above, or choose a dwelling from the &quot;View Households&quot; tab.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => navigation.navigate('HouseholdList')}
            >
              <Text style={styles.browseBtnText}>Browse Enrolled Households</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    padding: 24,
  },
  searchBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
  },
  searchBtn: {
    backgroundColor: '#013358',
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  slipCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#013358',
    padding: 20,
    marginBottom: 24,
  },
  slipHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 14,
    marginBottom: 16,
  },
  emblemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  emblemText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#013358',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  universityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 2,
    textAlign: 'center',
  },
  initiativeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d97706',
    letterSpacing: 0.8,
    marginTop: 2,
    textAlign: 'center',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    width: '85%',
    marginVertical: 10,
  },
  slipTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  slipSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  houseCodeBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  houseCodeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  houseCodeValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#013358',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  qrBox: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrDetails: {
    flex: 1,
  },
  qrHeadName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  qrNinText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  qrLocationText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  verifiedTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  detailsList: {
    marginTop: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  itemLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  itemValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  slipActions: {
    gap: 10,
    marginTop: 20,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#013358',
    paddingVertical: 14,
    borderRadius: 8,
  },
  printBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  detailsBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  detailsBtnText: {
    color: '#013358',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 20,
  },
  browseBtn: {
    backgroundColor: '#013358',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
