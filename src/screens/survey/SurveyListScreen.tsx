import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSurveyStore } from '../../store/surveyStore';

export default function SurveyListScreen({ navigation }: { navigation: any }) {
  const { surveys, loadingSurveys, surveysError, loadSurveys, selectSurvey, clearSurvey } =
    useSurveyStore();

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadSurveys();
    });
    return unsub;
  }, [navigation]);

  const handleSelect = async (surveyId: string) => {
    clearSurvey();
    await selectSurvey(surveyId);
    navigation.navigate('FarmerSelect');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <StatusBar barStyle="light-content" backgroundColor="#013358" />

      {/* Navy Header */}
      <View style={{ backgroundColor: '#013358', paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: '#93c5fd', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
            CCSA
          </Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 2 }}>Surveys</Text>
          <Text style={{ color: '#93c5fd', fontSize: 13, marginTop: 2 }}>Select a survey to begin</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('AgentProfile')}
          style={{ padding: 4, paddingBottom: 2 }}
        >
          <Ionicons name="person-circle-outline" size={28} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
      </View>

      {loadingSurveys && surveys.length === 0 && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#013358" />
        </View>
      )}

      {surveysError && !loadingSurveys && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="cloud-offline-outline" size={48} color="#cbd5e1" />
          <Text style={{ color: '#64748b', marginTop: 12, textAlign: 'center' }}>
            {surveysError}
          </Text>
          <TouchableOpacity
            onPress={loadSurveys}
            style={{ marginTop: 16, backgroundColor: '#013358', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loadingSurveys && !surveysError && surveys.length === 0 && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="clipboard-outline" size={52} color="#cbd5e1" />
          <Text style={{ color: '#94a3b8', marginTop: 14, fontSize: 15, textAlign: 'center' }}>
            No active surveys at the moment.{'\n'}Check back later.
          </Text>
        </View>
      )}

      <FlatList
        data={surveys}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={loadingSurveys} onRefresh={loadSurveys} colors={['#013358']} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelect(item.id)}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#fff',
              borderRadius: 14,
              padding: 18,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 5,
              elevation: 2,
            }}
          >
            <View
              style={{
                width: 46, height: 46, borderRadius: 12,
                backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Ionicons name="clipboard-outline" size={22} color="#065f46" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>
                {item.title}
              </Text>
              {item.description ? (
                <Text numberOfLines={1} style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {item.description}
                </Text>
              ) : null}
              <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                {item._count.questions} question{item._count.questions !== 1 ? 's' : ''} ·{' '}
                {item._count.responses} response{item._count.responses !== 1 ? 's' : ''}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
