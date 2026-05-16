import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSurveyStore } from '../../store/surveyStore';

export default function FarmerSelectScreen({ navigation }: { navigation: any }) {
  const {
    selectedSurvey, loadingDetail, detailError,
    farmerQuery, farmerResults, searchingFarmers, farmerAlreadyCompleted,
    setFarmerQuery, searchFarmers, selectFarmer,
  } = useSurveyStore();

  const [localQuery, setLocalQuery] = useState(farmerQuery);

  if (loadingDetail) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#013358" />
        <Text style={{ color: '#64748b', marginTop: 12 }}>Loading survey…</Text>
      </View>
    );
  }

  if (detailError || !selectedSurvey) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Ionicons name="warning-outline" size={48} color="#fca5a5" />
        <Text style={{ color: '#64748b', marginTop: 12, textAlign: 'center' }}>
          {detailError ?? 'Survey could not be loaded'}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#013358', fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSearch = () => {
    setFarmerQuery(localQuery);
    searchFarmers();
  };

  const handleSelectFarmer = async (farmer: any) => {
    await selectFarmer(farmer);
    if (farmerAlreadyCompleted) {
      Alert.alert(
        'Already Completed',
        `${farmer.firstName} ${farmer.lastName} has already completed this survey.`,
        [{ text: 'OK' }],
      );
      return;
    }
    navigation.navigate('Questionnaire');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <StatusBar barStyle="light-content" backgroundColor="#013358" />
      {/* Navy Header */}
      <View style={{ backgroundColor: '#013358', paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#93c5fd', fontSize: 11, fontWeight: '600' }}>SELECT FARMER</Text>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }} numberOfLines={1}>
              {selectedSurvey.title}
            </Text>
          </View>
        </View>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 }}>
          <Text style={{ color: '#bfdbfe', fontSize: 12 }}>
            {selectedSurvey.questions.length} question{selectedSurvey.questions.length !== 1 ? 's' : ''} · Search and select a farmer below
          </Text>
        </View>
      </View>

      {/* Search input */}
      <View style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#fff', borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 10,
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
          }}
        >
          <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 10 }} />
          <TextInput
            style={{ flex: 1, fontSize: 14, color: '#1e293b' }}
            placeholder="Search by name, NIN or phone…"
            placeholderTextColor="#94a3b8"
            value={localQuery}
            onChangeText={setLocalQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchingFarmers ? (
            <ActivityIndicator size="small" color="#013358" />
          ) : (
            <TouchableOpacity onPress={handleSearch}>
              <Ionicons name="arrow-forward-circle" size={22} color="#013358" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={farmerResults}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          !searchingFarmers && localQuery.trim() ? (
            <View style={{ alignItems: 'center', paddingTop: 48 }}>
              <Ionicons name="person-outline" size={44} color="#cbd5e1" />
              <Text style={{ color: '#94a3b8', marginTop: 12 }}>No farmers found</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelectFarmer(item)}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
              flexDirection: 'row', alignItems: 'center',
              shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
              borderLeftWidth: item.surveyed ? 3 : 0,
              borderLeftColor: '#22c55e',
            }}
          >
            <View
              style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: item.surveyed ? '#dcfce7' : '#dbeafe',
                alignItems: 'center', justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Ionicons
                name={item.surveyed ? 'checkmark-circle' : 'person'}
                size={18}
                color={item.surveyed ? '#16a34a' : '#013358'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                {item.firstName} {item.middleName ? item.middleName + ' ' : ''}{item.lastName}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                NIN: {item.nin} · {item.state ?? '—'}
              </Text>
              {item.surveyed && (
                <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '600', marginTop: 2 }}>
                  Already completed
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
