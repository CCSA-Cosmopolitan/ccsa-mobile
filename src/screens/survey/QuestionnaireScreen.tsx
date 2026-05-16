import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Switch, Platform, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSurveyStore } from '../../store/surveyStore';
import type { SurveyQuestion, QuestionType } from '../../types/survey';

// ─── Individual question renderers ───────────────────────────────────────────

function TextQuestion({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <TextInput
      style={{
        backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
        borderRadius: 10, padding: 12, fontSize: 14, color: '#1e293b', minHeight: 80,
        textAlignVertical: 'top',
      }}
      placeholder="Type your answer…"
      placeholderTextColor="#94a3b8"
      multiline
      value={value}
      onChangeText={onChange}
    />
  );
}

function NumberQuestion({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <TextInput
      style={{
        backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
        borderRadius: 10, padding: 12, fontSize: 14, color: '#1e293b',
      }}
      placeholder="Enter a number…"
      placeholderTextColor="#94a3b8"
      keyboardType="numeric"
      value={value}
      onChangeText={onChange}
    />
  );
}

function DateQuestion({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parseDate = (v: string) => {
    const match = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return { year: parseInt(match[1]), month: parseInt(match[2]), day: parseInt(match[3]) };
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  };

  const parsed = parseDate(value);
  const [year, setYear] = useState(parsed.year);
  const [month, setMonth] = useState(parsed.month);
  const [day, setDay] = useState(parsed.day);
  const [picking, setPicking] = useState<'year' | 'month' | 'day' | null>(null);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const emit = (y: number, m: number, d: number) => {
    const dd = Math.min(d, new Date(y, m, 0).getDate());
    onChange(`${y}-${String(m).padStart(2,'0')}-${String(dd).padStart(2,'0')}`);
  };

  const Picker = ({ items, selected, onSelect }: { items: number[] | string[]; selected: number; onSelect: (v: number) => void }) => (
    <Modal transparent animationType="slide" visible>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: 380 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
            <TouchableOpacity onPress={() => setPicking(null)}><Text style={{ color: '#64748b', fontWeight: '600' }}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setPicking(null)}><Text style={{ color: '#013358', fontWeight: '700' }}>Done</Text></TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(i) => String(i)}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { onSelect(typeof item === 'string' ? months.indexOf(item as string) + 1 : item as number); setPicking(null); }}
                style={{ paddingHorizontal: 24, paddingVertical: 14, backgroundColor: (typeof item === 'string' ? months.indexOf(item as string) + 1 : item) === selected ? '#eff6ff' : '#fff' }}
              >
                <Text style={{ fontSize: 15, color: (typeof item === 'string' ? months.indexOf(item as string) + 1 : item) === selected ? '#013358' : '#0f172a', fontWeight: (typeof item === 'string' ? months.indexOf(item as string) + 1 : item) === selected ? '700' : '400' }}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const DisplayBtn = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingVertical: 13, alignItems: 'center' }}
    >
      <Text style={{ fontSize: 14, color: '#0f172a', fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <DisplayBtn label={String(day).padStart(2, '0')} onPress={() => setPicking('day')} />
        <DisplayBtn label={months[month - 1]} onPress={() => setPicking('month')} />
        <DisplayBtn label={String(year)} onPress={() => setPicking('year')} />
      </View>
      {value ? (
        <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Selected: {value}</Text>
      ) : (
        <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Tap Day / Month / Year to select</Text>
      )}
      {picking === 'day'   && <Picker items={days}   selected={day}   onSelect={(v) => { setDay(v);   emit(year, month, v); }} />}
      {picking === 'month' && <Picker items={months} selected={month} onSelect={(v) => { setMonth(v); emit(year, v, day); }} />}
      {picking === 'year'  && <Picker items={years}  selected={year}  onSelect={(v) => { setYear(v);  emit(v, month, day); }} />}
    </View>
  );
}


