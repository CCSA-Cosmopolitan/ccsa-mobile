import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { farmerSchema, ninSchema } from '../utils/validation';
import { useFarmerStore } from '../store/farmerStore';
import { farmerService } from '../services/farmerService';
import { ninService } from '../services/ninService';
import LoadingScreen from './LoadingScreen';
import { useAuth } from '../store/AuthContext';
import { auth } from '../services/firebase';

// Import form steps
import NINLookupStep from '../components/forms/NINLookupStep';
import PersonalInfoStep from '../components/forms/PersonalInfoStep';
import ContactInfoStep from '../components/forms/ContactInfoStep';
import BankInfoStep from '../components/forms/BankInfoStep';
import RefereeInfoStep from '../components/forms/RefereeInfoStep';
import FarmInfoStep from '../components/forms/FarmInfoStep';

const STEPS = [
  { id: 1, title: 'NIN Lookup', component: NINLookupStep },
  { id: 2, title: 'Personal Info', component: PersonalInfoStep },
  { id: 3, title: 'Contact Info', component: ContactInfoStep },
  { id: 4, title: 'Bank Info', component: BankInfoStep },
  { id: 5, title: 'Referees', component: RefereeInfoStep },
];

export default function AddFarmerScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ninData, setNinData] = useState(null);
  const [ninValidated, setNinValidated] = useState(false);
  const { addFarmer } = useFarmerStore();
  const { user } = useAuth();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    trigger,
    reset,
  } = useForm({
    resolver: zodResolver(farmerSchema),
    defaultValues: {
      nin: '',
      personalInfo: {
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        maritalStatus: '',
        employmentStatus: '',
        state: '',
        lga: '',
        photoUrl: '', // Add photoUrl field
      },
      contactInfo: {
        phoneNumber: '',
        whatsAppNumber: '',
        email: '',
        address: '',
        state: '',
        localGovernment: '',
        ward: '',
        pollingUnit: '',
        cluster: '',
        coordinates: null,
      },
      bankInfo: {
        bvn: '',
        bankName: '',
        accountNumber: '',
        accountName: '',
      },
      referees: [
        { fullName: '', phoneNumber: '', relation: '' },
      ],
    },
  });

  const nextStep = async () => {
    // Special validation for NIN step - must be validated before proceeding
    if (currentStep === 1 && !ninValidated) {
      Alert.alert(
        'NIN Validation Required',
        'Please complete NIN validation before proceeding to the next step.'
      );
      return;
    }

    const fieldsToValidate = getFieldsForStep(currentStep);
    console.log(`=== STEP ${currentStep} VALIDATION START ===`);
    console.log('Fields to validate:', fieldsToValidate);
    
    // Get current form data for debugging
    const formData = watch();
    console.log('Current form data:', JSON.stringify(formData, null, 2));
    
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      console.log(`✅ Step ${currentStep} validation passed`);
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      console.log(`❌ Step ${currentStep} validation failed`);
      console.log('Current errors:', JSON.stringify(errors, null, 2));
      
      // Get specific errors for this step
      const stepErrors = [];
      fieldsToValidate.forEach(field => {
        const fieldPath = field.split('.');
        let currentError = errors;
        
        for (const path of fieldPath) {
          if (currentError && currentError[path]) {
            currentError = currentError[path];
          } else {
            currentError = null;
            break;
          }
        }
        
        if (currentError) {
          if (typeof currentError === 'object' && currentError.message) {
            stepErrors.push(`${field}: ${currentError.message}`);
          } else if (typeof currentError === 'object') {
            // Handle nested errors
            Object.keys(currentError).forEach(key => {
              if (currentError[key] && currentError[key].message) {
                stepErrors.push(`${field}.${key}: ${currentError[key].message}`);
              }
            });
          }
        }
      });
      
      console.log('Step errors:', stepErrors);
      
      // Show specific error message
      const stepName = STEPS[currentStep - 1].title;
      const errorMessage = stepErrors.length > 0 
        ? `Please fix the following errors:\n\n${stepErrors.slice(0, 3).join('\n')}${stepErrors.length > 3 ? '\n\n...and more' : ''}`
        : `Please fill in all required fields in the ${stepName} section before proceeding.`;
      
      Alert.alert('Validation Error', errorMessage);
    }
    
    console.log(`=== STEP ${currentStep} VALIDATION END ===`);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step) => {
    switch (step) {
      case 1: return ['nin'];
      case 2: return ['personalInfo'];
      case 3: return ['contactInfo'];
      case 4: return ['bankInfo'];
      case 5: return ['referees'];
      default: return [];
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      console.log('=== FORM SUBMISSION START ===');
      console.log('Form data being submitted:');
      console.log('- NIN:', data.nin);
      console.log('- Personal Info:', JSON.stringify(data.personalInfo, null, 2));
      console.log('- Contact Info:', JSON.stringify(data.contactInfo, null, 2));
      console.log('- Bank Info:', JSON.stringify(data.bankInfo, null, 2));
      console.log('- Referees:', JSON.stringify(data.referees, null, 2));
      console.log('Raw form data:', JSON.stringify(data, null, 2));
      
      // Validate the complete form data before submission
      console.log('Validating complete form data...');
      const validationResult = farmerSchema.safeParse(data);
      
      if (!validationResult.success) {
        console.log('❌ Form validation failed:');
        const errorDetails = validationResult.error.errors.map((error, index) => {
          const errorInfo = `${index + 1}. ${error.path.join('.')}: ${error.message}`;
          console.log(`  ${errorInfo}`);
          return errorInfo;
        });
        
        // Show detailed validation errors
        const errorMessage = `Please fix the following errors:\n\n${errorDetails.slice(0, 5).join('\n')}${errorDetails.length > 5 ? '\n\n...and more' : ''}`;
        
        console.log('Full error message:', errorMessage);
        
        Alert.alert(
          'Validation Failed',
          errorMessage,
          [{ text: 'OK', onPress: () => console.log('User acknowledged validation errors') }]
        );
        return;
      }
      
      console.log('✅ Form validation passed');

      // Check for unique fields
      console.log('Checking for duplicate fields...');
      try {
        const conflicts = await farmerService.checkUniqueFields(
          data.nin,
          data.contactInfo.email,
          data.contactInfo.phoneNumber,
          data.bankInfo.bvn
        );

        if (conflicts.length > 0) {
          console.log('❌ Duplicate fields found:', conflicts);
          Alert.alert(
            'Duplicate Data Found',
            `A farmer is already registered with the following information:\n\n${conflicts.join('\n')}\n\nPlease check the records or contact support if this is an error.`,
            [{ text: 'OK', style: 'default' }]
          );
          return;
        }
      } catch (error) {
        console.log('Error checking duplicates:', error.message);
        // If the duplicate check fails, we'll let the backend handle it
        console.log('Proceeding with submission despite duplicate check failure...');
      }
      
      console.log('✅ No duplicate fields found');

      console.log('Creating farmer...');
      const farmer = await addFarmer(data);
      console.log('✅ Farmer created successfully:', farmer);
      console.log('Farmer structure:', {
        id: farmer?.id,
        firstName: farmer?.firstName,
        lastName: farmer?.lastName,
        nin: farmer?.nin,
        keys: Object.keys(farmer || {})
      });
      
      Alert.alert(
        'Success', 
        'Farmer registered successfully!',
        [
          { 
            text: 'Add Farm', 
            onPress: () => {
              console.log('Navigating to AddFarm with farmer:', farmer?.id);
              console.log('Farmer data for navigation:', {
                id: farmer?.id,
                firstName: farmer?.firstName,
                lastName: farmer?.lastName,
                nin: farmer?.nin
              });
              navigation.navigate('AddFarm', { 
                farmerId: farmer?.id, 
                farmer: farmer 
              });
            }
          },
          { 
            text: 'Add Another Farmer', 
            onPress: () => {
              // Reset form and go back to step 1
              console.log('Resetting form for new farmer');
              setCurrentStep(1);
              setNinValidated(false);
              setNinData(null);
              
              // Reset all form values
              reset({
                nin: '',
                personalInfo: {
                  firstName: '',
                  middleName: '',
                  lastName: '',
                  dateOfBirth: '',
                  gender: '',
                  maritalStatus: '',
                  employmentStatus: '',
                  state: '',
                  lga: '',
                  photoUrl: '', // Add photoUrl to reset
                },
                contactInfo: {
                  phoneNumber: '',
                  whatsAppNumber: '',
                  email: '',
                  address: '',
                  state: '',
                  localGovernment: '',
                  ward: '',
                  pollingUnit: '',
                  cluster: '',
                  coordinates: null,
                },
                bankInfo: {
                  bvn: '',
                  bankName: '',
                  accountNumber: '',
                  accountName: '',
                },
                referees: [
                  { fullName: '', phoneNumber: '', relation: '' }
                ]
              });
            }
          },
          { 
            text: 'View Farmers', 
            onPress: () => navigation.navigate('FarmersList')
          }
        ]
      );
      
      console.log('=== FORM SUBMISSION SUCCESS ===');
    } catch (error) {
      console.error('❌ Form submission error:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      // Handle specific error types
      let errorMessage = 'Failed to register farmer. Please try again.';
      
      if (error.message.includes('already exists') || error.message.includes('duplicate') || error.message.includes('unique constraint')) {
        errorMessage = 'A farmer with this information already exists in the database. Please check the NIN, phone number, email, or BVN and try again.';
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
        errorMessage = 'Authentication error. Please log out and log back in.';
      } else if (error.message.includes('validation')) {
        errorMessage = 'Please check that all required fields are filled correctly.';
      }
      
      Alert.alert(
        'Registration Failed', 
        errorMessage,
        [{ text: 'OK', style: 'default' }]
      );
      console.log('=== FORM SUBMISSION ERROR ===');
    } finally {
      setLoading(false);
    }
  };

  const handleNINLookup = async (nin) => {
    try {
      setLoading(true);
      
      // Debug authentication state
      console.log('=== AUTH DEBUG START ===');
      console.log('Current user from context:', user ? user.email : 'No user');
      console.log('Firebase current user:', auth.currentUser ? auth.currentUser.email : 'No Firebase user');
      
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken(true);
          console.log('Token refresh successful, length:', token.length);
        } catch (tokenError) {
          console.error('Token refresh failed:', tokenError);
        }
      }
      console.log('=== AUTH DEBUG END ===');
      
      // Validate NIN format first
      const ninValidation = ninSchema.safeParse(nin);
      if (!ninValidation.success) {
        throw new Error('Please enter a valid 11-digit NIN');
      }

      // Test network connectivity first (without auth)
      console.log('Testing network connectivity...');
      try {
        // Simple network test - try to reach the API health endpoint
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch('http://172.20.10.4:3000/health', { 
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Network connectivity test passed');
      } catch (networkError) {
        console.error('Network test failed:', networkError);
        // Still continue with the main lookup in case the test endpoint doesn't work
      }

      // Check if farmer already exists with this NIN
      console.log('Checking if farmer already exists with NIN:', nin);
      try {
        const existingFarmer = await farmerService.getFarmerByNin(nin);
        if (existingFarmer) {
          console.log('Found existing farmer:', existingFarmer);
          // throw new Error(`This NIN has already been registered by another farmer. Farmer: ${existingFarmer.firstName} ${existingFarmer.lastName} (Phone: ${existingFarmer.phone})`);
        }
        console.log('No existing farmer found with this NIN');
      } catch (error) {
        // If it's our specific "already registered" error, re-throw it
        if (error.message.includes('already been registered')) {
          throw error;
        }
        
        // Log other errors but don't fail the lookup entirely
        console.log('Error checking existing farmer:', error.message);
        // Don't throw here - this might be due to auth issues or other problems
      }

      // Try NIN lookup
      const ninData = await ninService.lookupNIN(nin);
      setValue('nin', nin);
      setNinData(ninData);
      setNinValidated(true);
      
      // Pre-fill form with fetched data (mapping from NIN API structure)
      setValue('personalInfo.firstName', ninData.firstName || '');
      setValue('personalInfo.middleName', ninData.middleName || '');
      setValue('personalInfo.lastName', ninData.lastName || '');
      setValue('personalInfo.dateOfBirth', ninData.dateOfBirth || '');
      setValue('personalInfo.gender', ninData.gender?.toUpperCase() || '');
      setValue('personalInfo.maritalStatus', ninData.maritalStatus || '');
      setValue('personalInfo.employmentStatus', ninData.employmentStatus || '');
      setValue('personalInfo.photoUrl', ninData.photoUrl || ''); // Set photoUrl from NIN data
      
      // Address information from NIN data (set both personalInfo and contactInfo)
      setValue('personalInfo.state', ninData.state || '');
      setValue('personalInfo.lga', ninData.lga || '');
      setValue('contactInfo.state', ninData.state || '');
      setValue('contactInfo.localGovernment', ninData.lga || '');
      
      return ninData;
    } catch (error) {
      console.error('NIN lookup failed:', error);
      setNinValidated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Debugging: Check if user is authenticated
  React.useEffect(() => {
    const checkAuth = () => {
      if (!user) {
        console.log('User is not authenticated');
        Alert.alert('Authentication Required', 'You must be logged in to add a farmer.');
        navigation.navigate('Login');
      } else {
        console.log('User is authenticated:', user);
      }
    };

    checkAuth();
  }, [user, navigation]);
  if (loading && currentStep === 1) {
    return <LoadingScreen message="Looking up NIN..." />;
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header with Progress */}
        <View style={styles.header}>
          <Text style={styles.title}>Add New Farmer</Text>
          <Text style={styles.stepText}>
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
          </Text>
          
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

        {/* Form Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <CurrentStepComponent
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            onNINLookup={handleNINLookup}
            ninData={ninData}
            ninValidated={ninValidated}
            onNINChange={() => setNinValidated(false)}
          />
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigation}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <Ionicons name="arrow-back" size={20} color="#6b7280" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.navigationRight}>
            {currentStep < STEPS.length ? (
              <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
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
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                ) : (
                  <Text style={styles.submitButtonText}>Register Farmer</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
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
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 8,
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
    paddingVertical: 24,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
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
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});
