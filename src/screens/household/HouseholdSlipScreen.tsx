import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { HouseholdRecord, householdService } from '../../services/householdService';
import { formatPollingUnit } from '../../utils/textUtils';
import API_CONFIG from '../../config/api';
import { CERTIFICATE_LOGO_BASE64 } from '../../utils/logoBase64';

export default function HouseholdSlipScreen({ route, navigation }: { route: any; navigation: any }) {
  const [query, setQuery] = useState('');
  const [household, setHousehold] = useState<HouseholdRecord | null>(route?.params?.household || null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const qrSvgRef = useRef<any>(null);

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

  const getPublicVerificationUrl = (houseNumber: string) => {
    const rawBase = API_CONFIG.BASE_URL || 'https://fims.cosmopolitan.edu.ng';
    const cleanBase = rawBase.replace(/\/api.*$/, '').replace(/\/+$/, '');
    return `${cleanBase}/verify-dwelling/${encodeURIComponent(houseNumber)}`;
  };

  const handleGeneratePDF = async () => {
    if (!household) return;
    try {
      setGenerating(true);
      const fullName = `${household.headFirstName} ${household.headMiddleName ? household.headMiddleName + ' ' : ''}${household.headLastName}`.trim();
      const issueDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const verifyUrl = getPublicVerificationUrl(household.houseNumber);

      // Attempt to get QR code base64 from ref, fallback to qrserver
      let qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyUrl)}&color=081B33`;
      if (qrSvgRef.current && typeof qrSvgRef.current.toDataURL === 'function') {
        try {
          const b64 = await new Promise<string>((resolve) => {
            qrSvgRef.current.toDataURL((data: string) => resolve(data));
          });
          if (b64) {
            qrImgSrc = `data:image/png;base64,${b64}`;
          }
        } catch (e) {
          console.warn('Could not extract QR base64, using fallback:', e);
        }
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Dwelling Identification Document - ${household.houseNumber}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              padding: 20px;
              color: #0f172a;
              background-color: #ffffff;
              margin: 0;
            }
            .outer-border {
              border: 3px solid #081B33;
              border-radius: 12px;
              padding: 16px;
            }
            .inner-border {
              border: 1px solid #C5A059;
              border-radius: 8px;
              padding: 18px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #081B33;
              padding-bottom: 14px;
              margin-bottom: 16px;
            }
            .logo {
              width: 72px;
              height: 72px;
              object-fit: contain;
              margin-bottom: 6px;
            }
            .org-name {
              font-size: 15px;
              font-weight: 900;
              color: #081B33;
              letter-spacing: 0.8px;
              text-transform: uppercase;
              margin: 0;
            }
            .org-uni {
              font-size: 12px;
              font-weight: 700;
              color: #0284c7;
              margin: 2px 0 0 0;
            }
            .org-brand {
              font-size: 11px;
              font-weight: 800;
              color: #b45309;
              letter-spacing: 0.8px;
              text-transform: uppercase;
              margin: 2px 0 0 0;
            }
            .gold-divider {
              height: 2px;
              background: linear-gradient(90deg, transparent, #C5A059, #081B33, #C5A059, transparent);
              margin: 8px auto;
              width: 80%;
            }
            .doc-title {
              font-size: 16px;
              font-weight: 900;
              color: #081B33;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              margin: 0;
            }
            .doc-sub {
              font-size: 10px;
              color: #64748b;
              font-weight: 600;
              margin: 2px 0 0 0;
            }
            .house-box {
              background: #f8fafc;
              border: 2px solid #081B33;
              border-radius: 8px;
              padding: 10px 14px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 14px;
            }
            .house-code {
              font-family: 'Courier New', Courier, monospace;
              font-size: 19px;
              font-weight: 900;
              color: #081B33;
              letter-spacing: 1px;
            }
            .house-label {
              font-size: 9.5px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.8px;
            }
            .status-badge {
              font-size: 9.5px;
              font-weight: 800;
              padding: 3px 8px;
              border-radius: 4px;
              background: #e0f2fe;
              color: #0369a1;
              text-transform: uppercase;
            }
            .qr-banner {
              display: flex;
              gap: 14px;
              align-items: center;
              background: #fdfbf7;
              border: 1px solid #e2d9c8;
              border-radius: 8px;
              padding: 10px 14px;
              margin-bottom: 14px;
            }
            .qr-wrap {
              width: 88px;
              height: 88px;
              background: #ffffff;
              padding: 3px;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              flex-shrink: 0;
            }
            .qr-wrap img {
              width: 100%;
              height: 100%;
              display: block;
            }
            .qr-info-title {
              font-size: 11px;
              font-weight: 800;
              color: #081B33;
              text-transform: uppercase;
              margin: 0 0 2px 0;
            }
            .qr-info-desc {
              font-size: 9.5px;
              color: #475569;
              line-height: 1.35;
              margin: 0 0 3px 0;
            }
            .qr-url {
              font-family: monospace;
              font-size: 9px;
              color: #0369a1;
              font-weight: 700;
              word-break: break-all;
            }
            .table-sec {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
            }
            .table-sec th {
              background: #081B33;
              color: #ffffff;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 6px 10px;
              text-align: left;
            }
            .table-sec td {
              padding: 5px 10px;
              font-size: 10.5px;
              border: 1px solid #e2e8f0;
              vertical-align: top;
            }
            .cell-label {
              width: 32%;
              background: #f8fafc;
              font-weight: 700;
              color: #475569;
            }
            .cell-val {
              font-weight: 600;
              color: #0f172a;
            }
            .tag-valid {
              display: inline-block;
              font-size: 8.5px;
              font-weight: 800;
              padding: 1px 5px;
              border-radius: 3px;
              background: #dcfce7;
              color: #15803d;
              margin-left: 6px;
            }
            .tag-unvalid {
              display: inline-block;
              font-size: 8.5px;
              font-weight: 800;
              padding: 1px 5px;
              border-radius: 3px;
              background: #fef3c7;
              color: #b45309;
              margin-left: 6px;
            }
            .footer {
              margin-top: 12px;
              text-align: center;
              font-size: 9px;
              color: #64748b;
              border-top: 1px solid #cbd5e1;
              padding-top: 8px;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="outer-border">
            <div class="inner-border">
              <!-- Header -->
              <div class="header">
                <img src="${CERTIFICATE_LOGO_BASE64}" class="logo" alt="Logo" />
                <h1 class="org-name">Centre for Climate-Smart Agriculture</h1>
                <div class="org-uni">Cosmopolitan University Abuja</div>
                <div class="org-brand">CCSA / AGROMONEY • Energy & Rural Development</div>
                <div class="gold-divider"></div>
                <h2 class="doc-title">Official Dwelling Identification & Verification Slip</h2>
                <div class="doc-sub">National Household Georeferencing & Productive Energy Mapping Registry</div>
              </div>

              <!-- House Code Box -->
              <div class="house-box">
                <div>
                  <div class="house-label">Assigned Standardized House Code</div>
                  <div class="house-code">${household.houseNumber}</div>
                </div>
                <div>
                  <span class="status-badge">Registry Status: ${household.interventionStatus}</span>
                </div>
              </div>

              <!-- Cryptographic QR & Verification Block -->
              <div class="qr-banner">
                <div class="qr-wrap">
                  <img src="${qrImgSrc}" alt="QR" />
                </div>
                <div>
                  <div class="qr-info-title">Cryptographic Online Verification</div>
                  <div class="qr-info-desc">
                    Scan this QR code with any smartphone camera or QR reader to verify authenticity and inspect complete live credentials on the CCSA National Registry.
                  </div>
                  <div class="qr-url">${verifyUrl}</div>
                </div>
              </div>

              <!-- 1. Head of Household -->
              <table class="table-sec">
                <thead>
                  <tr><th colspan="2">1. Head of Household Credentials</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="cell-label">Head of Household</td>
                    <td class="cell-val">${fullName}</td>
                  </tr>
                  <tr>
                    <td class="cell-label">National Identity (NIN)</td>
                    <td class="cell-val">
                      ${household.headNin || 'N/A'}
                      ${household.headNinVerified ? '<span class="tag-valid">✓ NIMC Verified</span>' : ''}
                    </td>
                  </tr>
                  <tr>
                    <td class="cell-label">Contact Phone Number</td>
                    <td class="cell-val">
                      ${household.headPhone || 'N/A'}
                      <span class="${household.headPhoneVerified ? 'tag-valid' : 'tag-unvalid'}">
                        ${household.headPhoneVerified ? '✓ Validated via OTP' : 'Not Validated'}
                      </span>
                    </td>
                  </tr>
                  ${household.headOccupation ? `
                  <tr>
                    <td class="cell-label">Major Occupation</td>
                    <td class="cell-val"><strong>${household.headOccupation}</strong></td>
                  </tr>` : ''}
                  <tr>
                    <td class="cell-label">Total Occupants</td>
                    <td class="cell-val">${household.totalHouseholdMembers || 1} Residents (${household.wivesCount} Wives, ${household.childrenCount} Children, ${household.otherDependentsCount} Other Dependents)</td>
                  </tr>
                  <tr>
                    <td class="cell-label">Domestic Animals / Livestock</td>
                    <td class="cell-val">
                      ${household.hasLivestock
                        ? `<strong>${household.totalAnimalsCount || 0} Animals</strong> (${[
                            household.cattleCount ? `${household.cattleCount} Cattle` : '',
                            household.horsesCount ? `${household.horsesCount} Horses` : '',
                            household.sheepCount ? `${household.sheepCount} Sheep` : '',
                            household.goatsCount ? `${household.goatsCount} Goats` : '',
                            household.poultryCount ? `${household.poultryCount} Poultry` : '',
                            household.donkeysCount ? `${household.donkeysCount} Donkeys` : '',
                            household.otherAnimalsCount ? `${household.otherAnimalsCount} Other` : '',
                          ].filter(Boolean).join(', ')})`
                        : 'None reported'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- 2. Dwelling Spatial Location -->
              <table class="table-sec">
                <thead>
                  <tr><th colspan="2">2. Dwelling Spatial Georeferencing</th></tr>
                </thead>
                <tbody>
                  ${household.houseType ? `
                  <tr>
                    <td class="cell-label">Dwelling Type</td>
                    <td class="cell-val"><strong>${household.houseType}</strong></td>
                  </tr>` : ''}
                  <tr>
                    <td class="cell-label">Dwelling Address</td>
                    <td class="cell-val">
                      ${household.address ? `<strong>${household.address}</strong><br />` : ''}
                      ${[household.ward, household.lga, household.state].filter(Boolean).join(', ')}
                      ${household.gpsAddress ? `<div style="font-size:9.5px; color:#64748b; margin-top:2px;">GPS: ${household.gpsAddress}</div>` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td class="cell-label">Administrative Boundary</td>
                    <td class="cell-val">${household.ward}, ${household.lga}, ${household.state}</td>
                  </tr>
                  <tr>
                    <td class="cell-label">Polling Unit</td>
                    <td class="cell-val">${formatPollingUnit(household.pollingUnit)}</td>
                  </tr>
                  <tr>
                    <td class="cell-label">GPS Georeference</td>
                    <td class="cell-val" style="font-family: monospace;">
                      ${household.latitude && household.longitude ? `${household.latitude.toFixed(6)}, ${household.longitude.toFixed(6)}` : 'Captured'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- 3. Energy & Connectivity Profile -->
              <table class="table-sec">
                <thead>
                  <tr><th colspan="2">3. Utilities, Energy & Connectivity Profile</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="cell-label">Primary Electricity Source</td>
                    <td class="cell-val">${household.primaryEnergySource || 'Grid / Standalone Solar / None'}</td>
                  </tr>
                  <tr>
                    <td class="cell-label">Primary Water Source</td>
                    <td class="cell-val">${household.waterSource || 'Borehole / Hand Pump / Well'}</td>
                  </tr>
                  <tr>
                    <td class="cell-label">Productive Energy (PUE)</td>
                    <td class="cell-val">
                      ${household.hasPUE ? '<strong style="color:#059669;">Active Productive Equipment on Site</strong>' : 'Residential Dwelling Only'}
                      ${household.pueType ? ` (${household.pueType})` : ''}
                      ${household.pueEquipment?.length ? `<br /><span style="font-size:9.5px; color:#475569;">Equipment: ${household.pueEquipment.join(', ')}</span>` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td class="cell-label">Telecommunications</td>
                    <td class="cell-val">${household.telcoProviders?.join(', ') || 'Active'} • Coverage: ${household.networkType || 'GSM'}</td>
                  </tr>
                </tbody>
              </table>

              <div class="footer">
                Issued: <strong>${issueDate}</strong> • Verification ID: ${household.offlineId || household.houseNumber}<br />
                Official Tamper-Evident Credential issued by Centre for Climate-Smart Agriculture (CCSA) • Cosmopolitan University Abuja
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      Alert.alert(
        'Slip Generated',
        'Official Dwelling Identification Slip PDF has been generated with cryptographic QR verification.',
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
    ? `${household.headFirstName} ${household.headMiddleName ? household.headMiddleName + ' ' : ''}${household.headLastName}`.trim()
    : '';

  const verifyUrl = household ? getPublicVerificationUrl(household.houseNumber) : '';

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
            {/* Top Institutional Banner with Logo */}
            <View style={styles.slipHeader}>
              <Image
                source={require('../../../assets/certificate-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.emblemText}>CENTRE FOR CLIMATE-SMART AGRICULTURE</Text>
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

            {/* Cryptographic QR Code and Key Details Row */}
            <View style={styles.qrRow}>
              <View style={styles.qrBox}>
                <QRCode
                  value={verifyUrl}
                  size={100}
                  color="#081B33"
                  getRef={(c) => (qrSvgRef.current = c)}
                />
              </View>

              <View style={styles.qrDetails}>
                <Text style={styles.qrHeadName}>{fullName}</Text>
                <Text style={styles.qrNinText}>NIN: {household.headNin || 'Verified'}</Text>
                <Text style={styles.qrLocationText}>
                  {[household.ward, household.lga, household.state].filter(Boolean).join(', ')}
                </Text>
                <View style={styles.verifiedTag}>
                  <Ionicons name="shield-checkmark" size={14} color="#059669" />
                  <Text style={styles.verifiedTagText}>Registry Verified</Text>
                </View>
              </View>
            </View>

            {/* Public URL Notice */}
            <TouchableOpacity
              style={styles.verifyUrlBox}
              onPress={() => Linking.openURL(verifyUrl)}
              activeOpacity={0.7}
            >
              <Ionicons name="globe-outline" size={14} color="#0369a1" />
              <Text style={styles.verifyUrlText} numberOfLines={1}>
                {verifyUrl}
              </Text>
              <Ionicons name="open-outline" size={12} color="#0369a1" />
            </TouchableOpacity>

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

              {household.houseType && (
                <View style={styles.detailItem}>
                  <Text style={styles.itemLabel}>Dwelling Type</Text>
                  <Text style={styles.itemValue}>{household.houseType}</Text>
                </View>
              )}

              {household.headOccupation && (
                <View style={styles.detailItem}>
                  <Text style={styles.itemLabel}>Major Occupation</Text>
                  <Text style={styles.itemValue}>{household.headOccupation}</Text>
                </View>
              )}

              <View style={styles.detailItem}>
                <Text style={styles.itemLabel}>Total Residents</Text>
                <Text style={styles.itemValue}>{household.totalHouseholdMembers || 1} Persons</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.itemLabel}>Livestock Owned</Text>
                <Text style={styles.itemValue}>
                  {household.hasLivestock ? `${household.totalAnimalsCount || 0} Animals` : 'None'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.itemLabel}>Water Source</Text>
                <Text style={styles.itemValue}>{household.waterSource || 'Borehole / Well'}</Text>
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
                style={styles.onlineVerifyBtn}
                onPress={() => Linking.openURL(verifyUrl)}
              >
                <Ionicons name="shield-checkmark-outline" size={16} color="#013358" style={{ marginRight: 6 }} />
                <Text style={styles.onlineVerifyBtnText}>Open Public Verification URL</Text>
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#081B33',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
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
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  searchBtn: {
    backgroundColor: '#081B33',
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  slipCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#081B33',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  slipHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 14,
    marginBottom: 16,
  },
  logoImage: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  emblemText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#081B33',
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
    color: '#b45309',
    letterSpacing: 0.8,
    marginTop: 2,
    textAlign: 'center',
  },
  headerDivider: {
    height: 2,
    backgroundColor: '#C5A059',
    width: '75%',
    marginVertical: 10,
    borderRadius: 1,
  },
  slipTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#081B33',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  slipSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  houseCodeBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#081B33',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  houseCodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  houseCodeValue: {
    fontFamily: 'Courier New',
    fontSize: 21,
    fontWeight: '900',
    color: '#081B33',
    letterSpacing: 1,
    marginTop: 3,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  qrBox: {
    padding: 6,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#081B33',
  },
  qrDetails: {
    flex: 1,
  },
  qrHeadName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  qrNinText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
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
    backgroundColor: '#ecfdf5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  verifyUrlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  verifyUrlText: {
    flex: 1,
    fontFamily: 'Courier New',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0369a1',
  },
  detailsList: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  itemValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  slipActions: {
    gap: 10,
    marginTop: 20,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#081B33',
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#081B33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  printBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  onlineVerifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 12,
    borderRadius: 10,
  },
  onlineVerifyBtnText: {
    color: '#081B33',
    fontSize: 13.5,
    fontWeight: '700',
  },
  detailsBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  detailsBtnText: {
    color: '#475569',
    fontSize: 13.5,
    fontWeight: '700',
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
    backgroundColor: '#081B33',
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
