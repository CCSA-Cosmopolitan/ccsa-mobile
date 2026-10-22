import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { generateHouseNumber } from '../../utils/houseNumberGenerator';
import { householdService } from '../../services/householdService';
import { ninService } from '../../services/ninService';
import { lazyLocationService } from '../../services/lazyLocationService';
import StateSelect from '../../components/common/StateSelect';
import LGASelect from '../../components/common/LGASelect';
import WardSelect from '../../components/common/WardSelect';
import PollingUnitSelect from '../../components/common/PollingUnitSelect';
import CustomSelect from '../../components/common/CustomSelect';
import PhoneVerificationModal from '../../components/common/PhoneVerificationModal';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
];

const MARITAL_STATUS_OPTIONS = [
  { label: 'Married', value: 'MARRIED' },
  { label: 'Single', value: 'SINGLE' },
  { label: 'Widowed', value: 'WIDOWED' },
  { label: 'Divorced', value: 'DIVORCED' },
];

const EMPLOYMENT_OPTIONS = [
  { label: 'Employed', value: 'EMPLOYED' },
  { label: 'Self-employed', value: 'SELF_EMPLOYED' },
  { label: 'Unemployed', value: 'UNEMPLOYED' },
  { label: 'Retired', value: 'RETIRED' },
  { label: 'Student', value: 'STUDENT' },
];

const EDUCATION_OPTIONS = [
  { label: 'No formal education', value: 'NONE' },
  { label: 'Primary', value: 'PRIMARY' },
  { label: 'Secondary', value: 'SECONDARY' },
  { label: 'Tertiary', value: 'TERTIARY' },
  { label: 'Postgraduate', value: 'POSTGRADUATE' },
];

const TELCO_OPTIONS = ['MTN', 'Airtel', 'Glo', '9mobile'];
const NETWORK_TYPES = ['2G', '3G', '4G', '5G'];
const PUE_TYPES = [
  { label: 'Milling / Grinding', value: 'Milling' },
  { label: 'Solar Water Pumping / Irrigation', value: 'Water Pumping' },
  { label: 'Cold Storage / Chilling Hub', value: 'Cold Storage' },
  { label: 'Grain / Produce Drying', value: 'Drying' },
  { label: 'Welding / Fabrication', value: 'Welding' },
  { label: 'Tailoring / Sewing Centre', value: 'Tailoring' },
  { label: 'Hair Dressing / Barbing Salon', value: 'Salon' },
  { label: 'Commercial Battery / Device Charging', value: 'Charging Station' },
  { label: 'Retail / General Commercial Hub', value: 'Retail' },
];

const ENERGY_SOURCES = [
  { label: 'Solar Mini-Grid', value: 'Solar Mini-Grid' },
  { label: 'Solar Home System (SHS)', value: 'Solar Home System' },
  { label: 'National Grid (DisCo)', value: 'National Grid' },
  { label: 'Petrol / Diesel Generator', value: 'Generator' },
  { label: 'None / Biomass / Kerosene', value: 'None' },
];

const STEPS = [
  { id: 1, title: 'NIN Verification' },
  { id: 2, title: 'Personal Details' },
  { id: 3, title: 'Location' },
  { id: 4, title: 'Family Members' },
  { id: 5, title: 'Connectivity & Energy' },
];

const MIN_AGE = 18;
const GPS_WARN_METERS = 100;

// ── Helpers ──
const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const v = String(value).trim();
  // dd-mm-yyyy or dd/mm/yyyy
  const dmy = v.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  const d = dmy ? new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])) : new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const calcAge = (value?: string | null): number | null => {
  const d = parseDate(value);
  if (!d) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
};

const formatDate = (value?: string | null) => {
  const d = parseDate(value);
  return d
    ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : value || '';
};

