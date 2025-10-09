import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { useFarmerStore } from '../store/farmerStore';
import LoadingScreen from './LoadingScreen';
import PolygonMapMobile from '../components/PolygonMapMobile';

export default function CertificateScreen({ navigation, route }) {
  const [nin, setNin] = useState('');
  const [farmer, setFarmer] = useState(route?.params?.farmer || null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!route?.params?.farmer);
  const { getFarmerByNin } = useFarmerStore();

  // Set NIN if farmer data is passed from navigation
  useEffect(() => {
    if (route?.params?.farmer) {
      setNin(route.params.farmer.nin);
      setFarmer(route.params.farmer);
      setHasSearched(true);
    }
  }, [route?.params?.farmer]);

  const searchFarmerByNin = async () => {
    if (!nin.trim() || nin.trim().length !== 11) {
      Alert.alert('Invalid NIN', 'Please enter a valid 11-digit NIN');
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const foundFarmer = await getFarmerByNin(nin.trim());
      setFarmer(foundFarmer);
      
      if (!foundFarmer) {
        Alert.alert('Farmer Not Found', 'No farmer found with this NIN');
      }
    } catch (error) {
      Alert.alert('Search Error', 'Failed to search for farmer');
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async () => {
    if (!farmer) return;

    try {
      setLoading(true);
      
      // Generate HTML content for the certificate
      const htmlContent = generateCertificateHTML(farmer);
      
      // Use expo-print for both iOS and Android
      await generatePDFWithExpo(htmlContent, farmer.nin);
    } catch (error) {
      console.error('Certificate generation error:', error);
      Alert.alert('Error', 'Failed to generate certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDFWithExpo = async (htmlContent, nin) => {
    try {
      // Use expo-print for proper PDF generation
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 841, 
        height: 595,
        orientation: Print.Orientation.landscape,
        margins: {
          left: 36,   // 0.5 inch margins
          top: 36,
          right: 36,
          bottom: 36,
        },
      });
      
      // Move to a permanent location
      const fileName = `farmer_certificate_${nin}.pdf`;
      const newUri = FileSystem.documentDirectory + fileName;
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });
      
      Alert.alert(
        'Certificate Generated',
        'Farmer certificate PDF has been generated successfully!',
        [
          {
            text: 'View/Share',
            onPress: () => Sharing.shareAsync(newUri)
          },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      throw error;
    }
  };

  const viewPDF = async (filePath) => {
    try {
      if (Platform.OS === 'android') {
        // On Android, try to open with default PDF viewer
        await Linking.openURL(`file://${filePath}`);
      } else {
        // On iOS, use sharing
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open PDF file');
    }
  };

  const sharePDF = async (filePath) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to share PDF file');
    }
  };

  // Generate certificate verification URL (matching backend format)
  const generateVerificationUrl = (farmer) => {
    if (!farmer?.id) return farmer?.nin || '';
    const certificateId = `CCSA-${new Date().getFullYear()}-${farmer.id.slice(-6).toUpperCase()}`;
    return `http://172.20.10.4:3000/verify-certificate/${certificateId}`;
  };

  const generatePolygonSVG = (polygonData) => {
    if (!polygonData) return '';
    
    try {
      let coordinates = [];
      
      // Handle different polygon data formats
      if (typeof polygonData === 'string') {
        const parsed = JSON.parse(polygonData);
        coordinates = extractCoordinatesFromData(parsed);
      } else if (typeof polygonData === 'object') {
        coordinates = extractCoordinatesFromData(polygonData);
      }

      if (coordinates.length === 0) return '';

      // Calculate bounds
      const lats = coordinates.map(coord => coord[1]);
      const lngs = coordinates.map(coord => coord[0]);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // Convert to SVG coordinates
      const width = 200;
      const height = 150;
      const padding = 10;
      const svgWidth = width - padding * 2;
      const svgHeight = height - padding * 2;
      
      const latRange = maxLat - minLat || 0.001;
      const lngRange = maxLng - minLng || 0.001;
      
      const points = coordinates.map(([lng, lat]) => {
        const x = padding + ((lng - minLng) / lngRange) * svgWidth;
        const y = padding + ((maxLat - lat) / latRange) * svgHeight;
        return `${x},${y}`;
      });

      const polygonPoints = points.join(' ');
      
      return `
        <div style="margin-top: 10px;">
          <div style="font-size: 10px; font-weight: 600; margin-bottom: 5px; color: #1a202c;">Farm Polygon:</div>
          <svg width="${width}" height="${height}" style="border: 1px solid #e2e8f0; border-radius: 4px; background: #f8fafc;">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="0.5" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <polygon points="${polygonPoints}" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" stroke-width="1.5"/>
            ${coordinates.map(([lng, lat], index) => {
              const x = padding + ((lng - minLng) / lngRange) * svgWidth;
              const y = padding + ((maxLat - lat) / latRange) * svgHeight;
              return `<circle cx="${x}" cy="${y}" r="2" fill="#22c55e" stroke="white" stroke-width="1"/>`;
            }).join('')}
            <text x="${width - 30}" y="15" font-size="8" fill="#374151" font-weight="bold">N</text>
            <path d="M ${width - 30} 20 L ${width - 27} 25 L ${width - 30} 30 L ${width - 33} 25 Z" fill="#ef4444"/>
          </svg>
          <div style="font-size: 8px; color: #6b7280; margin-top: 3px;">
            Points: ${coordinates.length} | Bounds: ${minLat.toFixed(4)}°, ${minLng.toFixed(4)}° to ${maxLat.toFixed(4)}°, ${maxLng.toFixed(4)}°
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error generating polygon SVG:', error);
      return '';
    }
  };

  const extractCoordinatesFromData = (data) => {
    // Handle GeoJSON format
    if (data && data.type === 'Polygon' && data.coordinates) {
      return data.coordinates[0]; // First ring of the polygon
    }
    
    // Handle GeoJSON Feature
    if (data && data.geometry && data.geometry.type === 'Polygon') {
      return data.geometry.coordinates[0];
    }
    
    // Handle array of coordinate arrays
    if (Array.isArray(data) && data.length > 0) {
      if (Array.isArray(data[0]) && data[0].length >= 2) {
        return data;
      }
    }
    
    // Handle coordinates property
    if (data && data.coordinates) {
      return extractCoordinatesFromData(data.coordinates);
    }
    
    return [];
  };

  const generateCertificateHTML = (farmer) => {
    const currentDate = new Date().toLocaleDateString('en-GB');
    const certificateId = `CCSA-${new Date().getFullYear()}-${farmer.id.slice(-6).toUpperCase()}`;
    const verificationUrl = generateVerificationUrl(farmer);
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Farmer Registration Certificate</title>
        <style>
            @page {
                size: A4 landscape;
                margin: 15px;
            }
            
            body {
                font-family: 'Times New Roman', serif;
                margin: 0;
                padding: 15px;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                color: #1a202c;
                height: calc(100vh - 100px);
                box-sizing: border-box;
            }
            
            .certificate-container {
                background: white;
                border: 4px solid #2b6cb0;
                border-radius: 10px;
                padding: 20px;
                height: 100%;
                position: relative;
                box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                box-sizing: border-box;
                overflow: hidden;
            }
            
            .decorative-border {
                position: absolute;
                top: 10px;
                left: 10px;
                right: 10px;
                bottom: 10px;
                border: 1px solid #3182ce;
                border-radius: 8px;
                background: 
                    radial-gradient(circle at 20% 80%, #e6fffa 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, #fef5e7 0%, transparent 50%),
                    radial-gradient(circle at 40% 40%, #e6f3ff 0%, transparent 50%);
            }
            
            .content {
                position: relative;
                z-index: 1;
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            .header {
                text-align: center;
                margin-bottom: 15px;
                border-bottom: 2px solid #2b6cb0;
                padding-bottom: 10px;
            }
            
            .coat-of-arms {
                width: 400px;
                height: 35px;
                background: #2b6cb0;
                border-radius: 50%;
                margin: 0 auto 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 14px;
                font-weight: bold;
            }
            
            .title-main {
                font-size: 20px;
                font-weight: bold;
                color: #2b6cb0;
                margin: 6px 0 4px;
                text-transform: uppercase;
                letter-spacing: 1.2px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            }
            
            .title-sub {
                font-size: 13px;
                color: #4a5568;
                margin: 4px 0;
                font-style: italic;
            }
            
            .certificate-text {
                font-size: 12px;
                text-align: center;
                margin: 10px 0;
                line-height: 1.4;
                color: #000000;
            }
            
            .farmer-name {
                font-size: 18px;
                font-weight: bold;
                color: #000000;
                text-decoration: underline;
                text-decoration-color: #3182ce;
                text-decoration-thickness: 2px;
                margin: 8px 0;
                display: inline-block;
            }
            
            .details-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 4px;
                margin: 4px 0;
                flex: 1;
                overflow: hidden;
            }
            
            .details-column {
                background: rgba(237, 250, 253, 0.5);
                padding: 6px 8px;
                max-height: 100%;
                border-radius: 6px;
                border: 1px solid #bee3f8;
                overflow: hidden;
            }
            
            .section-title {
                font-size: 11px;
                font-weight: bold;
                color: #2b6cb0;
                margin-bottom: 4px;
                border-bottom: 1px solid #3182ce;
                padding-bottom: 2px;
                text-transform: uppercase;
                letter-spacing: 0.6px;
                margin-top: 0 !important;
            }
            
            .detail-row {
                display: flex;
                margin: 2px 0;
                align-items: center;
            }
            
            .detail-label {
                font-weight: 600;
                width: 90px;
                color: #1a202c;
                font-size: 10px;
                flex-shrink: 0;
            }
            
            .detail-value {
                flex: 1;
                color: #000000;
                font-size: 10px;
                font-weight: 500;
                word-break: break-word;
            }
            
            .footer {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-top: auto;
                padding-top: 10px;
                border-top: 1px solid #e2e8f0;
                height: 50px;
            }
            
            .signature-section {
                text-align: center;
                width: 140px;
            }
            
            .signature-line {
                border-top: 2px solid #000000;
                margin-top: 25px;
                padding-top: 4px;
                font-size: 10px;
                font-weight: 600;
                color: #000000;
            }
            
            .certificate-info {
                text-align: center;
                font-size: 9px;
                color: #718096;
                line-height: 1.2;
            }
            
            .qr-placeholder {
                width: 50px;
                height: 50px;
                border: 2px dashed #cbd5e0;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                color: #a0aec0;
                text-align: center;
                margin: 0 auto 6px;
            }
            
            .valid-stamp {
                position: absolute;
                top: 100px;
                right: 35px;
                width: 70px;
                height: 70px;
                border: 2px solid #48bb78;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #48bb78;
                font-weight: bold;
                font-size: 9px;
                text-align: center;
                transform: rotate(-15deg);
                background: rgba(72, 187, 120, 0.1);
            }
        </style>
    </head>
    <body>
        <div class="certificate-container">
            <div class="decorative-border"></div>
            <div class="valid-stamp">
                VALID<br>CERTIFICATE
            </div>
            
            <div class="content">
                <div class="header">
                    <div class="coat-of-arms">COSMOPOLITAN UNIVERSITY ABUJA</div>
                    <div class="title-main">Centre for Climate-Smart Agriculture (CCSA)</div>
                    <div class="title-sub">Farmers Information Management System</div>
                    <div style="font-size: 12px; font-weight: bold; color: #2b6cb0; margin-top: 6px;">
                        FARMER REGISTRATION CERTIFICATE
                    </div>
                </div>
                
                <div class="certificate-text">
                    This is to certify that
                    <div class="farmer-name">${farmer.firstName} ${farmer.middleName || ''} ${farmer.lastName}</div>
                    has been duly registered in the National Farmers Database and is hereby recognized as a legitimate farmer under the Farmers Information Management System.
                </div>
                
                <div class="details-section">
                    <div class="details-column">
                        <div class="section-title">Personal Information</div>
                        <div class="detail-row">
                            <div class="detail-label">NIN:</div>
                            <div class="detail-value">${farmer.nin}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Phone:</div>
                            <div class="detail-value">${farmer.phone}</div>
                        </div>
                        ${farmer.email ? `
                        <div class="detail-row">
                            <div class="detail-label">Email:</div>
                            <div class="detail-value">${farmer.email}</div>
                        </div>
                        ` : ''}
                        <div class="detail-row">
                            <div class="detail-label">Gender:</div>
                            <div class="detail-value">${farmer.gender || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Date of Birth:</div>
                            <div class="detail-value">${farmer.dateOfBirth ? new Date(farmer.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'}</div>
                        </div>
                        
                        <div class="section-title" style="margin-top: 10px;">Banking Information</div>
                        <div class="detail-row">
                            <div class="detail-label">Bank:</div>
                            <div class="detail-value">${farmer.bankName || 'N/A'}</div>
                        </div>
                        ${farmer.accountName ? `
                        <div class="detail-row">
                            <div class="detail-label">Account Name:</div>
                            <div class="detail-value">${farmer.accountName}</div>
                        </div>
                        ` : ''}
                        <div class="detail-row">
                            <div class="detail-label">Account:</div>
                            <div class="detail-value">${farmer.accountNumber || 'N/A'}</div>
                        </div>
                        ${farmer.bvn ? `
                        <div class="detail-row">
                            <div class="detail-label">BVN:</div>
                            <div class="detail-value">${farmer.bvn}</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="details-column">
                        <div class="section-title">Location Information</div>
                        <div class="detail-row">
                            <div class="detail-label">State:</div>
                            <div class="detail-value">${farmer.state || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">LGA:</div>
                            <div class="detail-value">${farmer.lga || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Ward:</div>
                            <div class="detail-value">${farmer.ward || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Address:</div>
                            <div class="detail-value">${farmer.address || 'N/A'}</div>
                        </div>
                        
                        <div class="section-title" style="margin-top: 10px;">Certificate Details</div>
                        <div class="detail-row">
                            <div class="detail-label">Cert. ID:</div>
                            <div class="detail-value">${certificateId}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Reg. Date:</div>
                            <div class="detail-value">${farmer.createdAt ? new Date(farmer.createdAt).toLocaleDateString('en-GB') : 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Issue Date:</div>
                            <div class="detail-value">${currentDate}</div>
                        </div>
                        
                        ${farmer.farms && farmer.farms.length > 0 && farmer.farms[0].farmPolygon ? generatePolygonSVG(farmer.farms[0].farmPolygon) : ''}
        
                    </div>
                </div>
                
                <div class="footer">
                    <div class="signature-section">
                        <div class="signature-line">Registering Agent</div>
                    </div>
                    
                    <div class="certificate-info">
                        <div style="font-weight: bold; margin-bottom: 5px;">Certificate of Registration</div>
                        <div>Generated: ${currentDate}</div>
                        <div>Certificate ID: ${certificateId}</div>
                        <div style="margin-top: 10px; font-style: italic;">
                            This certificate is valid and can be verified<br>
                            through the FIMS verification system
                        </div>
                    </div>
                    
                    <div class="signature-section">
                        <div class="signature-line">Official Seal</div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  };

  const clearSearch = () => {
    setNin('');
    setFarmer(null);
    setHasSearched(false);
  };

  if (loading) {
    return <LoadingScreen message="Processing..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="document-text-outline" size={48} color="#013358" />
          <Text style={styles.title}>Generate Certificate</Text>
          <Text style={styles.subtitle}>
            {farmer ? 'Certificate ready for generation' : 'Search farmer by NIN to generate certificate'}
          </Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>National Identification Number (NIN)</Text>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="card-outline" size={20} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Enter 11-digit NIN"
                value={nin}
                onChangeText={setNin}
                keyboardType="numeric"
                maxLength={11}
                returnKeyType="search"
                onSubmitEditing={searchFarmerByNin}
              />
              {nin.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearSearch}
                >
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity
              style={[styles.searchButton, nin.length !== 11 && styles.searchButtonDisabled]}
              onPress={searchFarmerByNin}
              disabled={nin.length !== 11}
            >
              <Ionicons name="search" size={20} color="#ffffff" />
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Section */}
        {hasSearched && (
          <View style={styles.resultsSection}>
            {farmer ? (
              <View style={styles.farmerCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {farmer.firstName?.[0] || '?'}{farmer.lastName?.[0] || '?'}
                    </Text>
                  </View>
                  <View style={styles.farmerInfo}>
                    <Text style={styles.farmerName}>
                      {farmer.firstName} {farmer.middleName || ''} {farmer.lastName}
                    </Text>
                    <Text style={styles.farmerDetails}>
                      NIN: {farmer.nin}
                    </Text>
                    <Text style={styles.farmerDetails}>
                      Phone: {farmer.phone}
                    </Text>
                    {farmer.email && (
                      <Text style={styles.farmerDetails}>
                        Email: {farmer.email}
                      </Text>
                    )}
                  </View>
                </View>

                {/* QR Code Section */}
                <View style={styles.qrSection}>
                  <Text style={styles.qrTitle}>Certificate Verification QR Code</Text>
                  <View style={styles.qrContainer}>
                    <QRCode
                      value={generateVerificationUrl(farmer)}
                      size={120}
                      color="#1f2937"
                      backgroundColor="#ffffff"
                    />
                  </View>
                  <Text style={styles.qrDescription}>
                    Scan to verify certificate and farmer identity
                  </Text>
                </View>

                {/* Farmer Details */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date of Birth:</Text>
                    <Text style={styles.detailValue}>{farmer.dateOfBirth || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gender:</Text>
                    <Text style={styles.detailValue}>{farmer.gender || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Marital Status:</Text>
                    <Text style={styles.detailValue}>{farmer.maritalStatus || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Employment Status:</Text>
                    <Text style={styles.detailValue}>{farmer.employmentStatus || 'N/A'}</Text>
                  </View>

                  <Text style={styles.sectionTitle}>Contact Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={styles.detailValue}>{farmer.address || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>State:</Text>
                    <Text style={styles.detailValue}>{farmer.state || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>LGA:</Text>
                    <Text style={styles.detailValue}>{farmer.lga || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ward:</Text>
                    <Text style={styles.detailValue}>{farmer.ward || 'N/A'}</Text>
                  </View>

                  <Text style={styles.sectionTitle}>Banking Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bank:</Text>
                    <Text style={styles.detailValue}>{farmer.bankName || 'N/A'}</Text>
                  </View>
                  {farmer.accountName && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Account Name:</Text>
                      <Text style={styles.detailValue}>{farmer.accountName}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Number:</Text>
                    <Text style={styles.detailValue}>{farmer.accountNumber || 'N/A'}</Text>
                  </View>
                  {farmer.bvn && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>BVN:</Text>
                      <Text style={styles.detailValue}>{farmer.bvn}</Text>
                    </View>
                  )}

                  {farmer.farmInfo && (
                    <>
                      <Text style={styles.sectionTitle}>Farm Information</Text>
                      {farmer.farmInfo.farmLocation && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Farm Location:</Text>
                          <Text style={styles.detailValue}>{farmer.farmInfo.farmLocation}</Text>
                        </View>
                      )}
                      {farmer.farmInfo.farmSize && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Farm Size:</Text>
                          <Text style={styles.detailValue}>{farmer.farmInfo.farmSize}</Text>
                        </View>
                      )}
                      {farmer.farmInfo.primaryCrop && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Primary Crop:</Text>
                          <Text style={styles.detailValue}>{farmer.farmInfo.primaryCrop}</Text>
                        </View>
                      )}
                    </>
                  )}

                  {/* Farm Polygon Visualization */}
                  {(farmer.farms && farmer.farms.length > 0 && farmer.farms[0].farmPolygon) && (
                    <>
                      <Text style={styles.sectionTitle}>Farm Polygon</Text>
                      <View style={{ marginVertical: 16 }}>
                        <PolygonMapMobile 
                          polygonData={farmer.farms[0].farmPolygon}
                          height={200}
                          showCoordinates={true}
                        />
                      </View>
                    </>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Registration Date:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(farmer.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Generate Certificate Button */}
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={generateCertificate}
                >
                  <Ionicons name="document-text" size={20} color="#ffffff" />
                  <Text style={styles.generateButtonText}>Generate PDF Certificate</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.notFoundCard}>
                <Ionicons name="alert-circle-outline" size={64} color="#f59e0b" />
                <Text style={styles.notFoundTitle}>Farmer Not Found</Text>
                <Text style={styles.notFoundDescription}>
                  No farmer registered with NIN: {nin}
                </Text>
                <Text style={styles.notFoundHint}>
                  Please verify the NIN and try again
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Instructions */}
        {!hasSearched && (
          <View style={styles.instructionsSection}>
            <View style={styles.instructionItem}>
              <Ionicons name="search-outline" size={24} color="#013358" />
              <Text style={styles.instructionText}>
                Enter the farmer's 11-digit NIN to search for their record
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="document-text-outline" size={24} color="#013358" />
              <Text style={styles.instructionText}>
                Review farmer details and generate PDF certificate
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="qr-code-outline" size={24} color="#013358" />
              <Text style={styles.instructionText}>
                Certificate includes QR code for verification
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  searchSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    letterSpacing: 1,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#013358',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  searchButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsSection: {
    marginBottom: 24,
  },
  farmerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#013358',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  farmerInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  farmerDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
  },
  qrDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    width: 120,
    marginRight: 12,
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  notFoundCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  notFoundDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  notFoundHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  instructionsSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 16,
    color: '#1e40af',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
});
