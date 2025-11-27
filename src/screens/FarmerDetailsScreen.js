import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFarmerStore } from '../store/farmerStore';
import { farmService } from '../services/farmService';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import PolygonMapMobile from '../components/PolygonMapMobile';

const FarmerDetailsScreen = ({ route, navigation }) => {
  const { farmerId, farmer } = route.params;
  const { farmers, loading, fetchFarmers } = useFarmerStore();
  const [currentFarmer, setCurrentFarmer] = useState(farmer || null);
  const [farmerFarms, setFarmerFarms] = useState([]);
  const [loadingFarms, setLoadingFarms] = useState(false);

  useEffect(() => {
    if (farmer) {
      setCurrentFarmer(farmer);
    } else {
      // Try to find farmer in the store
      const farmerData = farmers.find(f => f.id === farmerId);
      if (farmerData) {
        setCurrentFarmer(farmerData);
      } else {
        fetchFarmers();
      }
    }
    
    // Load farms for this farmer
    loadFarms();
  }, [farmerId, farmer, farmers]);

  const loadFarms = async () => {
    if (!farmerId) return;
    
    try {
      setLoadingFarms(true);
      console.log('Loading farms for farmer:', farmerId);
      const farms = await farmService.getFarmsByFarmer(farmerId);
      console.log('Farms loaded:', farms);
      setFarmerFarms(farms || []);
    } catch (error) {
      console.error('Error loading farms:', error);
      setFarmerFarms([]);
    } finally {
      setLoadingFarms(false);
    }
  };

  const handleGenerateCertificate = () => {
    // Pass only essential farmer data to avoid payload size issues
    const farmerData = {
      id: currentFarmer.id,
      nin: currentFarmer.nin,
      firstName: currentFarmer.firstName,
      middleName: currentFarmer.middleName,
      lastName: currentFarmer.lastName,
      dateOfBirth: currentFarmer.dateOfBirth,
      gender: currentFarmer.gender,
      state: currentFarmer.state,
      lga: currentFarmer.lga,
      ward: currentFarmer.ward,
      address: currentFarmer.address,
      phone: currentFarmer.phone,
      email: currentFarmer.email,
      maritalStatus: currentFarmer.maritalStatus,
      employmentStatus: currentFarmer.employmentStatus,
      bankName: currentFarmer.bankName,
      accountName: currentFarmer.accountName,
      accountNumber: currentFarmer.accountNumber,
      bvn: currentFarmer.bvn,
      registrationDate: currentFarmer.registrationDate,
      createdAt: currentFarmer.createdAt
    };
    
    navigation.navigate('Certificate', { farmer: farmerData });
  };

  const handleAddFarm = () => {
    navigation.navigate('AddFarm', { farmerId, farmer: currentFarmer });
  };

  if (loading || !currentFarmer) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Loading farmer details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentFarmer.firstName?.charAt(0)}{currentFarmer.lastName?.charAt(0)}
            </Text>
          </View>
          <View style={styles.nameSection}>
            <Text style={styles.name}>
              {currentFarmer.firstName} {currentFarmer.middleName} {currentFarmer.lastName}
            </Text>
            <Text style={styles.nin}>NIN: {currentFarmer.nin}</Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.addFarmButton} onPress={handleAddFarm}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Add Farm</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.certificateButton} onPress={handleGenerateCertificate}>
            <Ionicons name="document-text-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>View Certificate</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoGrid}>
            <InfoItem label="Date of Birth" value={currentFarmer.dateOfBirth} />
            <InfoItem label="Gender" value={currentFarmer.gender} />
            <InfoItem label="Phone" value={currentFarmer.phone} />
            <InfoItem label="Email" value={currentFarmer.email} />
            <InfoItem label="Marital Status" value={currentFarmer.maritalStatus} />
          </View>
        </View>

        {/* Address Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Information</Text>
          <View style={styles.infoGrid}>
            <InfoItem label="State" value={currentFarmer.state} />
            <InfoItem label="LGA" value={currentFarmer.lga} />
            <InfoItem label="Ward" value={currentFarmer.ward} />
            <InfoItem label="Address" value={currentFarmer.address} fullWidth />
          </View>
        </View>

        {/* Bank Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Information</Text>
          <View style={styles.infoGrid}>
            <InfoItem label="Bank Name" value={currentFarmer.bankName} />
            <InfoItem label="Account Name" value={currentFarmer.accountName} />
            <InfoItem label="Account Number" value={currentFarmer.accountNumber} />
            <InfoItem label="BVN" value={currentFarmer.bvn} />
          </View>
        </View>

        {/* Farms Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Farms ({farmerFarms.length})</Text>
            <TouchableOpacity style={styles.addFarmButtonSmall} onPress={handleAddFarm}>
              <Ionicons name="add" size={20} color="#28a745" />
              <Text style={styles.addFarmButtonText}>Add Farm</Text>
            </TouchableOpacity>
          </View>
          
          {loadingFarms ? (
            <View style={styles.loadingFarms}>
              <ActivityIndicator size="small" color="#28a745" />
              <Text style={styles.loadingText}>Loading farms...</Text>
            </View>
          ) : farmerFarms.length > 0 ? (
            farmerFarms.map((farm, index) => (
              <View key={farm.id} style={styles.farmCard}>
                <Text style={styles.farmTitle}>Farm {index + 1}</Text>
                <View style={styles.farmDetails}>
                  <InfoItem label="Primary Crop" value={farm.primaryCrop} />
                  <InfoItem label="Farm Size" value={farm.farmSize ? `${farm.farmSize} hectares` : 'N/A'} />
                  <InfoItem label="State" value={farm.farmState} />
                  <InfoItem label="LGA" value={farm.farmLocalGovernment} />
                  <InfoItem label="Ownership" value={farm.farmOwnership} />
                  <InfoItem label="Experience" value={farm.farmingExperience ? `${farm.farmingExperience} years` : 'N/A'} />
                </View>
                {farm.farmLatitude && farm.farmLongitude && (
                  <Text style={styles.coordinates}>
                    📍 {farm.farmLatitude}, {farm.farmLongitude}
                  </Text>
                )}
                {/* Polygon Preview */}
                {farm.farmPolygon && farm.farmPolygon.length >= 3 && (
                  <View style={styles.polygonSection}>
                    <Text style={styles.polygonLabel}>Farm Boundary Map:</Text>
                    <View style={styles.polygonMapContainer}>
                      <PolygonMapMobile 
                        polygonData={farm.farmPolygon}
                        width={350}
                        height={250}
                        showCoordinates={true}
                      />
                    </View>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noFarms}>
              <Ionicons name="leaf-outline" size={48} color="#ccc" />
              <Text style={styles.noFarmsText}>No farms registered</Text>
              <Text style={styles.noFarmsSubtext}>Tap "Add Farm" to register the first farm</Text>
            </View>
          )}
        </View>

        {/* Referee Information */}
        {currentFarmer.referees && currentFarmer.referees.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Referee Information</Text>
            {currentFarmer.referees.map((referee, index) => (
              <View key={index} style={styles.refereeCard}>
                <Text style={styles.refereeTitle}>Referee {index + 1}</Text>
                <InfoItem label="Name" value={`${referee.firstName} ${referee.lastName}`} />
                <InfoItem label="Phone" value={referee.phone} />
                <InfoItem label="Relationship" value={referee.relationship} />
              </View>
            ))}
          </View>
        )}

        {/* Farm Information - Legacy support for old data structure */}
        {currentFarmer.farmInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legacy Farm Information</Text>
            <View style={styles.infoGrid}>
              <InfoItem label="Farm Size" value={`${currentFarmer.farmInfo.farmSize} hectares`} />
              <InfoItem label="Primary Crop" value={currentFarmer.farmInfo.primaryCrop} />
              <InfoItem label="Secondary Crop" value={currentFarmer.farmInfo.secondaryCrop} />
              <InfoItem label="Farming Experience" value={`${currentFarmer.farmInfo.farmingExperience} years`} />
              {currentFarmer.farmInfo.latitude && currentFarmer.farmInfo.longitude && (
                <InfoItem 
                  label="Coordinates" 
                  value={`${currentFarmer.farmInfo.latitude}, ${currentFarmer.farmInfo.longitude}`}
                  fullWidth 
                />
              )}
            </View>
          </View>
        )}

        {/* QR Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR Code</Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={JSON.stringify({
                nin: currentFarmer.nin,
                name: `${currentFarmer.firstName} ${currentFarmer.lastName}`,
                phone: currentFarmer.phone,
                registrationDate: currentFarmer.createdAt,
                farmsCount: farmerFarms.length,
              })}
              size={150}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const InfoItem = ({ label, value, fullWidth = false }) => (
  <View style={[styles.infoItem, fullWidth && styles.fullWidth]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || 'N/A'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  nin: {
    fontSize: 16,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    marginRight: 4,
  },
  addFarmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 2,
  },
  certificateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17a2b8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 2,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    marginLeft: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 12,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  refereeCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  refereeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addFarmButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  addFarmButtonText: {
    color: '#28a745',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  farmCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  farmTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 12,
  },
  farmDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  coordinates: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    fontStyle: 'italic',
  },
  polygonSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  polygonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  polygonMapContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingFarms: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noFarms: {
    alignItems: 'center',
    padding: 40,
  },
  noFarmsText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 8,
    fontWeight: '500',
  },
  noFarmsSubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default FarmerDetailsScreen;
