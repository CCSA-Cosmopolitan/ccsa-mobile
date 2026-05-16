import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSurveyStore } from '../../store/surveyStore';
import type { QuestionType } from '../../types/survey';

function formatAnswer(
  type: QuestionType,
  answerText: string | null,
  selectedOptionIds: string[],
  options: { id: string; optionText: string }[],
): string {
  if (type === 'TEXT' || type === 'NUMBER' || type === 'DATE' || type === 'YES_NO') {
    return answerText ?? '—';
  }
  if (selectedOptionIds.length === 0) return '—';
  return selectedOptionIds
    .map((id) => options.find((o) => o.id === id)?.optionText ?? id)
    .join(', ');
}

export default function SurveyReviewScreen({ navigation }: { navigation: any }) {
  const {
    selectedSurvey, selectedFarmer, answers, submitting, submitError, submitSurvey,
  } = useSurveyStore();

  if (!selectedSurvey || !selectedFarmer) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ color: '#64748b' }}>Session expired.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SurveyList')}>
          <Text style={{ color: '#013358', marginTop: 12, fontWeight: '600' }}>Back to surveys</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSubmit = async () => {
    Alert.alert(
      'Submit Survey',
      `Submit all ${selectedSurvey.questions.length} answers for ${selectedFarmer.firstName} ${selectedFarmer.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'default',
          onPress: async () => {
            await submitSurvey();
            navigation.navigate('SurveyComplete');
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Farmer summary */}
        <View
          style={{
            backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20,
            flexDirection: 'row', alignItems: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
            shadowRadius: 4, elevation: 1,
          }}
        >
          <View
            style={{
              width: 44, height: 44, borderRadius: 12, backgroundColor: '#dbeafe',
              alignItems: 'center', justifyContent: 'center', marginRight: 14,
            }}
          >
            <Ionicons name="person" size={20} color="#013358" />
          </View>
          <View>
            <Text style={{ fontWeight: '700', fontSize: 15, color: '#0f172a' }}>
              {selectedFarmer.firstName} {selectedFarmer.lastName}
            </Text>
            <Text style={{ fontSize: 12, color: '#64748b' }}>NIN: {selectedFarmer.nin}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          Your Answers
        </Text>

        {selectedSurvey.questions.map((q, idx) => {
          const draft = answers[q.id];
          const answer = draft
            ? formatAnswer(q.questionType, draft.answerText, draft.selectedOptionIds, q.options)
            : '—';
          const unanswered = answer === '—';

          return (
            <TouchableOpacity
              key={q.id}
              onPress={() => navigation.navigate('Questionnaire')}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
                borderLeftWidth: 4,
                borderLeftColor: unanswered && q.isRequired ? '#fca5a5' : '#e2e8f0',
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
              }}
            >
              <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                Q{idx + 1}{q.isRequired ? ' · Required' : ''}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b', marginBottom: 6 }}>
                {q.questionText}
              </Text>
              <Text style={{ fontSize: 13, color: unanswered ? '#f87171' : '#013358' }}>
                {answer}
              </Text>
            </TouchableOpacity>
          );
        })}

        {submitError && (
          <View
            style={{
              backgroundColor: '#fef2f2', borderRadius: 10, padding: 14, marginTop: 8,
              flexDirection: 'row', alignItems: 'flex-start',
            }}
          >
            <Ionicons name="warning-outline" size={18} color="#ef4444" style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={{ color: '#b91c1c', fontSize: 13, flex: 1 }}>{submitError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Submit footer */}
      <View
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: '#fff', padding: 20,
          borderTopWidth: 1, borderTopColor: '#f1f5f9',
          shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04, shadowRadius: 6, elevation: 4,
        }}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            backgroundColor: submitting ? '#94a3b8' : '#013358',
            borderRadius: 14, paddingVertical: 16, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          )}
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {submitting ? 'Submitting…' : 'Submit Survey'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