const pretty = (value?: string | null) =>
  (value || '')
    .replace(/[-_]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const labelFor = (options: { label: string; value: string }[], value?: string | null) =>
  options.find((o) => o.value === (value || '').toUpperCase().replace(/[\s-]+/g, '_'))?.label ||
  pretty(value);

const norm = (s?: string | null) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export default function HouseholdCaptureScreen({ navigation }: { navigation: any }) {
  const [currentStep, setCurrentStep] = useState(1);

  // ── Step 1: NIN ──
  const [ninInput, setNinInput] = useState('');
  const [validatingNin, setValidatingNin] = useState(false);
  const [ninVerified, setNinVerified] = useState(false);
  const [ninData, setNinData] = useState<any>(null);

  // ── Step 2: Personal ──
  const [headFirstName, setHeadFirstName] = useState('');
  const [headMiddleName, setHeadMiddleName] = useState('');
  const [headLastName, setHeadLastName] = useState('');
  const [headPhone, setHeadPhone] = useState('');
  const [headPhoneVerified, setHeadPhoneVerified] = useState(false);
  const [showPhoneVerificationModal, setShowPhoneVerificationModal] = useState(false);
  const [phoneVerificationSkipped, setPhoneVerificationSkipped] = useState(false);
  const [headEmail, setHeadEmail] = useState('');
  const [headGender, setHeadGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [headDateOfBirth, setHeadDateOfBirth] = useState('');
  const [headMaritalStatus, setHeadMaritalStatus] = useState('MARRIED');
  const [headEmployment, setHeadEmployment] = useState('');
  const [headEducation, setHeadEducation] = useState('');
  const [headPhotoUrl, setHeadPhotoUrl] = useState<string | null>(null);

  // ── Step 3: Location ──
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationCapturedAt, setLocationCapturedAt] = useState<string | null>(null);
  const [gpsAddress, setGpsAddress] = useState('');
  const [locating, setLocating] = useState(false);
  const autoLocateTried = useRef(false);

  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [ward, setWard] = useState('');
  const [pollingUnit, setPollingUnit] = useState('');
  const [address, setAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const houseSeq = useRef<number>(Math.floor(1 + Math.random() * 998));
  const [houseFrontPhoto, setHouseFrontPhoto] = useState<string | null>(null);

  // ── Step 4: Family ──
  const [wivesCount, setWivesCount] = useState('0');
  const [childrenCount, setChildrenCount] = useState('0');
  const [otherDependentsCount, setOtherDependentsCount] = useState('0');
  const [dependentsNotes, setDependentsNotes] = useState('');

  // ── Step 5: Connectivity & Energy ──
  const [telcoProviders, setTelcoProviders] = useState<string[]>(['MTN']);
  const [networkType, setNetworkType] = useState('4G');
  const [commercialCustomers, setCommercialCustomers] = useState('0');
  const [hasPue, setHasPue] = useState(false);
  const [pueType, setPueType] = useState('Milling');
  const [pueEquipment, setPueEquipment] = useState('');
  const [primaryEnergySource, setPrimaryEnergySource] = useState('Solar Mini-Grid');

  const [saving, setSaving] = useState(false);

  const gpsCaptured = latitude !== null && longitude !== null;
  const age = calcAge(headDateOfBirth);

  // House number is only synthesized once GPS is pinned and the full boundary is chosen
  useEffect(() => {
    if (gpsCaptured && state && lga && ward && pollingUnit) {
      setHouseNumber(generateHouseNumber(state, lga, ward, pollingUnit, houseSeq.current));
    } else {
      setHouseNumber('');
    }
  }, [gpsCaptured, state, lga, ward, pollingUnit]);

  // Start GPS capture automatically the first time the agent reaches the location step
  useEffect(() => {
    if (currentStep === 3 && !autoLocateTried.current && !gpsCaptured) {
      autoLocateTried.current = true;
      captureLocation();
    }
  }, [currentStep]);

  const applyBoundaryGuess = async (
    stateName?: string | null,
    lgaName?: string | null
  ) => {
    try {
      if (!stateName) return;
      const states: any[] = await Promise.resolve((lazyLocationService as any).getStates());
      const target = norm(stateName).replace(/^fct|federalcapitalterritory/, 'abuja') || norm(stateName);
      const st = states.find(
        (s) => norm(s.name) === norm(stateName) || norm(s.value) === target || norm(s.name).includes(target)
      );
      if (!st) return;
      setState((prev) => prev || st.value);
      if (!lgaName) return;
      const lgas: any[] = await Promise.resolve((lazyLocationService as any).getLGAs(st.value));
      const l = lgas.find((x) => norm(x.name) === norm(lgaName));
      if (l) setLga((prev) => prev || l.value);
    } catch (e) {
      console.warn('Boundary prefill failed:', e);
    }
  };

  const captureLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission Required', 'Please allow location access to pin the dwelling.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      setAccuracy(loc.coords.accuracy ?? null);
      setLocationCapturedAt(new Date().toISOString());

      let region: string | null = null;
      let subregion: string | null = null;
      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (place) {
          const line = [place.name, place.street, place.district, place.city, place.subregion, place.region]
            .filter((p, i, arr) => p && arr.indexOf(p) === i)
            .join(', ');
          setGpsAddress(line);
          setAddress((prev) => prev || [place.name, place.street, place.district].filter(Boolean).join(', '));
          region = place.region || null;
          subregion = place.subregion || place.city || null;
        }
      } catch {
        // Geocoding is best effort (offline etc.)
      }

      if (!state) {
        if (region) {
          await applyBoundaryGuess(region, subregion);
        } else if (ninData?.residenceState) {
          await applyBoundaryGuess(ninData.residenceState, ninData.residenceLga);
        }
      }
    } catch (e: any) {
      Alert.alert('GPS Error', e?.message || 'Could not capture location. Move to open sky and try again.');
    } finally {
      setLocating(false);
    }
  };

  // ── NIN Lookup ──
  const handleNINLookup = async () => {
    const cleanedNin = ninInput.trim();
    if (!/^\d{11}$/.test(cleanedNin)) {
      Alert.alert('Invalid NIN', 'Please enter a valid 11-digit National Identification Number.');
      return;
    }

    try {
      setValidatingNin(true);
      const data = await ninService.lookupNIN(cleanedNin);

      setNinData(data);
      setNinVerified(true);

      setHeadFirstName(data.firstName || '');
      setHeadMiddleName(data.middleName || '');
      setHeadLastName(data.lastName || '');
      const dob = parseDate(data.dateOfBirth);
      setHeadDateOfBirth(dob ? toIsoDate(dob) : data.dateOfBirth || '');
      if (data.gender) setHeadGender(String(data.gender).toUpperCase().startsWith('F') ? 'FEMALE' : 'MALE');
      if (data.maritalStatus) setHeadMaritalStatus(String(data.maritalStatus).toUpperCase());
      if (data.employmentStatus) setHeadEmployment(String(data.employmentStatus).toUpperCase().replace(/[\s-]+/g, '_'));
      if (data.educationLevel) setHeadEducation(String(data.educationLevel).toUpperCase().replace(/[\s-]+/g, '_'));
      if (data.email) setHeadEmail(String(data.email).trim());

      const rawPhone = data.phone || data._rawData?.telephoneno || data._rawData?.msisdn;
      if (rawPhone) setHeadPhone(String(rawPhone).trim());
      if (data.residenceAddress && !address) setAddress(String(data.residenceAddress));
    } catch (err: any) {
      setNinVerified(false);
      setNinData(null);
      Alert.alert('NIN Verification Failed', err.message || 'Unable to verify this NIN. Check the number and try again.');
    } finally {
      setValidatingNin(false);
    }
  };

  const resetNinVerification = () => {
    setNinVerified(false);
    setNinData(null);
  };

  const handleCaptureHeadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission Required', 'Please enable camera access to capture the head of household.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        quality: 0.5,
        base64: true,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setHeadPhotoUrl(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      }
    } catch (e: any) {
      Alert.alert('Camera Error', e.message || 'Could not take photo');
    }
  };

  const handleCaptureHouseFront = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission Required', 'Please enable camera access to capture dwelling photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.6,
        base64: true,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setHouseFrontPhoto(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      }
    } catch (e: any) {
      Alert.alert('Camera Error', e.message || 'Could not take photo');
    }
  };

  const toggleTelco = (telco: string) => {
    setTelcoProviders((prev) => (prev.includes(telco) ? prev.filter((t) => t !== telco) : [...prev, telco]));
  };

  const calculatedTotalMembers =
    1 + (parseInt(wivesCount, 10) || 0) + (parseInt(childrenCount, 10) || 0) + (parseInt(otherDependentsCount, 10) || 0);

  const handleVerifyPhone = () => {
    const cleanPhone = headPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number (at least 10 digits) before sending OTP.');
      return;
    }
    setShowPhoneVerificationModal(true);
  };

  const handlePhoneVerificationComplete = () => {
    setHeadPhoneVerified(true);
    setPhoneVerificationSkipped(false);
    setShowPhoneVerificationModal(false);
  };

  const handlePhoneVerificationSkip = () => {
    setHeadPhoneVerified(false);
    setPhoneVerificationSkipped(true);
    setShowPhoneVerificationModal(false);
    Alert.alert(
      'Verification Skipped',
      'Phone number marked as Not Validated. You can proceed with registration.'
    );
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!ninVerified) {
        Alert.alert('Verification Required', 'Validate the head of household\'s NIN to continue.');
        return false;
      }
    } else if (step === 2) {
      if (!headFirstName.trim() || !headLastName.trim()) {
        Alert.alert('Required Fields', 'First and last name are required.');
        return false;
      }
      if (!parseDate(headDateOfBirth)) {
        Alert.alert('Date of Birth', 'A valid date of birth (YYYY-MM-DD) is required.');
        return false;
      }
      if (age !== null && age < MIN_AGE) {
        Alert.alert('Age Requirement', `The head of household must be at least ${MIN_AGE} years old.`);
        return false;
      }
      if (!headPhone.trim() || headPhone.replace(/\D/g, '').length < 10) {
        Alert.alert('Required Fields', 'Please enter a valid phone number.');
        return false;
      }
      if (!headPhoneVerified && !phoneVerificationSkipped) {
        Alert.alert(
          'Phone Verification',
          'This phone number has not been validated via OTP. Would you like to verify via OTP now or skip for this record?',
          [
            {
              text: 'Verify via OTP',
              onPress: handleVerifyPhone,
            },
            {
              text: 'Skip & Continue',
              style: 'destructive',
              onPress: () => {
                setPhoneVerificationSkipped(true);
                setHeadPhoneVerified(false);
                setCurrentStep(3);
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return false;
      }
      if (headEmail.trim() && !/^\S+@\S+\.\S+$/.test(headEmail.trim())) {
        Alert.alert('Email', 'Please enter a valid email address or leave it blank.');
        return false;
      }
      if (!headPhotoUrl) {
        Alert.alert('Photo Required', 'Take a current photo of the head of household.');
        return false;
      }
    } else if (step === 3) {
      if (!gpsCaptured) {
        Alert.alert('Location Required', 'Capture the dwelling GPS location before continuing.');
        return false;
      }
      if (!state || !lga || !ward || !pollingUnit) {
        Alert.alert('Location Required', 'Please select State, LGA, Ward, and Polling Unit.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < STEPS.length) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const resetForm = () => {
    setNinInput('');
    setNinVerified(false);
    setNinData(null);
    setHeadFirstName('');
    setHeadMiddleName('');
    setHeadLastName('');
    setHeadPhone('');
    setHeadPhoneVerified(false);
    setPhoneVerificationSkipped(false);
    setShowPhoneVerificationModal(false);
    setHeadEmail('');
    setHeadDateOfBirth('');
    setHeadEmployment('');
    setHeadEducation('');
    setHeadPhotoUrl(null);
    setLatitude(null);
    setLongitude(null);
    setAccuracy(null);
    setLocationCapturedAt(null);
    setGpsAddress('');
    autoLocateTried.current = false;
    houseSeq.current = Math.floor(1 + Math.random() * 998);
    setState('');
    setLga('');
    setWard('');
    setPollingUnit('');
    setAddress('');
    setHouseNumber('');
    setHouseFrontPhoto(null);
    setWivesCount('0');
    setChildrenCount('0');
    setOtherDependentsCount('0');
    setDependentsNotes('');
    setHasPue(false);
    setPueEquipment('');
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    for (const s of [1, 2, 3]) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        return;
      }
    }

    try {
      setSaving(true);
      await householdService.saveHouseholdOffline({
        houseNumber,
        state,
        lga,
        ward,
        pollingUnit,
        address: address.trim() || undefined,
        latitude,
        longitude,
        accuracy,
        gpsAddress: gpsAddress || undefined,
        locationCapturedAt,
        houseFrontPhotoUrl: houseFrontPhoto,
        headFirstName: headFirstName.trim(),
        headMiddleName: headMiddleName.trim() || undefined,
        headLastName: headLastName.trim(),
        headPhone: headPhone.trim(),
        headPhoneVerified,
        headEmail: headEmail.trim() || undefined,
        headGender,
        headDateOfBirth: headDateOfBirth || undefined,
        headMaritalStatus,
        headEmploymentStatus: headEmployment || undefined,
        headEducationLevel: headEducation || undefined,
        headStateOfOrigin: ninData?.birthState || ninData?.state || undefined,
        headLgaOfOrigin: ninData?.birthLga || ninData?.lga || undefined,
        headResidenceAddress: ninData?.residenceAddress || undefined,
        headNin: ninInput.trim(),
        headNinVerified: ninVerified,
        headPhotoUrl,
        wivesCount: parseInt(wivesCount, 10) || 0,
        childrenCount: parseInt(childrenCount, 10) || 0,
        otherDependentsCount: parseInt(otherDependentsCount, 10) || 0,
        totalHouseholdMembers: calculatedTotalMembers,
        dependentsNotes: dependentsNotes.trim() || undefined,
        telcoProviders,
        networkType,
        commercialCustomersCount: parseInt(commercialCustomers, 10) || 0,
        hasPUE: hasPue,
        pueType: hasPue ? pueType : undefined,
        pueEquipment: pueEquipment.trim() ? pueEquipment.split(',').map((s) => s.trim()) : [],
        primaryEnergySource,
        interventionStatus: 'Captured',
      });

      Alert.alert(
        'Household Registered',
        `House number:\n${houseNumber}\n\nRecord saved and queued for synchronization.`,
        [
          { text: 'View Household List', onPress: () => navigation.navigate('HouseholdList') },
          { text: 'Capture Another', onPress: resetForm },
        ]
      );
    } catch (e: any) {
      Alert.alert('Save Error', e.message || 'Could not save household record.');
    } finally {
      setSaving(false);
    }
  };

  // ── Small render helpers ──
  const renderStepHeader = (icon: any, title: string, desc: string) => (
    <View style={styles.stepHeader}>
      <Ionicons name={icon} size={48} color="#013358" />
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDesc}>{desc}</Text>
    </View>
  );

  const renderInfoRows = (rows: [string, string | null | undefined][]) =>
    rows
      .filter(([, v]) => v)
      .map(([k, v], i, arr) => (
        <View key={k} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>{k}</Text>
          <Text style={styles.infoValue}>{v}</Text>
        </View>
      ));

  const fullName = [headFirstName, headMiddleName, headLastName].filter(Boolean).join(' ');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        {/* Header with progress */}
        <View style={styles.header}>
          <Text style={styles.title}>Household Enrollment</Text>
          <Text style={styles.stepText}>
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / STEPS.length) * 100}%` }]} />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ──── STEP 1: NIN ──── */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              {renderStepHeader(
                'id-card-outline',
                'Head of Household',
                "Enter the household head's National Identification Number (NIN) for NIMC verification."
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>National Identification Number (NIN) *</Text>
                <View style={styles.ninInputRow}>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Ionicons name="finger-print" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 11-digit NIN"
                      placeholderTextColor="#9ca3af"
                      value={ninInput}
                      onChangeText={(val) => {
                        setNinInput(val.replace(/\D/g, ''));
                        if (ninVerified) resetNinVerification();
                      }}
                      keyboardType="numeric"
                      maxLength={11}
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.validateBtn,
                      (validatingNin || ninInput.length !== 11) && { opacity: 0.6 },
                    ]}
                    onPress={handleNINLookup}
                    disabled={validatingNin || ninInput.length !== 11}
                  >
                    {validatingNin ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.validateBtnText}>{ninVerified ? 'Re-check' : 'Validate'}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {ninVerified && ninData && (
                <>
                  <View style={styles.successBox}>
                    <Ionicons name="checkmark-circle" size={20} color="#059669" />
                    <Text style={styles.successText}>NIMC identity confirmed</Text>
                  </View>

                  <Text style={styles.sectionTitle}>NIMC Record</Text>
                  <View style={styles.infoCard}>
                    {renderInfoRows([
                      ['Full name', fullName],
                      [
                        'Date of birth',
                        headDateOfBirth
                          ? `${formatDate(headDateOfBirth)}${age !== null ? ` (${age} yrs)` : ''}`
                          : '',
                      ],
                      ['Gender', labelFor(GENDER_OPTIONS, headGender)],
                      ['Marital status', ninData.maritalStatus ? labelFor(MARITAL_STATUS_OPTIONS, ninData.maritalStatus) : ''],
                      ['Employment', ninData.employmentStatus ? labelFor(EMPLOYMENT_OPTIONS, ninData.employmentStatus) : ''],
                      ['Education', ninData.educationLevel ? labelFor(EDUCATION_OPTIONS, ninData.educationLevel) : ''],
                      ['Phone', ninData.phone || headPhone],
                      ['Email', ninData.email],
                      [
                        'State / LGA of origin',
                        [ninData.birthState || ninData.state, ninData.birthLga || ninData.lga]
                          .filter(Boolean)
                          .map(pretty)
                          .join(' / '),
                      ],
                      ['Residence on record', ninData.residenceAddress],
                    ])}
                  </View>
                  {age !== null && age < MIN_AGE && (
                    <View style={styles.warnBox}>
                      <Ionicons name="alert-circle" size={20} color="#b45309" />
                      <Text style={styles.warnText}>
                        This person is under {MIN_AGE} and cannot be enrolled as head of household.
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* ──── STEP 2: PERSONAL ──── */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              {renderStepHeader(
                'person-outline',
                'Personal Details',
                'Confirm the verified details and take a current photo of the head of household.'
              )}

              {/* Live photo */}
              <View style={styles.photoSection}>
                <TouchableOpacity style={styles.avatarWrap} onPress={handleCaptureHeadPhoto} activeOpacity={0.8}>
                  {headPhotoUrl ? (
                    <Image source={{ uri: headPhotoUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarEmpty]}>
                      <Ionicons name="camera-outline" size={34} color="#9ca3af" />
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCaptureHeadPhoto} style={styles.linkBtn}>
                  <Ionicons name="camera" size={16} color="#013358" />
                  <Text style={styles.linkBtnText}>{headPhotoUrl ? 'Retake photo' : 'Take current photo *'}</Text>
                </TouchableOpacity>
                <Text style={styles.fieldHint}>Face the camera in good light. The NIMC photo is not used.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name *</Text>
                <View style={[styles.inputContainer, ninVerified && styles.inputLocked]}>
                  <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="First name"
                    placeholderTextColor="#9ca3af"
                    value={headFirstName}
                    onChangeText={setHeadFirstName}
                    editable={!ninVerified}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Middle Name</Text>
                <View style={[styles.inputContainer, ninVerified && styles.inputLocked]}>
                  <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Middle name (optional)"
                    placeholderTextColor="#9ca3af"
                    value={headMiddleName}
                    onChangeText={setHeadMiddleName}
                    editable={!ninVerified}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name *</Text>
                <View style={[styles.inputContainer, ninVerified && styles.inputLocked]}>
                  <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Last name"
                    placeholderTextColor="#9ca3af"
                    value={headLastName}
                    onChangeText={setHeadLastName}
                    editable={!ninVerified}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth *</Text>
                <View
                  style={[styles.inputContainer, ninData?.dateOfBirth ? styles.inputLocked : null]}
                >
                  <Ionicons name="calendar-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                    value={headDateOfBirth}
                    onChangeText={setHeadDateOfBirth}
                    editable={!ninData?.dateOfBirth}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                  />
                  {age !== null && <Text style={styles.ageTag}>{age} yrs</Text>}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Gender *</Text>
                  <CustomSelect
                    options={GENDER_OPTIONS as any}
                    selectedValue={headGender}
                    onValueChange={(val: any) => setHeadGender(val)}
                    placeholder="Select"
                    disabled={!!ninData?.gender}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Marital Status</Text>
                  <CustomSelect
                    options={MARITAL_STATUS_OPTIONS as any}
                    selectedValue={headMaritalStatus}
                    onValueChange={(val: any) => setHeadMaritalStatus(val)}
                    placeholder="Select"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Employment Status</Text>
                <CustomSelect
                  options={EMPLOYMENT_OPTIONS as any}
                  selectedValue={headEmployment}
                  onValueChange={(val: any) => setHeadEmployment(val)}
                  placeholder="Select employment status"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Education Level</Text>
                <CustomSelect
                  options={EDUCATION_OPTIONS as any}
                  selectedValue={headEducation}
                  onValueChange={(val: any) => setHeadEducation(val)}
                  placeholder="Select education level"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 08012345678"
                    placeholderTextColor="#9ca3af"
                    value={headPhone}
                    onChangeText={(val) => {
                      setHeadPhone(val);
                      setHeadPhoneVerified(false);
                      setPhoneVerificationSkipped(false);
                    }}
                    keyboardType="phone-pad"
                    maxLength={11}
                  />
                  {headPhoneVerified && (
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" style={{ marginRight: 12 }} />
                  )}
                </View>

                {/* Verification Status & Action */}
                {headPhoneVerified ? (
                  <View style={styles.phoneStatusRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.phoneVerifiedText}>Phone Number Validated via OTP</Text>
                  </View>
                ) : (
                  <View style={styles.phoneVerificationActionRow}>
                    <View style={styles.phoneUnverifiedBadge}>
                      <Ionicons
                        name={phoneVerificationSkipped ? 'alert-circle-outline' : 'time-outline'}
                        size={14}
                        color={phoneVerificationSkipped ? '#d97706' : '#6b7280'}
                      />
                      <Text
                        style={[
                          styles.phoneUnverifiedText,
                          phoneVerificationSkipped && { color: '#d97706' },
                        ]}
                      >
                        {phoneVerificationSkipped ? 'Not Validated (Skipped)' : 'Not Validated'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.verifyPhoneBtn}
                      onPress={handleVerifyPhone}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="shield-checkmark-outline" size={14} color="#ffffff" />
                      <Text style={styles.verifyPhoneBtnText}>
                        {phoneVerificationSkipped ? 'Retry OTP' : 'Verify via OTP'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email (optional)"
                    placeholderTextColor="#9ca3af"
                    value={headEmail}
                    onChangeText={setHeadEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>
          )}

          {/* ──── STEP 3: LOCATION ──── */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              {renderStepHeader(
                'location-outline',
                'Dwelling Location',
                'Stand at the dwelling to pin its GPS location, then confirm the administrative boundary.'
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>GPS Location *</Text>
                <View style={styles.gpsBox}>
                  <View style={{ flex: 1 }}>
                    {gpsCaptured ? (
                      <>
                        <Text style={styles.gpsCoords}>
                          {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
                        </Text>
                        <Text style={styles.gpsMeta}>
                          Accuracy ±{Math.round(accuracy || 0)} m
                          {locationCapturedAt
                            ? ` • ${new Date(locationCapturedAt).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}`
                            : ''}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.gpsMeta}>{locating ? 'Acquiring GPS fix…' : 'Location not captured yet'}</Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.gpsButton} onPress={captureLocation} disabled={locating}>
                    {locating ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.gpsButtonText}>{gpsCaptured ? 'Re-pin' : 'Capture'}</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {gpsCaptured && (accuracy || 0) > GPS_WARN_METERS && (
                  <Text style={styles.warnInline}>
                    Accuracy is weaker than {GPS_WARN_METERS} m. Move to open ground and re-pin for a better fix.
                  </Text>
                )}
                {gpsCaptured && gpsAddress ? (
                  <Text style={styles.fieldHint}>Detected: {gpsAddress}</Text>
                ) : null}
              </View>

              {gpsCaptured && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>State *</Text>
                    <StateSelect
                      selectedValue={state}
                      onValueChange={(val: string) => {
                        setState(val);
                        setLga('');
                        setWard('');
                        setPollingUnit('');
                      }}
                      placeholder="Select State"
                      error={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Local Government Area (LGA) *</Text>
                    <LGASelect
                      selectedState={state}
                      selectedValue={lga}
                      onValueChange={(val: string) => {
                        setLga(val);
                        setWard('');
                        setPollingUnit('');
                      }}
                      placeholder="Select LGA"
                      error={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ward *</Text>
                    <WardSelect
                      selectedState={state}
                      selectedLGA={lga}
                      selectedValue={ward}
                      onValueChange={(val: string) => {
                        setWard(val);
                        setPollingUnit('');
                      }}
                      placeholder="Select Ward"
                      error={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Polling Unit *</Text>
                    <PollingUnitSelect
                      selectedState={state}
                      selectedLGA={lga}
                      selectedWard={ward}
                      selectedValue={pollingUnit}
                      onValueChange={(val: string) => setPollingUnit(val)}
                      placeholder="Select Polling Unit"
                      error={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Compound / Street Address / Landmark</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="map-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Unguwar Sarki, Near Central Mosque"
                        placeholderTextColor="#9ca3af"
                        value={address}
                        onChangeText={setAddress}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Dwelling Front Photograph</Text>
                    {houseFrontPhoto ? (
                      <View>
                        <Image source={{ uri: houseFrontPhoto }} style={styles.housePhoto} />
                        <TouchableOpacity onPress={handleCaptureHouseFront} style={styles.linkBtn}>
                          <Ionicons name="camera" size={16} color="#013358" />
                          <Text style={styles.linkBtnText}>Retake photo</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.takePhotoBox} onPress={handleCaptureHouseFront}>
                        <Ionicons name="camera-outline" size={30} color="#013358" />
                        <Text style={styles.takePhotoTitle}>Take dwelling front photo</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* House number appears only after GPS + full boundary are set */}
                  {houseNumber ? (
                    <View style={styles.houseNumberBox}>
                      <Text style={styles.houseNumberLabel}>House number</Text>
                      <Text style={styles.houseNumberValue}>{houseNumber}</Text>
                    </View>
                  ) : (
                    <Text style={styles.fieldHint}>
                      The house number is assigned once ward and polling unit are selected.
                    </Text>
                  )}
                </>
              )}
            </View>
          )}

          {/* ──── STEP 4: FAMILY ──── */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              {renderStepHeader(
                'people-outline',
                'Family Members',
                'Enter the number of people living in this household.'
              )}

              <View style={styles.totalRow}>
                <Text style={styles.totalNumber}>{calculatedTotalMembers}</Text>
                <Text style={styles.totalLabel}>total occupants including the head</Text>
              </View>

              {[
                { label: 'Number of Spouses', icon: 'heart-outline', value: wivesCount, set: setWivesCount },
                { label: 'Number of Children', icon: 'happy-outline', value: childrenCount, set: setChildrenCount },
                {
                  label: 'Other Dependents',
                  icon: 'person-add-outline',
                  value: otherDependentsCount,
                  set: setOtherDependentsCount,
                },
              ].map((f) => (
                <View key={f.label} style={styles.inputGroup}>
                  <Text style={styles.label}>{f.label}</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name={f.icon as any} size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      value={f.value}
                      onChangeText={(v) => f.set(v.replace(/\D/g, ''))}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ))}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Welfare Notes</Text>
                <View style={[styles.inputContainer, { alignItems: 'flex-start' }]}>
                  <TextInput
                    style={[styles.input, { minHeight: 80, paddingTop: 12 }]}
                    placeholder="Persons with disabilities, elderly dependents, etc. (optional)"
                    placeholderTextColor="#9ca3af"
                    value={dependentsNotes}
                    onChangeText={setDependentsNotes}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>
          )}

          {/* ──── STEP 5: CONNECTIVITY & ENERGY ──── */}
          {currentStep === 5 && (
            <View style={styles.stepContainer}>
              {renderStepHeader(
                'flash-outline',
                'Connectivity & Energy',
                'Record network coverage, energy source and any productive use of energy.'
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Available Mobile Networks</Text>
                <View style={styles.chipsContainer}>
                  {TELCO_OPTIONS.map((telco) => {
                    const selected = telcoProviders.includes(telco);
                    return (
                      <TouchableOpacity
                        key={telco}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => toggleTelco(telco)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{telco}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dominant Data Quality</Text>
                <View style={styles.chipsContainer}>
                  {NETWORK_TYPES.map((type) => {
                    const selected = networkType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setNetworkType(type)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{type}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Primary Energy Source</Text>
                <CustomSelect
                  options={ENERGY_SOURCES as any}
                  selectedValue={primaryEnergySource}
                  onValueChange={setPrimaryEnergySource}
                  placeholder="Select energy source"
                />
              </View>

              <View style={[styles.inputGroup, styles.toggleRow]}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.label, { marginBottom: 2 }]}>Productive Use of Energy</Text>
                  <Text style={styles.fieldHint}>Does this dwelling host an income-generating business?</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggleSwitch, hasPue && styles.toggleSwitchActive]}
                  onPress={() => setHasPue(!hasPue)}
                >
                  <View style={[styles.toggleThumb, hasPue && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>

              {hasPue && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Commercial Activity</Text>
                    <CustomSelect
                      options={PUE_TYPES as any}
                      selectedValue={pueType}
                      onValueChange={setPueType}
                      placeholder="Select activity"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Daily Customers</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="people-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 25"
                        placeholderTextColor="#9ca3af"
                        value={commercialCustomers}
                        onChangeText={(v) => setCommercialCustomers(v.replace(/\D/g, ''))}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Machinery / Equipment</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="hardware-chip-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 5HP Grinding Mill, Deep Freezer"
                        placeholderTextColor="#9ca3af"
                        value={pueEquipment}
                        onChangeText={setPueEquipment}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Review */}
              <Text style={styles.sectionTitle}>Review</Text>
              <View style={styles.infoCard}>
                <View style={styles.reviewHead}>
                  {headPhotoUrl ? <Image source={{ uri: headPhotoUrl }} style={styles.reviewAvatar} /> : null}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewName}>{fullName}</Text>
                    <Text style={styles.reviewSub}>
                      {[age !== null ? `${age} yrs` : '', labelFor(GENDER_OPTIONS, headGender)]
                        .filter(Boolean)
                        .join(' • ')}
                    </Text>
                  </View>
                </View>
                {renderInfoRows([
                  ['House number', houseNumber],
                  ['NIN', ninInput ? `${ninInput} (verified)` : ''],
                  ['Phone', `${headPhone} (${headPhoneVerified ? 'Validated' : 'Not Validated'})`],
                  ['Location', [pretty(ward), pretty(lga), pretty(state)].filter(Boolean).join(', ')],
                  [
                    'GPS',
                    gpsCaptured ? `${latitude!.toFixed(5)}, ${longitude!.toFixed(5)} (±${Math.round(accuracy || 0)} m)` : '',
                  ],
                  ['Occupants', `${calculatedTotalMembers}`],
                  ['Energy', `${primaryEnergySource}${hasPue ? ` • PUE: ${pueType}` : ''}`],
                ])}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom navigation */}
        <View style={styles.navigation}>
          {currentStep > 1 ? (
            <TouchableOpacity style={styles.backButton} onPress={handlePrev}>
              <Ionicons name="arrow-back" size={20} color="#6b7280" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          {currentStep < STEPS.length ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>Register Household</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      <PhoneVerificationModal
        visible={showPhoneVerificationModal}
        phoneNumber={headPhone}
        onVerificationComplete={handlePhoneVerificationComplete}
        onCancel={() => setShowPhoneVerificationModal(false)}
        onSkip={handlePhoneVerificationSkip}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  keyboardView: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  stepText: { fontSize: 14, color: '#6b7280', marginTop: 4, marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#013358', borderRadius: 3 },
  content: { flex: 1, paddingHorizontal: 24, paddingVertical: 20 },
  stepContainer: { paddingBottom: 24 },
  stepHeader: { alignItems: 'center', marginBottom: 28 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginTop: 12, marginBottom: 8 },
  stepDesc: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 10, marginTop: 8 },

  inputGroup: { marginBottom: 20 },
  row: { flexDirection: 'row' },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
  fieldHint: { fontSize: 13, color: '#6b7280', marginTop: 6, lineHeight: 18 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    minHeight: 56,
  },
  inputLocked: { backgroundColor: '#f3f4f6' },
  inputIcon: { marginLeft: 16, marginRight: 4 },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, color: '#1f2937' },
  ageTag: { fontSize: 13, fontWeight: '600', color: '#013358', marginRight: 14 },

  ninInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  validateBtn: {
    backgroundColor: '#013358',
    paddingHorizontal: 18,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
  },
  validateBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },

  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  successText: { fontSize: 14, fontWeight: '600', color: '#166534', flex: 1 },
  warnBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  warnText: { fontSize: 14, color: '#92400e', flex: 1, lineHeight: 20 },
  warnInline: { fontSize: 13, color: '#b45309', marginTop: 8, lineHeight: 18 },

  infoCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 16,
  },
  infoLabel: { fontSize: 14, color: '#6b7280' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right' },

  photoSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrap: { marginBottom: 8 },
  avatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 2, borderColor: '#013358' },
  avatarEmpty: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, alignSelf: 'center' },
  linkBtnText: { fontSize: 15, fontWeight: '600', color: '#013358' },

  gpsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    padding: 14,
    gap: 12,
  },
  gpsCoords: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  gpsMeta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  gpsButton: {
    backgroundColor: '#013358',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 82,
  },
  gpsButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },

  houseNumberBox: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    padding: 16,
    marginBottom: 8,
  },
  houseNumberLabel: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  houseNumberValue: { fontSize: 20, fontWeight: '700', color: '#013358', letterSpacing: 0.5 },

  housePhoto: { width: '100%', height: 180, borderRadius: 12, resizeMode: 'cover' },
  takePhotoBox: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingVertical: 24,
    alignItems: 'center',
  },
  takePhotoTitle: { fontSize: 15, fontWeight: '600', color: '#013358', marginTop: 8 },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  totalNumber: { fontSize: 28, fontWeight: '700', color: '#013358' },
  totalLabel: { fontSize: 14, color: '#1e3a8a', flex: 1 },

  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chipSelected: { backgroundColor: '#013358', borderColor: '#013358' },
  chipText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  chipTextSelected: { color: '#ffffff', fontWeight: '600' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1d5db',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: { backgroundColor: '#059669' },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ffffff' },
  toggleThumbActive: { alignSelf: 'flex-end' },

  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  reviewAvatar: { width: 52, height: 52, borderRadius: 26 },
  reviewName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  reviewSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },

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
  backButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  backButtonText: { fontSize: 16, color: '#6b7280', marginLeft: 8, fontWeight: '500' },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#013358',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  nextButtonText: { fontSize: 16, color: '#ffffff', marginRight: 8, fontWeight: '600' },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  submitButtonText: { fontSize: 16, color: '#ffffff', fontWeight: '600' },

  phoneStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  phoneVerifiedText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  phoneVerificationActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  phoneUnverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  phoneUnverifiedText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  verifyPhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#013358',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifyPhoneBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});
