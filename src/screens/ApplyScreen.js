import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import API_CONFIG from '../config/api';
import hierarchicalData from '../data/hierarchical-data';

// ── Location helpers ───────────────────────────────────────────────────────
const fmt = (s) =>
  s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const STATE_LIST = hierarchicalData
  .map((s) => s.state)
  .sort()
  .map((s) => ({ value: s, label: fmt(s) }));

function getLGAsForState(stateValue) {
  const found = hierarchicalData.find((s) => s.state === stateValue);
  if (!found) return [];
  return found.lgas
    .map((l) => l.lga)
    .sort()
    .map((l) => ({ value: l, label: fmt(l) }));
}

function getWardsForLGA(stateValue, lgaValue) {
  const stateObj = hierarchicalData.find((s) => s.state === stateValue);
  if (!stateObj) return [];
  const lgaObj = stateObj.lgas.find((l) => l.lga === lgaValue);
  if (!lgaObj) return [];
  return lgaObj.wards
    .map((w) => w.ward)
    .sort()
    .map((w) => ({ value: w, label: fmt(w) }));
}

function getPollingUnitsForWard(stateValue, lgaValue, wardValue) {
  const stateObj = hierarchicalData.find((s) => s.state === stateValue);
  if (!stateObj) return [];
  const lgaObj = stateObj.lgas.find((l) => l.lga === lgaValue);
  if (!lgaObj) return [];
  const wardObj = lgaObj.wards.find((w) => w.ward === wardValue);
  if (!wardObj) return [];
  return wardObj.polling_units
    .slice()
    .sort()
    .map((p) => ({ value: p, label: fmt(p) }));
}

// ── Education options ──────────────────────────────────────────────────────
const EDUCATION_OPTIONS = [
  { value: 'No Formal Education', label: 'No Formal Education' },
  { value: 'FSLC',                label: 'FSLC (Primary School)' },
  { value: 'WAEC / SSCE',         label: 'WAEC / SSCE' },
  { value: 'OND / NCE',           label: 'OND / NCE' },
  { value: 'HND / BSc',           label: 'HND / BSc' },
  { value: 'MSc / MBA / PGD',     label: 'MSc / MBA / PGD' },
  { value: 'PhD',                 label: 'PhD' },
];

