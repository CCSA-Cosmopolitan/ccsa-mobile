import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import brand from '../theme/brand';
import API_CONFIG from '../config/api';
import { useAuth } from '../store/AuthContext';
import { auth } from '../services/firebase';

export default function AgriBusinessScreen({ navigation }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeads = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AGRIBUSINESS_MOBILE}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setLeads(data.stakeholders || []);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLeads();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  const renderLead = ({ item }) => (
    <View style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <Text style={styles.businessName}>{item.businessName}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      <Text style={styles.contactInfo}>{item.contactName} • {item.email}</Text>
      
      <View style={styles.chips}>
        {item.interests.slice(0, 3).map((interest) => (
          <View key={interest} style={styles.chip}>
            <Text style={styles.chipText}>{interest}</Text>
          </View>
        ))}
        {item.interests.length > 3 && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>+{item.interests.length - 3}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={brand.colors.primaryActive} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={20} color={brand.colors.white} />
        </TouchableOpacity>
        <Text style={styles.eyebrow}>Agri-Business</Text>
        <Text style={styles.title}>Partner Leads</Text>
        <Text style={styles.subtitle}>
          Manage and capture agri-business partners for out-grower schemes and input distribution.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={brand.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={renderLead}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={64} color={brand.colors.lightGray} />
              <Text style={styles.emptyText}>No leads captured yet.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AgriBusinessLeadForm')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={brand.colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.colors.offWhite },
  header: {
    backgroundColor: brand.colors.primary,
    paddingTop: 52,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  eyebrow: {
    color: brand.colors.primaryLight,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { color: brand.colors.white, fontSize: 26, fontWeight: '800' },
  subtitle: { color: brand.colors.primaryLight, fontSize: 13, lineHeight: 20, marginTop: 8 },
  listContent: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: brand.colors.darkGray, marginTop: 12, fontSize: 15 },
  leadCard: {
    backgroundColor: brand.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  leadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  businessName: { fontSize: 16, fontWeight: '700', color: brand.colors.text, flex: 1 },
  statusBadge: { 
    backgroundColor: '#eff6ff', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  statusText: { fontSize: 10, fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase' },
  contactInfo: { fontSize: 13, color: brand.colors.darkGray, marginTop: 6, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: brand.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
});
