import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSurveyStore } from '../../store/surveyStore';

export default function SurveyCompleteScreen({ navigation }: { navigation: any }) {
  const { selectedSurvey, selectedFarmer, submitError, resetSession } = useSurveyStore();

  const success = !submitError;

  const handleDone = () => {
    resetSession();
    navigation.navigate('SurveyList');
  };

  const handleAnother = () => {
    // Keep survey selected, clear farmer + answers
    const store = useSurveyStore.getState();
    store.clearFarmer();
    store.resetAnswers();
    navigation.navigate('FarmerSelect');
  };

  return (
    <View style={{ flex: 1, backgroundColor: success ? '#013358' : '#7f1d1d', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <StatusBar barStyle="light-content" />

      <View
        style={{
          width: 90, height: 90, borderRadius: 45,
          backgroundColor: success ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
          alignItems: 'center', justifyContent: 'center', marginBottom: 28,
        }}
      >
        <Ionicons
          name={success ? 'checkmark-circle' : 'warning'}
          size={54}
          color="#ffffff"
        />
      </View>

      <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 12 }}>
        {success ? 'Survey Submitted!' : 'Submission Failed'}
      </Text>

      {success && selectedFarmer && selectedSurvey ? (
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
          {selectedFarmer.firstName} {selectedFarmer.lastName}'s responses{'\n'}for "{selectedSurvey.title}"{'\n'}have been recorded.
        </Text>
      ) : (
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
          {submitError ?? 'An unexpected error occurred. Please try again.'}
        </Text>
      )}

      <View style={{ width: '100%', marginTop: 48, gap: 12 }}>
        {success && (
          <TouchableOpacity
            onPress={handleAnother}
            style={{
              backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14,
              paddingVertical: 15, alignItems: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>
              Survey Another Farmer
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleDone}
          style={{
            backgroundColor: '#ffffff', borderRadius: 14,
            paddingVertical: 15, alignItems: 'center',
          }}
        >
          <Text style={{ color: '#013358', fontWeight: '700', fontSize: 15 }}>
            Back to Surveys
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