function YesNoQuestion({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {['Yes', 'No'].map((opt) => (
        <TouchableOpacity
          key={opt}
          onPress={() => onChange(opt)}
          style={{
            flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
            borderWidth: 2,
            borderColor: value === opt ? '#013358' : '#e2e8f0',
            backgroundColor: value === opt ? '#013358' : '#fff',
          }}
        >
          <Text style={{ fontWeight: '700', color: value === opt ? '#fff' : '#94a3b8' }}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ChoiceQuestion({
  question,
  selectedIds,
  onToggle,
  multi,
}: {
  question: SurveyQuestion;
  selectedIds: string[];
  onToggle: (id: string) => void;
  multi: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      {question.options.map((opt) => {
        const selected = selectedIds.includes(opt.id);
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onToggle(opt.id)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row', alignItems: 'center', padding: 14,
              borderRadius: 12, borderWidth: 2,
              borderColor: selected ? '#013358' : '#e2e8f0',
              backgroundColor: selected ? '#eff6ff' : '#fff',
            }}
          >
            <View
              style={{
                width: 20, height: 20,
                borderRadius: multi ? 4 : 10,
                borderWidth: 2,
                borderColor: selected ? '#013358' : '#cbd5e1',
                backgroundColor: selected ? '#013358' : 'transparent',
                marginRight: 12, alignItems: 'center', justifyContent: 'center',
              }}
            >
              {selected && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            <Text style={{ fontSize: 14, color: '#1e293b', flex: 1 }}>{opt.optionText}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function QuestionnaireScreen({ navigation }: { navigation: any }) {
  const { selectedSurvey, selectedFarmer, answers, setAnswer } = useSurveyStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!selectedSurvey || !selectedFarmer) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ color: '#64748b' }}>Session expired. Please go back.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SurveyList')}>
          <Text style={{ color: '#013358', marginTop: 12, fontWeight: '600' }}>Back to surveys</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const questions = selectedSurvey.questions ?? [];
  const question = questions[currentIndex];

  if (!questions.length || !question) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ color: '#64748b' }}>This survey has no questions.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SurveyList')}>
          <Text style={{ color: '#013358', marginTop: 12, fontWeight: '600' }}>Back to surveys</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const draft = answers[question.id] ?? {
    questionId: question.id,
    answerText: null,
    selectedOptionIds: [],
  };

  const total = questions.length;
  const progress = ((currentIndex + 1) / total) * 100;

  const handleTextChange = (v: string) =>
    setAnswer(question.id, { answerText: v.trim() || null });

  const handleOptionToggle = (optId: string) => {
    const multi = question.questionType === 'MULTI_CHOICE';
    if (multi) {
      const current = draft.selectedOptionIds;
      setAnswer(question.id, {
        selectedOptionIds: current.includes(optId)
          ? current.filter((id) => id !== optId)
          : [...current, optId],
      });
    } else {
      setAnswer(question.id, { selectedOptionIds: [optId] });
    }
  };

  const canAdvance = (): boolean => {
    if (!question.isRequired) return true;
    const type: QuestionType = question.questionType;
    if (type === 'TEXT' || type === 'NUMBER' || type === 'DATE') {
      return !!(draft.answerText?.trim());
    }
    if (type === 'YES_NO') return !!(draft.answerText?.trim());
    return draft.selectedOptionIds.length > 0;
  };

  const goNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((n) => n + 1);
    } else {
      navigation.navigate('SurveyReview');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      {/* Progress bar */}
      <View style={{ backgroundColor: '#dbeafe', height: 4 }}>
        <View style={{ height: 4, backgroundColor: '#013358', width: `${progress}%` }} />
      </View>

      {/* Question counter */}
      <View
        style={{
          paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 12, color: '#94a3b8' }}>
          Question {currentIndex + 1} of {total}
        </Text>
        {question.isRequired && (
          <View style={{ backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '600' }}>Required</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Farmer tag */}
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', marginBottom: 18,
            backgroundColor: '#eff6ff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
            alignSelf: 'flex-start',
          }}
        >
          <Ionicons name="person-outline" size={14} color="#013358" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 12, color: '#013358', fontWeight: '600' }}>
            {selectedFarmer.firstName} {selectedFarmer.lastName}
          </Text>
        </View>

        {/* Question text */}
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 20, lineHeight: 24 }}>
          {question.questionText}
        </Text>

        {/* Question input */}
        {question.questionType === 'TEXT' && (
          <TextQuestion
            question={question}
            value={draft.answerText ?? ''}
            onChange={handleTextChange}
          />
        )}
        {question.questionType === 'NUMBER' && (
          <NumberQuestion
            question={question}
            value={draft.answerText ?? ''}
            onChange={handleTextChange}
          />
        )}
        {question.questionType === 'DATE' && (
          <DateQuestion
            value={draft.answerText ?? ''}
            onChange={handleTextChange}
          />
        )}
        {question.questionType === 'YES_NO' && (
          <YesNoQuestion
            value={draft.answerText ?? ''}
            onChange={(v) => setAnswer(question.id, { answerText: v })}
          />
        )}
        {(question.questionType === 'SINGLE_CHOICE' || question.questionType === 'MULTI_CHOICE') && (
          <ChoiceQuestion
            question={question}
            selectedIds={draft.selectedOptionIds}
            onToggle={handleOptionToggle}
            multi={question.questionType === 'MULTI_CHOICE'}
          />
        )}
      </ScrollView>

      {/* Navigation footer */}
      <View
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16,
          flexDirection: 'row', gap: 12,
          borderTopWidth: 1, borderTopColor: '#f1f5f9',
          shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04, shadowRadius: 6, elevation: 4,
        }}
      >
        {currentIndex > 0 && (
          <TouchableOpacity
            onPress={() => setCurrentIndex((n) => n - 1)}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 12,
              backgroundColor: '#f1f5f9', alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: '600', color: '#64748b' }}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={goNext}
          disabled={!canAdvance()}
          style={{
            flex: 2, paddingVertical: 14, borderRadius: 12,
            backgroundColor: canAdvance() ? '#013358' : '#cbd5e1',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontWeight: '700', color: '#fff', fontSize: 15 }}>
            {currentIndex < total - 1 ? 'Next' : 'Review Answers'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
