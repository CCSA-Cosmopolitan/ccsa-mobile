import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import brand from '../theme/brand';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { agribusinessService } from '../services/agribusinessService';

import CustomSelect from '../components/common/CustomSelect';
import StateSelect from '../components/common/StateSelect';
import LGASelect from '../components/common/LGASelect';
import WardSelect from '../components/common/WardSelect';
import PollingUnitSelect from '../components/common/PollingUnitSelect';
import PhoneVerificationModal from '../components/common/PhoneVerificationModal';

const INTEREST_AREAS = [
  'Input supply', 'Off-take', 'Finance', 'Insurance',
  'Training', 'Processing', 'Logistics', 'Market access',
  'Storage/Warehousing', 'Mechanization', 'Export', 'Quality Control',
  'Technology/Data', 'Packaging'
];

const BUSINESS_TYPES = [
  { label: 'Aggregator', value: 'Aggregator' },
  { label: 'Processor', value: 'Processor' },
  { label: 'Input Supplier', value: 'Input Supplier' },
  { label: 'Logistics/Transport', value: 'Logistics/Transport' },
  { label: 'Storage Facility', value: 'Storage Facility' },
  { label: 'Financial Services', value: 'Financial Services' },
  { label: 'Equipment Vendor', value: 'Equipment Vendor' },
  { label: 'Consultant', value: 'Consultant' },
  { label: 'Off-Taker', value: 'Off-Taker' },
];

const schema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  businessType: z.string().min(2, 'Business type is required'),
  registrationNumber: z.string().optional(),
  tin: z.string().optional(),
  contactName: z.string().min(2, 'Contact name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number is required'),
  state: z.string().min(2, 'State is required'),
  lga: z.string().min(2, 'LGA is required'),
  ward: z.string().min(2, 'Ward is required'),
  pollingUnit: z.string().min(2, 'Polling unit is required'),
  address: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  servicesOffered: z.string().optional(),
  documentUrls: z.array(z.string()).optional(),
});

export default function AgriBusinessLeadFormScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [documentImage, setDocumentImage] = useState(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: '',
      businessType: '',
      registrationNumber: '',
      tin: '',
      contactName: '',
      email: '',
      phone: '',
      state: '',
      lga: '',
      ward: '',
      pollingUnit: '',
      address: '',
      latitude: null,
      longitude: null,
      interests: [],
      servicesOffered: '',
      documentUrls: [],
    }
  });

  const interestsWatch = watch('interests');
  const selectedState = watch('state');
  const selectedLGA = watch('lga');
  const selectedWard = watch('ward');
  const watchedPhone = watch('phone');

  useEffect(() => {
    // reset verification if phone changes
    setIsPhoneVerified(false);
  }, [watchedPhone]);

  useEffect(() => {
    if (selectedState) {
      setValue('lga', '');
      setValue('ward', '');
      setValue('pollingUnit', '');
    }
  }, [selectedState, setValue]);

  useEffect(() => {
    if (selectedLGA) {
      setValue('ward', '');
      setValue('pollingUnit', '');
    }
  }, [selectedLGA, setValue]);

  useEffect(() => {
    if (selectedWard) {
      setValue('pollingUnit', '');
    }
  }, [selectedWard, setValue]);

  const toggleInterest = (interest) => {
    const current = interestsWatch || [];
    if (current.includes(interest)) {
      setValue('interests', current.filter(i => i !== interest));
    } else {
      setValue('interests', [...current, interest]);
    }
  };

  const captureDocument = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required to capture documents.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setDocumentImage(result.assets[0].uri);
        extractDataFromImage(result.assets[0].base64);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const extractDataFromImage = async (base64String) => {
    setAiLoading(true);
    try {
      const extracted = await agribusinessService.extractKybFromImage(base64String);
      
      if (extracted) {
        if (extracted.businessName) setValue('businessName', extracted.businessName);
        if (extracted.cacNumber) setValue('registrationNumber', extracted.cacNumber);
        if (extracted.tin) setValue('tin', extracted.tin);
        if (extracted.contactName) setValue('contactName', extracted.contactName);
        if (extracted.address) setValue('address', extracted.address);
        if (extracted.servicesOffered) setValue('servicesOffered', extracted.servicesOffered);
        
        Alert.alert('Success', 'Document details extracted successfully! Please review the auto-filled fields.');
      }
    } catch (error) {
      Alert.alert('Extraction Failed', error.message || 'Could not extract data from the document. Please enter manually.');
    } finally {
      setAiLoading(false);
    }
  };

  const captureLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required.');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setValue('latitude', location.coords.latitude);
      setValue('longitude', location.coords.longitude);
      
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      if (geocode && geocode.length > 0) {
        if (geocode[0].region) setValue('state', geocode[0].region);
        if (geocode[0].city || geocode[0].district) setValue('lga', geocode[0].city || geocode[0].district);
        if (geocode[0].street) setValue('address', `${geocode[0].street}, ${geocode[0].city || ''}`);
      }

      Alert.alert('Location Captured', 'GPS Coordinates captured successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to capture location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!isPhoneVerified) {
      Alert.alert('Verification Required', 'Please verify phone number before submitting.');
      return;
    }

    setLoading(true);
    try {
      await agribusinessService.submitAgribusinessLead(data);

      Alert.alert('Success', 'Agri-Business lead captured successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const ErrorText = ({ name }) => {
    return errors[name] ? <Text style={styles.errorText}>{errors[name].message}</Text> : null;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={24} color={brand.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Capture Lead</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Document Capture & AI Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart Capture (AI)</Text>
          <Text style={styles.sectionDesc}>Take a photo of a CAC document or business card to auto-fill details.</Text>
          
          {documentImage && (
            <Image source={{ uri: documentImage }} style={styles.previewImage} />
          )}

          <TouchableOpacity 
            style={[styles.actionButton, styles.aiButton]} 
            onPress={captureDocument}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <ActivityIndicator color={brand.colors.white} />
            ) : (
              <>
                <Ionicons name="camera" size={20} color={brand.colors.white} />
                <Text style={styles.actionButtonText}>Capture Document</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Business Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Info</Text>
          
          <Text style={styles.label}>Business Name *</Text>
          <Controller
            control={control}
            name="businessName"
            render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder="e.g. Green Harvest Ltd" />
            )}
          />
          <ErrorText name="businessName" />

          <Text style={styles.label}>Business Type *</Text>
          <Controller
            control={control}
            name="businessType"
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                options={BUSINESS_TYPES}
                selectedValue={value}
                onValueChange={onChange}
                placeholder="Select Business Type"
                error={!!errors.businessType}
              />
            )}
          />
          <ErrorText name="businessType" />

          <Text style={styles.label}>CAC/Registration Number</Text>
          <Controller
            control={control}
            name="registrationNumber"
            render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder="RC-123456" />
            )}
          />

          <Text style={styles.label}>TIN (Tax Identification)</Text>
          <Controller
            control={control}
            name="tin"
            render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder="TIN Number" />
            )}
          />

          <Text style={styles.label}>Services / Products Offered</Text>
          <Controller
            control={control}
            name="servicesOffered"
            render={({ field: { onChange, value } }) => (
              <TextInput style={[styles.input, { minHeight: 80 }]} value={value} onChangeText={onChange} placeholder="Describe products, crops, or services offered..." multiline />
            )}
          />
        </View>

        {/* Contact Person Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          
          <Text style={styles.label}>Contact Name *</Text>
          <Controller
            control={control}
            name="contactName"
            render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder="Full Name" />
            )}
          />
          <ErrorText name="contactName" />

          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
            )}
          />
          <ErrorText name="email" />

          <Text style={styles.label}>Phone *</Text>
          <View style={styles.inputWithVerifyRow}>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <TextInput style={[styles.input, styles.flex1]} value={value} onChangeText={onChange} placeholder="080..." keyboardType="phone-pad" />
              )}
            />
            {isPhoneVerified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color={brand.colors.success} />
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.verifyButton}
                onPress={() => setPhoneModalVisible(true)}
              >
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>
            )}
          </View>
          <ErrorText name="phone" />
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.locationButton]} 
            onPress={captureLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator color={brand.colors.primary} />
            ) : (
              <>
                <Ionicons name="location" size={20} color={brand.colors.primary} />
                <Text style={[styles.actionButtonText, { color: brand.colors.primary }]}>Capture GPS Location</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.locationHelp}>
            {watch('latitude') ? `Captured: ${watch('latitude').toFixed(5)}, ${watch('longitude').toFixed(5)}` : 'No coordinates captured'}
          </Text>

          <View>
            <Text style={styles.label}>State *</Text>
            <Controller
              control={control}
              name="state"
              render={({ field: { onChange, value } }) => (
                <StateSelect
                  selectedValue={value}
                  onValueChange={onChange}
                  placeholder="Select State"
                  error={!!errors.state}
                />
              )}
            />
            <ErrorText name="state" />
          </View>

          <View>
            <Text style={styles.label}>LGA *</Text>
            <Controller
              control={control}
              name="lga"
              render={({ field: { onChange, value } }) => (
                <LGASelect
                  selectedState={selectedState}
                  selectedValue={value}
                  onValueChange={onChange}
                  placeholder="Select LGA"
                  error={!!errors.lga}
                />
              )}
            />
            <ErrorText name="lga" />
          </View>

          <View>
            <Text style={styles.label}>Ward *</Text>
            <Controller
              control={control}
              name="ward"
              render={({ field: { onChange, value } }) => (
                <WardSelect
                  selectedState={selectedState}
                  selectedLGA={selectedLGA}
                  selectedValue={value}
                  onValueChange={onChange}
                  placeholder="Select Ward"
                  error={!!errors.ward}
                />
              )}
            />
            <ErrorText name="ward" />
          </View>

          <View>
            <Text style={styles.label}>Polling Unit *</Text>
            <Controller
              control={control}
              name="pollingUnit"
              render={({ field: { onChange, value } }) => (
                <PollingUnitSelect
                  selectedState={selectedState}
                  selectedLGA={selectedLGA}
                  selectedWard={selectedWard}
                  selectedValue={value}
                  onValueChange={onChange}
                  placeholder="Select Polling Unit"
                  error={!!errors.pollingUnit}
                />
              )}
            />
            <ErrorText name="pollingUnit" />
          </View>
          
          <Text style={styles.label}>Address</Text>
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder="Full physical address" multiline />
            )}
          />
        </View>

        {/* Interests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests *</Text>
          <ErrorText name="interests" />
          <View style={styles.chips}>
            {INTEREST_AREAS.map((item) => {
              const selected = interestsWatch?.includes(item);
              return (
                <TouchableOpacity 
                  key={item} 
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleInterest(item)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleSubmit(onSubmit)} 
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={brand.colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={brand.colors.white} />
              <Text style={styles.primaryButtonText}>Submit Lead</Text>
            </>
          )}
        </TouchableOpacity>
        
      </ScrollView>
      <PhoneVerificationModal 
        visible={phoneModalVisible}
        phoneNumber={watchedPhone}
        onVerificationComplete={() => {
          setIsPhoneVerified(true);
          setPhoneModalVisible(false);
        }}
        onCancel={() => setPhoneModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.colors.offWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: brand.colors.primary,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    color: brand.colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  content: { padding: 20, paddingBottom: 40 },
  section: {
    backgroundColor: brand.colors.white,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: brand.colors.primaryLight,
    marginBottom: 16,
  },
  sectionTitle: { color: brand.colors.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sectionDesc: { color: brand.colors.darkGray, fontSize: 13, marginBottom: 16 },
  label: { color: brand.colors.darkGray, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: brand.colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: brand.colors.text,
  },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: brand.colors.primaryExtraLight,
    borderWidth: 1,
    borderColor: brand.colors.primaryLight,
  },
  chipSelected: {
    backgroundColor: brand.colors.primary,
    borderColor: brand.colors.primaryDark,
  },
  chipText: { color: brand.colors.primary, fontSize: 12, fontWeight: '700' },
  chipTextSelected: { color: brand.colors.white },
  primaryButton: {
    backgroundColor: brand.colors.primary,
    borderRadius: 12,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  primaryButtonText: { color: brand.colors.white, fontSize: 15, fontWeight: '800' },
  actionButton: {
    borderRadius: 8,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  aiButton: {
    backgroundColor: '#8b5cf6', // A purple tone for AI
  },
  locationButton: {
    backgroundColor: brand.colors.primaryExtraLight,
    borderWidth: 1,
    borderColor: brand.colors.primaryLight,
    marginTop: 12,
  },
  actionButtonText: { color: brand.colors.white, fontSize: 14, fontWeight: '700' },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  locationHelp: {
    color: brand.colors.darkGray,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  inputWithVerifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  verifyButton: {
    backgroundColor: brand.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: brand.colors.primary,
  },
  verifyButtonText: {
    color: brand.colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  verifiedBadge: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