// ── Picker wrapper ─────────────────────────────────────────────────────────
function PickerField({ icon, value, onValueChange, placeholder, items }) {
  return (
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={18} color="#9ca3af" style={styles.icon} />
      <Picker
        selectedValue={value}
        onValueChange={onValueChange}
        style={styles.picker}
        dropdownIconColor="#9ca3af"
      >
        <Picker.Item label={placeholder} value="" color="#9ca3af" />
        {items.map((item) => (
          <Picker.Item key={item.value} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
  );
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ label }) {
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

export default function ApplyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [submitting, setSubmitting] = useState(false);

  // Personal
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [nin,        setNin]        = useState('');

  // Location
  const [state,       setState]      = useState('');
  const [lga,         setLga]        = useState('');
  const [ward,        setWard]       = useState('');
  const [pollingUnit, setPollingUnit] = useState('');

  // Background
  const [education,  setEducation]  = useState('');
  const [jobHistory, setJobHistory] = useState('');
  const [message,    setMessage]    = useState('');

  // Derived lists
  const lgaList   = useMemo(() => getLGAsForState(state),       [state]);
  const wardList  = useMemo(() => getWardsForLGA(state, lga),   [state, lga]);
  const puList    = useMemo(() => getPollingUnitsForWard(state, lga, ward), [state, lga, ward]);

  // Cascading resets
  const handleStateChange = (val) => { setState(val); setLga(''); setWard(''); setPollingUnit(''); };
  const handleLgaChange   = (val) => { setLga(val);  setWard(''); setPollingUnit(''); };
  const handleWardChange  = (val) => { setWard(val); setPollingUnit(''); };

  const validate = () => {
    if (!firstName.trim()) return 'First name is required.';
    if (!lastName.trim())  return 'Last name is required.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return 'A valid email address is required.';
    if (!phone.trim() || !/^[0-9+\s-]{7,15}$/.test(phone.trim()))
      return 'A valid phone number is required.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { Alert.alert('Validation Error', err); return; }

    try {
      setSubmitting(true);
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AGENT_APPLY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName:   firstName.trim(),
          lastName:    lastName.trim(),
          email:       email.trim().toLowerCase(),
          phone:       phone.trim(),
          state:       state       || undefined,
          lga:         lga         || undefined,
          ward:        ward        || undefined,
          pollingUnit: pollingUnit || undefined,
          education:   education   || undefined,
          jobHistory:  jobHistory.trim()  || undefined,
          nin:         nin.trim()         || undefined,
          message:     message.trim()     || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) { Alert.alert('Submission Failed', data.error || 'Please try again.'); return; }

      Alert.alert(
        'Application Submitted!',
        'Your application has been received. Our team will review it and reach out to you shortly.',
        [{ text: 'OK', onPress: () => navigation.navigate('Welcome') }],
      );
    } catch (_) {
      Alert.alert('Network Error', 'Unable to reach the server. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color="#013358" />
        <Text style={styles.loadingText}>Submitting your application…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#374151" />
            </TouchableOpacity>
            <View style={styles.iconWrapper}>
              <Ionicons name="briefcase-outline" size={36} color="#013358" />
            </View>
            <Text style={styles.title}>Apply as Field Agent</Text>
            <Text style={styles.subtitle}>
              Join the CCSA field operations team. Fill in your details and our team will be in touch.
            </Text>
          </View>

          <View style={styles.form}>
            {/* ── Personal Information ─────────────────────────────── */}
            <SectionHeader label="Personal Information" />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color="#9ca3af" style={styles.icon} />
                <TextInput style={styles.input} placeholder="e.g. Aminu" value={firstName}
                  onChangeText={setFirstName} autoCapitalize="words" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color="#9ca3af" style={styles.icon} />
                <TextInput style={styles.input} placeholder="e.g. Bello" value={lastName}
                  onChangeText={setLastName} autoCapitalize="words" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color="#9ca3af" style={styles.icon} />
                <TextInput style={styles.input} placeholder="you@example.com" value={email}
                  onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={styles.inputRow}>
                <Ionicons name="call-outline" size={18} color="#9ca3af" style={styles.icon} />
                <TextInput style={styles.input} placeholder="08012345678" value={phone}
                  onChangeText={setPhone} keyboardType="phone-pad" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NIN <Text style={styles.optional}>(optional)</Text></Text>
              <View style={styles.inputRow}>
                <Ionicons name="card-outline" size={18} color="#9ca3af" style={styles.icon} />
                <TextInput style={styles.input} placeholder="11-digit national ID number" value={nin}
                  onChangeText={setNin} keyboardType="numeric" maxLength={11} />
              </View>
            </View>

            {/* ── Location ─────────────────────────────────────────── */}
            <SectionHeader label="Location" />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>State of Residence</Text>
              <PickerField icon="location-outline" value={state} onValueChange={handleStateChange}
                placeholder="Select state…" items={STATE_LIST} />
            </View>

            {state ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Local Government Area</Text>
                <PickerField icon="map-outline" value={lga} onValueChange={handleLgaChange}
                  placeholder="Select LGA…" items={lgaList} />
              </View>
            ) : null}

            {lga ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ward</Text>
                <PickerField icon="business-outline" value={ward} onValueChange={handleWardChange}
                  placeholder="Select ward…" items={wardList} />
              </View>
            ) : null}

            {ward ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Polling Unit</Text>
                <PickerField icon="flag-outline" value={pollingUnit} onValueChange={setPollingUnit}
                  placeholder="Select polling unit…" items={puList} />
              </View>
            ) : null}

            {/* ── Education & Experience ───────────────────────────── */}
            <SectionHeader label="Education & Experience" />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Highest Education Level</Text>
              <PickerField icon="school-outline" value={education} onValueChange={setEducation}
                placeholder="Select qualification…" items={EDUCATION_OPTIONS} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Employment / Job History <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput
                style={styles.textarea}
                placeholder="List your previous or current employment, roles and duration…"
                value={jobHistory}
                onChangeText={setJobHistory}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Why do you want to join? <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput
                style={styles.textarea}
                placeholder="Tell us briefly about yourself and your motivation…"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.85}>
              <Text style={styles.submitButtonText}>Submit Application</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              By submitting this form you agree to be contacted by the CCSA team regarding your application.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#ffffff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  loadingText:    { marginTop: 12, fontSize: 15, color: '#64748b' },
  scrollContent:  { paddingHorizontal: 24, paddingBottom: 40 },

  header:         { alignItems: 'center', paddingTop: 8, paddingBottom: 28 },
  backButton:     { alignSelf: 'flex-start', padding: 8, marginLeft: -4, marginBottom: 20 },
  iconWrapper:    { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f0f6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  title:          { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 6, textAlign: 'center' },
  subtitle:       { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  sectionHeader:  { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8, marginBottom: 14 },

  form:           { width: '100%' },
  inputGroup:     { marginBottom: 16 },
  label:          { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  optional:       { fontWeight: '400', color: '#94a3b8' },

  inputRow:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#c7d2e0', borderRadius: 10, backgroundColor: '#f8fafc', overflow: 'hidden' },
  icon:           { marginLeft: 12 },
  input:          { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14, color: '#1f2937' },
  picker:         { flex: 1, height: 50, color: '#1f2937' },

  textarea:       { borderWidth: 1.5, borderColor: '#c7d2e0', borderRadius: 10, backgroundColor: '#f8fafc', paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, color: '#1f2937', minHeight: 96 },

  submitButton:   { backgroundColor: '#013358', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 14 },
  submitButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  disclaimer:     { fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 17 },
});
