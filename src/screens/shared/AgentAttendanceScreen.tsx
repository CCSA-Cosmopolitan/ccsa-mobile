import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../store/AuthContext';
import { auth } from '../../services/firebase';

const PRIMARY = '#013358';
const BG = '#f1f5f9';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ts: string | Date | null, includeDate = false): string {
  if (!ts) return '—';
  const d = ts instanceof Date ? ts : new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (!includeDate) return time;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`;
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon, iconColor, label, value,
}: {
  icon: any; iconColor: string; label: string; value: string;
}) {
  return (
    <View style={{
      flex: 1, backgroundColor: '#fff', borderRadius: 12,
      padding: 12, alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
    }}>
      <Ionicons name={icon} size={22} color={iconColor} style={{ marginBottom: 4 }} />
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>{value}</Text>
      <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type AttendanceEntry = {
  type: 'check_in' | 'check_out';
  timestamp: string;
  location: { latitude: number; longitude: number; accuracy?: number } | null;
  agentId: string;
  date: string;
  duration?: number;
};

export default function AgentAttendanceScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth() as any;

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [history, setHistory] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadState();
    loadHistory();
  }, []);

  const loadState = async () => {
    try {
      const checkedIn = await AsyncStorage.getItem('isCheckedIn');
      const checkInTimeStr = await AsyncStorage.getItem('checkInTime');
      if (checkedIn === 'true' && checkInTimeStr) {
        setIsCheckedIn(true);
        setCheckInTime(new Date(checkInTimeStr));
      }
    } catch (e) {
      console.error('loadState:', e);
    }
  };

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem('attendanceHistory');
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {
      console.error('loadHistory:', e);
    }
  };

  const getLocation = async (): Promise<AttendanceEntry['location'] | null> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Location permission is required for attendance.');
      return null;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? undefined,
      };
    } catch {
      Alert.alert('Error', 'Failed to get location. Please try again.');
      return null;
    }
  };

  const syncToServer = async (entry: AttendanceEntry) => {
    try {
      const token = await (auth as any).currentUser?.getIdToken();
      if (!token) return;
      const base = (require('../../config/api').default as any).BASE_URL;
      await fetch(`${base}/api/mobile/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(entry),
      });
    } catch (e) {
      console.error('syncToServer (non-fatal):', e);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const location = await getLocation();
      if (!location) { setLoading(false); return; }
      const agentId = user?.uid || user?.id || (auth as any).currentUser?.uid || '';
      if (!agentId) {
        Alert.alert('Error', 'Not authenticated. Please log in again.');
        setLoading(false);
        return;
      }
      const entry: AttendanceEntry = {
        type: 'check_in',
        timestamp: new Date().toISOString(),
        location,
        agentId,
        date: new Date().toDateString(),
      };
      await AsyncStorage.setItem('isCheckedIn', 'true');
      await AsyncStorage.setItem('checkInTime', entry.timestamp);
      const updated = [...history, entry];
      await AsyncStorage.setItem('attendanceHistory', JSON.stringify(updated));
      await syncToServer(entry);
      setIsCheckedIn(true);
      setCheckInTime(new Date());
      setHistory(updated);
      Alert.alert('Checked In', `You checked in at ${formatTime(entry.timestamp)}.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to check in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const location = await getLocation();
      if (!location) { setLoading(false); return; }
      const agentId = user?.uid || user?.id || (auth as any).currentUser?.uid || '';
      const duration = checkInTime
        ? Math.floor((Date.now() - checkInTime.getTime()) / 60000)
        : 0;
      const entry: AttendanceEntry = {
        type: 'check_out',
        timestamp: new Date().toISOString(),
        location,
        agentId,
        date: new Date().toDateString(),
        duration,
      };
      await AsyncStorage.removeItem('isCheckedIn');
      await AsyncStorage.removeItem('checkInTime');
      const updated = [...history, entry];
      await AsyncStorage.setItem('attendanceHistory', JSON.stringify(updated));
      await syncToServer(entry);
      setIsCheckedIn(false);
      setCheckInTime(null);
      setHistory(updated);
      Alert.alert('Checked Out', `Duration: ${formatDuration(duration)}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to check out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Computed stats
  const today = new Date().toDateString();
  const todayEntries = history.filter((e) => new Date(e.timestamp).toDateString() === today);
  const checkIns = todayEntries.filter((e) => e.type === 'check_in').length;
  const checkOuts = todayEntries.filter((e) => e.type === 'check_out').length;
  const totalMins = todayEntries
    .filter((e) => e.type === 'check_out')
    .reduce((sum, e) => sum + (e.duration || 0), 0);

  const workingMins = isCheckedIn && checkInTime
    ? Math.floor((Date.now() - checkInTime.getTime()) / 60000)
    : null;

  const recentEntries = [...history].reverse().slice(0, 8);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ── Header ── */}
      <View style={{
        backgroundColor: PRIMARY,
        paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12, padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: '#93c5fd', fontSize: 11, fontWeight: '700',
              letterSpacing: 1, textTransform: 'uppercase',
            }}>
              FIELD ATTENDANCE
            </Text>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 1 }}>
              Attendance
            </Text>
          </View>
          <Text style={{ color: '#93c5fd', fontSize: 12 }}>
            {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status card ── */}
        <View style={{
          backgroundColor: '#fff', borderRadius: 16, padding: 20,
          alignItems: 'center', marginBottom: 16,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
        }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: isCheckedIn ? '#dcfce7' : '#f1f5f9',
            alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>
            <Ionicons
              name={isCheckedIn ? 'checkmark-circle' : 'time-outline'}
              size={38}
              color={isCheckedIn ? '#16a34a' : '#94a3b8'}
            />
          </View>

          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>
            {isCheckedIn ? 'Checked In' : 'Not Checked In'}
          </Text>

          {isCheckedIn && checkInTime ? (
            <View style={{ alignItems: 'center', marginTop: 6, marginBottom: 4 }}>
              <Text style={{ color: '#64748b', fontSize: 13 }}>
                Since {formatTime(checkInTime)}
              </Text>
              {workingMins !== null && (
                <View style={{
                  backgroundColor: '#dcfce7', borderRadius: 10,
                  paddingHorizontal: 12, paddingVertical: 4, marginTop: 6,
                }}>
                  <Text style={{ color: '#15803d', fontWeight: '600', fontSize: 13 }}>
                    Working: {formatDuration(workingMins)}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              Tap below to check in for today
            </Text>
          )}

          <TouchableOpacity
            onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
            disabled={loading}
            activeOpacity={0.85}
            style={{
              marginTop: 18, width: '100%',
              backgroundColor: isCheckedIn ? '#b91c1c' : PRIMARY,
              borderRadius: 14, paddingVertical: 14,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons
                name={isCheckedIn ? 'log-out-outline' : 'log-in-outline'}
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginLeft: loading ? 8 : 0 }}>
              {loading ? 'Processing…' : isCheckedIn ? 'Check Out' : 'Check In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Today's stats ── */}
        <Text style={{
          fontSize: 11, fontWeight: '700', color: '#94a3b8',
          letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
        }}>
          TODAY'S SUMMARY
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <StatCard icon="log-in-outline"  iconColor="#16a34a" label="Check-ins"  value={String(checkIns)} />
          <StatCard icon="log-out-outline" iconColor="#b91c1c" label="Check-outs" value={String(checkOuts)} />
          <StatCard icon="time-outline"    iconColor="#2563eb" label="Total Time" value={formatDuration(totalMins)} />
        </View>

        {/* ── Recent activity ── */}
        <Text style={{
          fontSize: 11, fontWeight: '700', color: '#94a3b8',
          letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
        }}>
          RECENT ACTIVITY
        </Text>

        {recentEntries.length === 0 ? (
          <View style={{
            backgroundColor: '#fff', borderRadius: 12, padding: 32,
            alignItems: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
          }}>
            <Ionicons name="time-outline" size={44} color="#cbd5e1" />
            <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 14 }}>
              No attendance records yet
            </Text>
            <Text style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>
              Check in to start tracking
            </Text>
          </View>
        ) : (
          recentEntries.map((item, idx) => {
            const isIn = item.type === 'check_in';
            const lat = item.location?.latitude;
            const lng = item.location?.longitude;
            const hasCoords = typeof lat === 'number' && typeof lng === 'number';
            return (
              <View
                key={`${item.timestamp}-${idx}`}
                style={{
                  backgroundColor: '#fff', borderRadius: 12, padding: 14,
                  flexDirection: 'row', alignItems: 'flex-start',
                  marginBottom: 8,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
                  borderLeftWidth: 3,
                  borderLeftColor: isIn ? '#16a34a' : '#b91c1c',
                }}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 9,
                  backgroundColor: isIn ? '#dcfce7' : '#fee2e2',
                  alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  <Ionicons
                    name={isIn ? 'log-in-outline' : 'log-out-outline'}
                    size={18}
                    color={isIn ? '#16a34a' : '#b91c1c'}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                      {isIn ? 'Checked In' : 'Checked Out'}
                    </Text>
                    <View style={{
                      backgroundColor: isIn ? '#dcfce7' : '#fee2e2',
                      borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
                    }}>
                      <Text style={{
                        fontSize: 10, fontWeight: '700',
                        color: isIn ? '#15803d' : '#b91c1c',
                      }}>
                        {isIn ? 'IN' : 'OUT'}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {formatTime(item.timestamp, true)}
                  </Text>

                  {hasCoords && (
                    <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      📍 {lat!.toFixed(5)}, {lng!.toFixed(5)}
                    </Text>
                  )}

                  {!isIn && item.duration && item.duration > 0 && (
                    <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      Duration: {formatDuration(item.duration)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
