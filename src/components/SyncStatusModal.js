import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { offlineSyncService } from '../services/offlineSyncService';

export default function SyncStatusModal({ visible, onClose }) {
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadSyncStatus();
    }
  }, [visible]);

  const loadSyncStatus = async () => {
    try {
      setLoading(true);
      const status = await offlineSyncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      const result = await offlineSyncService.syncAllFarms();
      
      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${result.synced} farm(s).\n${result.failed > 0 ? `${result.failed} failed.` : ''}${result.pending > 0 ? `\n${result.pending} still pending.` : ''}`,
          [{ text: 'OK', onPress: loadSyncStatus }]
        );
      } else {
        Alert.alert('Sync Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleRetryFarm = async (farmId) => {
    try {
      Alert.alert(
        'Retry Sync',
        'Do you want to retry syncing this farm?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retry',
            onPress: async () => {
              try {
                await offlineSyncService.retryFailedFarm(farmId);
                Alert.alert('Success', 'Farm synced successfully');
                loadSyncStatus();
              } catch (error) {
                Alert.alert('Retry Failed', error.message);
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleClearSynced = async () => {
    Alert.alert(
      'Clear Synced Farms',
      'Remove all successfully synced farms from the list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await offlineSyncService.clearSyncedFarms();
              loadSyncStatus();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'syncing':
        return '#3b82f6';
      case 'synced':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'syncing':
        return 'sync-outline';
      case 'synced':
        return 'checkmark-circle-outline';
      case 'failed':
        return 'alert-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#013358" />
            <Text style={styles.loadingText}>Loading sync status...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sync Status</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#1f2937" />
          </TouchableOpacity>
        </View>

        {/* Status Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={[styles.networkStatus, syncStatus?.connected ? styles.connected : styles.disconnected]}>
              <Ionicons
                name={syncStatus?.connected ? 'wifi' : 'wifi-outline'}
                size={20}
                color="#ffffff"
              />
              <Text style={styles.networkText}>
                {syncStatus?.connected ? 'Online' : 'Offline'}
              </Text>
            </View>
            <Text style={styles.lastSyncText}>
              Last sync: {formatDate(syncStatus?.lastSync)}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{syncStatus?.pending || 0}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#10b981' }]}>{syncStatus?.synced || 0}</Text>
              <Text style={styles.statLabel}>Synced</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#ef4444' }]}>{syncStatus?.failed || 0}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
          </View>

          {syncStatus?.connected && (syncStatus?.pending > 0 || syncStatus?.failed > 0) && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleSyncNow}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="sync" size={20} color="#ffffff" />
                  <Text style={styles.syncButtonText}>Sync Now</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Farms List */}
        <ScrollView style={styles.farmsList}>
          {syncStatus?.farms && syncStatus.farms.length > 0 ? (
            <>
              {syncStatus.farms.map((farm) => (
                <View key={farm.id} style={styles.farmCard}>
                  <View style={styles.farmHeader}>
                    <View style={styles.farmInfo}>
                      <Text style={styles.farmerName}>
                        {farm.farmer?.firstName} {farm.farmer?.lastName}
                      </Text>
                      <Text style={styles.farmDetails}>
                        {farm.farmData?.primaryCrop || 'Unknown crop'} • {farm.farmData?.farmSize || 'N/A'} hectares
                      </Text>
                      <Text style={styles.timestamp}>{formatDate(farm.timestamp)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(farm.status) }]}>
                      <Ionicons name={getStatusIcon(farm.status)} size={16} color="#ffffff" />
                      <Text style={styles.statusText}>{farm.status}</Text>
                    </View>
                  </View>

                  {farm.lastError && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color="#ef4444" />
                      <Text style={styles.errorText}>{farm.lastError}</Text>
                    </View>
                  )}

                  {farm.status === 'failed' && (
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => handleRetryFarm(farm.id)}
                    >
                      <Ionicons name="refresh" size={16} color="#013358" />
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {syncStatus.synced > 0 && (
                <TouchableOpacity style={styles.clearButton} onPress={handleClearSynced}>
                  <Text style={styles.clearButtonText}>Clear Synced Farms</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-done-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No offline farms</Text>
              <Text style={styles.emptyStateSubtext}>
                Farms added without internet will appear here
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  connected: {
    backgroundColor: '#10b981',
  },
  disconnected: {
    backgroundColor: '#ef4444',
  },
  networkText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#013358',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  syncButton: {
    flexDirection: 'row',
    backgroundColor: '#013358',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  syncButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  farmsList: {
    flex: 1,
    padding: 16,
  },
  farmCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  farmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  farmInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  farmDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    gap: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#ef4444',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#013358',
    gap: 6,
  },
  retryButtonText: {
    color: '#013358',
    fontWeight: '600',
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  clearButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
});
