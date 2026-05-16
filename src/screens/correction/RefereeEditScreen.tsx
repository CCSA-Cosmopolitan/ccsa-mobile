import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCorrectionStore } from '../../store/correctionStore';
import type { CorrectionReferee, RefereeOp } from '../../types/correction';

const PRIMARY = '#013358';
const BG = '#f1f5f9';

interface LocalReferee extends CorrectionReferee {
  _deleted?: boolean;
  _isNew?: boolean;
  _dirty?: boolean;
}

function RefereeCard({
  referee,
  index,
  onEdit,
  onDelete,
}: {
  referee: LocalReferee;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (referee._deleted) {
    return (
      <View style={{
        backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: '#fecaca', borderStyle: 'dashed',
        flexDirection: 'row', alignItems: 'center',
      }}>
        <Ionicons name="trash-outline" size={16} color="#ef4444" style={{ marginRight: 10 }} />
        <Text style={{ flex: 1, color: '#ef4444', fontSize: 13, fontStyle: 'italic' }}>
          {referee.firstName} {referee.lastName} — will be removed
        </Text>
      </View>
    );
  }

  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
      borderLeftWidth: 3,
      borderLeftColor: referee._isNew ? '#22c55e' : referee._dirty ? '#f59e0b' : '#e2e8f0',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{
          width: 38, height: 38, borderRadius: 19,
          backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center',
          marginRight: 12,
        }}>
          <Text style={{ color: PRIMARY, fontWeight: '700', fontSize: 15 }}>
            {referee.firstName?.[0] ?? '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', color: '#0f172a', fontSize: 14 }}>
            {referee.firstName} {referee.lastName}
            {referee._isNew && (
              <Text style={{ color: '#22c55e', fontSize: 11 }}> · New</Text>
            )}
            {referee._dirty && !referee._isNew && (
              <Text style={{ color: '#f59e0b', fontSize: 11 }}> · Modified</Text>
            )}
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
            {referee.relationship} · {referee.phone}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={onEdit} style={{ padding: 4 }}>
            <Ionicons name="create-outline" size={18} color={PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={{ padding: 4 }}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function EditRefereeModal({
  referee,
  onSave,
  onCancel,
}: {
  referee: Partial<LocalReferee>;
  onSave: (r: Partial<LocalReferee>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    firstName:    referee.firstName    ?? '',
    lastName:     referee.lastName     ?? '',
    phone:        referee.phone        ?? '',
    relationship: referee.relationship ?? '',
  });

  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 100,
    }}>
      <View style={{
        backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 24, paddingBottom: 40,
      }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 20 }}>
          {referee.id ? 'Edit Referee' : 'Add Referee'}
        </Text>
        {(['firstName', 'lastName', 'phone', 'relationship'] as const).map((field) => (
          <View key={field} style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 5 }}>
              {field === 'firstName' ? 'First Name' :
               field === 'lastName' ? 'Last Name' :
               field === 'phone' ? 'Phone' : 'Relationship'}
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1,
                borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 11,
                fontSize: 14, color: '#0f172a',
              }}
              value={form[field]}
              onChangeText={(v) => setForm((p) => ({ ...p, [field]: v }))}
              keyboardType={field === 'phone' ? 'phone-pad' : 'default'}
              autoCapitalize={field === 'phone' ? 'none' : 'words'}
            />
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <TouchableOpacity
            onPress={onCancel}
            style={{ flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' }}
          >
            <Text style={{ color: '#64748b', fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (!form.firstName || !form.lastName || !form.phone || !form.relationship) {
                Alert.alert('Required', 'All referee fields are required.');
                return;
              }
              onSave(form);
            }}
            style={{ flex: 2, paddingVertical: 13, borderRadius: 10, backgroundColor: PRIMARY, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function RefereeEditScreen({ route, navigation }: { route: any; navigation: any }) {
  const { farmerId } = route.params;
  const { selectedFarmer, savingReferees, saveRefereesError, updateReferees } = useCorrectionStore();

  const [referees, setReferees] = useState<LocalReferee[]>(
    (selectedFarmer?.referees ?? []).map((r) => ({ ...r }))
  );
  const [editingReferee, setEditingReferee] = useState<Partial<LocalReferee> | null>(null);

  const handleEdit = (r: LocalReferee) => setEditingReferee({ ...r });
  const handleAddNew = () => setEditingReferee({ id: undefined, firstName: '', lastName: '', phone: '', relationship: '' });

  const handleDelete = (id: string) => {
    Alert.alert('Remove Referee', 'Mark this referee for removal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setReferees((prev) =>
          prev.map((r) => r.id === id ? { ...r, _deleted: true } : r)
        ),
      },
    ]);
  };

  const handleSaveEdit = (updated: Partial<LocalReferee>) => {
    if (editingReferee?.id) {
      // Update existing
      setReferees((prev) =>
        prev.map((r) =>
          r.id === editingReferee.id ? { ...r, ...updated, _dirty: true } : r
        )
      );
    } else {
      // Add new (no id)
      setReferees((prev) => [
        ...prev,
        {
          id: `_new_${Date.now()}`,
          firstName: updated.firstName!,
          lastName: updated.lastName!,
          phone: updated.phone!,
          relationship: updated.relationship!,
          _isNew: true,
        },
      ]);
    }
    setEditingReferee(null);
  };

  const buildOps = (): RefereeOp[] => {
    const ops: RefereeOp[] = [];
    for (const r of referees) {
      if (r._deleted && !r._isNew) {
        ops.push({ type: 'delete', refereeId: r.id });
      } else if (r._isNew && !r._deleted) {
        ops.push({ type: 'add', firstName: r.firstName, lastName: r.lastName, phone: r.phone, relationship: r.relationship });
      } else if (r._dirty && !r._deleted) {
        ops.push({ type: 'update', refereeId: r.id, firstName: r.firstName, lastName: r.lastName, phone: r.phone, relationship: r.relationship });
      }
    }
    return ops;
  };

  const handleSubmit = async () => {
    const ops = buildOps();
    if (ops.length === 0) {
      Alert.alert('No Changes', 'No referee changes have been made.');
      return;
    }
    const summary = ops.map((op) => {
      if (op.type === 'add') return `• Add: ${op.firstName} ${op.lastName}`;
      if (op.type === 'update') return `• Update: referee`;
      return `• Remove: referee`;
    }).join('\n');

    Alert.alert('Submit Referee Correction', `Changes:\n\n${summary}\n\nSubmit for admin review?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: async () => {
          try {
            await updateReferees(farmerId, ops);
            Alert.alert('Submitted', 'Referee corrections are pending admin review.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          } catch {
            // error shown via saveRefereesError
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={{ backgroundColor: PRIMARY, paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#93c5fd', fontSize: 11, fontWeight: '600' }}>REFEREE CORRECTION</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Edit Referees</Text>
          </View>
          <TouchableOpacity
            onPress={handleAddNew}
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
              paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center',
            }}
          >
            <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 4 }} />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8,
          paddingHorizontal: 12, paddingVertical: 8, marginTop: 8,
        }}>
          <Text style={{ color: '#bfdbfe', fontSize: 12 }}>
            Changes are submitted for admin review before taking effect.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {saveRefereesError && (
          <View style={{
            backgroundColor: '#fef2f2', borderRadius: 10, padding: 12,
            flexDirection: 'row', alignItems: 'center', marginBottom: 16,
          }}>
            <Ionicons name="warning-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={{ color: '#b91c1c', fontSize: 13, flex: 1 }}>{saveRefereesError}</Text>
          </View>
        )}

        {referees.length === 0 && (
          <View style={{
            backgroundColor: '#fff', borderRadius: 12, padding: 32,
            alignItems: 'center',
          }}>
            <Ionicons name="people-outline" size={44} color="#cbd5e1" />
            <Text style={{ color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>
              No referees on record.{'\n'}Tap Add to add a referee.
            </Text>
          </View>
        )}

        {referees.map((r, i) => (
          <RefereeCard
            key={r.id}
            referee={r}
            index={i}
            onEdit={() => handleEdit(r)}
            onDelete={() => handleDelete(r.id)}
          />
        ))}

        <TouchableOpacity
          onPress={handleAddNew}
          style={{
            borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed',
            borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8,
            flexDirection: 'row', justifyContent: 'center', gap: 8,
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="person-add-outline" size={20} color={PRIMARY} />
          <Text style={{ color: PRIMARY, fontWeight: '600', fontSize: 14 }}>Add Referee</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Submit footer */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', padding: 16,
        borderTopWidth: 1, borderTopColor: '#e2e8f0',
        shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 8,
      }}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={savingReferees}
          activeOpacity={0.85}
          style={{
            backgroundColor: savingReferees ? '#94a3b8' : PRIMARY,
            borderRadius: 12, paddingVertical: 15,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {savingReferees ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          )}
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {savingReferees ? 'Submitting…' : 'Submit Referee Corrections'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Edit/Add Modal overlay */}
      {editingReferee !== null && (
        <EditRefereeModal
          referee={editingReferee}
          onSave={handleSaveEdit}
          onCancel={() => setEditingReferee(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}
