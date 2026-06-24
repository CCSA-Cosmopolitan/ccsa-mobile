import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { agentService } from '../services/agentService';
import { useAuth } from '../store/AuthContext';

const EditProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    whatsAppNumber: '',
    nin: '',
    bvn: '',
    address: '',
    state: '',
    localGovernment: '',
    ward: '',
    pollingUnit: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    photoUrl: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await agentService.getProfile();
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        whatsAppNumber: data.whatsAppNumber || '',
        nin: data.nin || '',
        bvn: data.bvn || '',
        address: data.address || '',
        state: data.state || '',
        localGovernment: data.localGovernment || '',
        ward: data.ward || '',
        pollingUnit: data.pollingUnit || '',
        bankName: data.bankName || '',
        accountName: data.accountName || '',
        accountNumber: data.accountNumber || '',
        photoUrl: data.photoUrl || '',
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setFormData(prev => ({ ...prev, photoUrl: uri })); // Temporary display
        uploadPhoto(uri);
      }
    } catch (error) {
      console.log('Error picking image', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadPhoto = async (uri) => {
    try {
      setSaving(true);
      const res = await agentService.uploadPhoto(uri);
      setFormData(prev => ({ ...prev, photoUrl: res.url }));
      Alert.alert('Success', 'Photo uploaded successfully');
    } catch (error) {
      Alert.alert('Upload Error', error.message || 'Failed to upload photo');
      // Revert temporary photo
      setFormData(prev => ({ ...prev, photoUrl: '' }));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await agentService.updateProfile(formData);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoContainer} onPress={handlePickImage}>
            {formData.photoUrl ? (
              <Image source={{ uri: formData.photoUrl }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={40} color="#ccc" />
                <Text style={styles.photoText}>Add Photo</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(val) => handleChange('firstName', val)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(val) => handleChange('lastName', val)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(val) => handleChange('phone', val)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>WhatsApp Number</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={formData.whatsAppNumber}
              onChangeText={(val) => handleChange('whatsAppNumber', val)}
            />
          </View>
        </View>

        {/* Identity & Financial */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity & Financial</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NIN</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              maxLength={11}
              value={formData.nin}
              onChangeText={(val) => handleChange('nin', val.replace(/\D/g, ''))}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>BVN</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              maxLength={11}
              value={formData.bvn}
              onChangeText={(val) => handleChange('bvn', val.replace(/\D/g, ''))}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank Name</Text>
            <TextInput
              style={styles.input}
              value={formData.bankName}
              onChangeText={(val) => handleChange('bankName', val)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Name</Text>
            <TextInput
              style={styles.input}
              value={formData.accountName}
              onChangeText={(val) => handleChange('accountName', val)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              maxLength={10}
              value={formData.accountNumber}
              onChangeText={(val) => handleChange('accountNumber', val.replace(/\D/g, ''))}
            />
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Info</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={formData.state}
              onChangeText={(val) => handleChange('state', val)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>LGA</Text>
            <TextInput
              style={styles.input}
              value={formData.localGovernment}
              onChangeText={(val) => handleChange('localGovernment', val)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ward</Text>
            <TextInput
              style={styles.input}
              value={formData.ward}
              onChangeText={(val) => handleChange('ward', val)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Polling Unit</Text>
            <TextInput
              style={styles.input}
              value={formData.pollingUnit}
              onChangeText={(val) => handleChange('pollingUnit', val)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={2}
              value={formData.address}
              onChangeText={(val) => handleChange('address', val)}
            />
          </View>
        </View>

      </ScrollView>

      {/* Save Button Fixed at Bottom */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for footer
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007bff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#82b7f5',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;
