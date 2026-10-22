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
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  { label: 'Select Business Type', value: '' },
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
  contactName: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  state: z.string().min(2, 'State is required'),
  lga: z.string().min(2, 'LGA is required'),
  ward: z.string().min(2, 'Ward is required'),
  pollingUnit: z.string().min(2, 'Polling unit is required'),
  address: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  interests: z.array(z.string()).min(1, 'Select at least one interest area'),
  servicesOffered: z.string().optional(),
  documentUrls: z.array(z.string()).optional(),
});

const STEPS = [
  { id: 1, title: 'Business Info', subtitle: 'Company profile & registration' },
  { id: 2, title: 'Contact Person', subtitle: 'Representative & phone verification' },
  { id: 3, title: 'Location & GPS', subtitle: 'Operational address & coordinates' },
  { id: 4, title: 'Value Chain', subtitle: 'Interests & service offerings' },
];

export default function AgriBusinessLeadFormScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [documentImage, setDocumentImage] = useState(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);

  const { control, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm({
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

  const interestsWatch = watch('interests') || [];
  const selectedState = watch('state');
  const selectedLGA = watch('lga');
  const selectedWard = watch('ward');
  const watchedPhone = watch('phone');
  const watchedLat = watch('latitude');
  const watchedLng = watch('longitude');

  useEffect(() => {
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
    if (interestsWatch.includes(interest)) {
      setValue('interests', interestsWatch.filter(i => i !== interest));
    } else {
      setValue('interests', [...interestsWatch, interest]);
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
        Alert.alert('Document Processed', 'Business details extracted successfully! Please review the auto-filled fields.');
      }
    } catch (error) {
      Alert.alert('Extraction Notice', error.message || 'Could not auto-extract data. Please fill details manually.');
    } finally {
      setAiLoading(false);
    }
  };

  const captureLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is required to capture coordinates.');
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

      Alert.alert('Location Secured', 'GPS coordinates and address recorded successfully.');
    } catch (error) {
      Alert.alert('GPS Error', 'Failed to capture GPS location. You can enter address manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const getStepFields = (step) => {
    switch (step) {
      case 1:
        return ['businessName', 'businessType'];
      case 2:
        return ['contactName', 'phone'];
      case 3:
        return ['state', 'lga', 'ward', 'pollingUnit'];
      case 4:
        return ['interests'];
      default:
        return [];
    }
  };

  const handleNext = async () => {
    const fields = getStepFields(currentStep);
    const valid = await trigger(fields);
    if (!valid) return;

    if (currentStep === 2 && !isPhoneVerified) {
      Alert.alert(
        'Phone Verification Required',
        'Please verify the primary contact phone number before continuing to location details.',
        [
          { text: 'Verify Now', onPress: () => setPhoneModalVisible(true) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data) => {
    if (!isPhoneVerified) {
      Alert.alert('Verification Required', 'Please verify contact phone number before submitting.');
      return;
    }

    setLoading(true);
    try {
      await agribusinessService.submitAgribusinessLead(data);
      Alert.alert('Registration Successful', 'Agri-Business enterprise onboarded successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Submission Error', error.message || 'Failed to submit agri-business lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header with Progress Bar matching AddFarmerScreen */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
              <Ionicons name="arrow-back" size={22} color="#1f2937" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Agri-Business Enrollment</Text>
              <Text style={styles.stepText}>
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentStep / STEPS.length) * 100}%` }
                ]}
              />
            </View>
          </View>
        </View>

        {/* Content Body */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* ──── STEP 1: BUSINESS INFO & SMART OCR ──── */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <Ionicons name="business-outline" size={48} color="#013358" />
                <Text style={styles.stepTitle}>Enterprise Details</Text>
                <Text style={styles.stepDesc}>
                  Enter the commercial enterprise information or scan CAC certificate for auto-fill.
                </Text>
              </View>

              {/* Smart Document Scan Card */}
              <View style={styles.smartCard}>
                <View style={styles.smartHeader}>
                  <View style={styles.smartBadge}>
                    <Ionicons name="sparkles" size={14} color="#013358" />
                    <Text style={styles.smartBadgeText}>SMART ONBOARDING</Text>
                  </View>
                  <Text style={styles.smartTitle}>Document Auto-Fill</Text>
                  <Text style={styles.smartDesc}>
                    Capture CAC certificate or tax clearance to populate registration numbers and addresses.
                  </Text>
                </View>

                {documentImage && (
                  <Image source={{ uri: documentImage }} style={styles.docPreview} />
                )}

                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={captureDocument}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                      <Text style={styles.scanButtonText}>
                        {documentImage ? 'Scan Another Document' : 'Capture Business Document'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Business Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business / Enterprise Name *</Text>
                <Controller
                  control={control}
                  name="businessName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputContainer, errors.businessName && styles.inputError]}>
                      <Ionicons name="briefcase-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Savannah Agri Processing Ltd"
                        placeholderTextColor="#9ca3af"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    </View>
                  )}
                />
                {errors.businessName && <Text style={styles.errorText}>{errors.businessName.message}</Text>}
              </View>

              {/* Business Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Category / Type *</Text>
                <Controller
                  control={control}
                  name="businessType"
                  render={({ field: { onChange, value } }) => (
                    <CustomSelect
                      label=""
                      options={BUSINESS_TYPES}
                      selectedValue={value || ''}
                      onValueChange={onChange}
                      placeholder="Select Business Category"
                      error={!!errors.businessType}
                    />
                  )}
                />
                {errors.businessType && <Text style={styles.errorText}>{errors.businessType.message}</Text>}
              </View>

              {/* Registration Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CAC Registration Number (Optional)</Text>
                <Controller
                  control={control}
                  name="registrationNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <Ionicons name="document-text-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. RC-1849204"
                        placeholderTextColor="#9ca3af"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="characters"
                      />
                    </View>
                  )}
                />
              </View>

              {/* Tax Identification Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tax Identification Number (TIN) (Optional)</Text>
                <Controller
                  control={control}
                  name="tin"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <Ionicons name="card-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 29384729-0001"
                        placeholderTextColor="#9ca3af"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                />
              </View>
            </View>
          )}

          {/* ──── STEP 2: CONTACT & VERIFICATION ──── */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <Ionicons name="person-circle-outline" size={48} color="#013358" />
                <Text style={styles.stepTitle}>Representative & Verification</Text>
                <Text style={styles.stepDesc}>
                  Enter the authorized primary representative and verify their mobile number.
                </Text>
              </View>

              {/* Contact Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name of Primary Contact *</Text>
                <Controller
                  control={control}
                  name="contactName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputContainer, errors.contactName && styles.inputError]}>
                      <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Ibrahim Abubakar"
                        placeholderTextColor="#9ca3af"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    </View>
                  )}
                />
                {errors.contactName && <Text style={styles.errorText}>{errors.contactName.message}</Text>}
              </View>

              {/* Phone Number with Verification */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Phone Number *</Text>
                  {isPhoneVerified ? (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      <Text style={styles.verifiedText}>VERIFIED</Text>
                    </View>
                  ) : (
                    <Text style={styles.unverifiedText}>Verification Required</Text>
                  )}
                </View>

                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                      <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 08012345678"
                        placeholderTextColor="#9ca3af"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="phone-pad"
                      />
                      {value && value.length >= 10 && !isPhoneVerified && (
                        <TouchableOpacity
                          style={styles.verifyBtn}
                          onPress={() => setPhoneModalVisible(true)}
                        >
                          <Text style={styles.verifyBtnText}>Verify</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
              </View>

              {/* Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Corporate / Official Email (Optional)</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                      <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. contact@enterprise.ng"
                        placeholderTextColor="#9ca3af"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  )}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
              </View>
            </View>
          )}

          {/* ──── STEP 3: LOCATION & GPS ──── */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <Ionicons name="location-outline" size={48} color="#013358" />
                <Text style={styles.stepTitle}>Location & Coordinates</Text>
                <Text style={styles.stepDesc}>
                  Map the physical facility or operational hub using GPS coordinates.
                </Text>
              </View>

              {/* GPS Capture Card */}
              <View style={styles.gpsCard}>
                <View style={styles.gpsRow}>
                  <Ionicons name="navigate-circle" size={32} color="#013358" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.gpsTitle}>Facility GPS Geopoint</Text>
                    <Text style={styles.gpsDesc}>
                      {watchedLat && watchedLng
                        ? `Lat: ${watchedLat.toFixed(5)}, Lng: ${watchedLng.toFixed(5)}`
                        : 'No coordinates pinned yet'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.gpsButton}
                    onPress={captureLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="pin" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.gpsButtonText}>
                          {watchedLat ? 'Re-pin' : 'Capture'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* State */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>State *</Text>
                <Controller
                  control={control}
                  name="state"
                  render={({ field: { onChange, value } }) => (
                    <StateSelect
                      selectedValue={value}
                      onValueChange={onChange}
                      error={!!errors.state}
                    />
                  )}
                />
                {errors.state && <Text style={styles.errorText}>{errors.state.message}</Text>}
              </View>

              {/* LGA */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Local Government Area (LGA) *</Text>
                <Controller
                  control={control}
                  name="lga"
                  render={({ field: { onChange, value } }) => (
                    <LGASelect
                      state={selectedState}
                      selectedValue={value}
                      onValueChange={onChange}
                      error={!!errors.lga}
                    />
                  )}
                />
                {errors.lga && <Text style={styles.errorText}>{errors.lga.message}</Text>}
              </View>

              {/* Ward */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ward *</Text>
                <Controller
                  control={control}
                  name="ward"
                  render={({ field: { onChange, value } }) => (
                    <WardSelect
                      state={selectedState}
                      lga={selectedLGA}
                      selectedValue={value}
                      onValueChange={onChange}
                      error={!!errors.ward}
                    />
                  )}
                />
                {errors.ward && <Text style={styles.errorText}>{errors.ward.message}</Text>}
              </View>

              {/* Polling Unit */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Polling Unit *</Text>
                <Controller
                  control={control}
                  name="pollingUnit"
                  render={({ field: { onChange, value } }) => (
                    <PollingUnitSelect
                      state={selectedState}
                      lga={selectedLGA}
                      ward={selectedWard}
                      selectedValue={value}
                      onValueChange={onChange}
                      error={!!errors.pollingUnit}
                    />
                  )}
                />
                {errors.pollingUnit && <Text style={styles.errorText}>{errors.pollingUnit.message}</Text>}
              </View>

              {/* Street Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Street / Landmark Address</Text>
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <Ionicons name="map-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Km 12 Zaria Road, Near Central Grain Market"
                        placeholderTextColor="#9ca3af"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    </View>
                  )}
                />
              </View>
            </View>
          )}

          {/* ──── STEP 4: INTERESTS & OFFERINGS ──── */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <Ionicons name="pricetags-outline" size={48} color="#013358" />
                <Text style={styles.stepTitle}>Interests & Value Chain</Text>
                <Text style={styles.stepDesc}>
                  Select areas of collaboration and describe products or services offered.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Collaboration / Business Interests *</Text>
                <Text style={styles.fieldHint}>Select all operational areas that apply to this partner:</Text>
                <View style={styles.chipsContainer}>
                  {INTEREST_AREAS.map((interest) => {
                    const isSelected = interestsWatch.includes(interest);
                    return (
                      <TouchableOpacity
                        key={interest}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => toggleInterest(interest)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                          size={16}
                          color={isSelected ? '#ffffff' : '#475569'}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {interest}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.interests && <Text style={styles.errorText}>{errors.interests.message}</Text>}
              </View>

              {/* Services Offered */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Products & Services Description (Optional)</Text>
                <Controller
                  control={control}
                  name="servicesOffered"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputContainer, styles.textAreaContainer]}>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Detail the capacity, crops aggregated, warehousing tons, or inputs distributed..."
                        placeholderTextColor="#9ca3af"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>
                  )}
                />
              </View>

              {/* Summary Review Card */}
              <View style={styles.reviewCard}>
                <Text style={styles.reviewTitle}>Registration Summary</Text>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Enterprise:</Text>
                  <Text style={styles.reviewValue}>{watch('businessName') || '—'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Category:</Text>
                  <Text style={styles.reviewValue}>{watch('businessType') || '—'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Contact:</Text>
                  <Text style={styles.reviewValue}>{watch('contactName')} ({watch('phone')})</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Location:</Text>
                  <Text style={styles.reviewValue}>
                    {[watch('ward'), watch('lga'), watch('state')].filter(Boolean).join(', ') || '—'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Navigation Footer */}
        <View style={styles.navigation}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handlePrev}>
              <Ionicons name="arrow-back" size={20} color="#6b7280" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <View style={styles.navigationRight}>
            {currentStep < STEPS.length ? (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Enroll Enterprise</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Phone Verification Modal */}
        <PhoneVerificationModal
          visible={phoneModalVisible}
          phone={watchedPhone}
          onSuccess={() => {
            setIsPhoneVerified(true);
            setPhoneModalVisible(false);
            Alert.alert('Verified', 'Phone number verified successfully.');
          }}
          onClose={() => setPhoneModalVisible(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  stepText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#013358',
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  stepContainer: {
    paddingBottom: 24,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  smartCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  smartHeader: {
    marginBottom: 12,
  },
  smartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
    gap: 4,
  },
  smartBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#013358',
    letterSpacing: 0.5,
  },
  smartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  smartDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  docPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#013358',
    paddingVertical: 12,
    borderRadius: 10,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  gpsCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  gpsDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#013358',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  gpsButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fieldHint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  unverifiedText: {
    color: '#d97706',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    minHeight: 54,
  },
  inputIcon: {
    marginLeft: 14,
    marginRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  verifyBtn: {
    backgroundColor: '#013358',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipSelected: {
    backgroundColor: '#013358',
    borderColor: '#013358',
  },
  chipText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  textAreaContainer: {
    minHeight: 110,
    alignItems: 'flex-start',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  reviewLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  navigationRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#013358',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#ffffff',
    marginRight: 8,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});
