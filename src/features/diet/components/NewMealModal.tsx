import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import ALL_STRINGS from '../../../constants/strings.json';
import { COLORS, SPACING } from '../../../constants/theme';
import BottomSheetModal from '../../../components/BottomSheetModal';

const STRINGS = ALL_STRINGS.diet;

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (title: string, time: string) => void | Promise<void>;
}

/** @description Criação de uma refeição extra (fora do café/almoço/lanche/janta padrão do dia). */
export default function NewMealModal({ visible, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [tempDate, setTempDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) { setTitle(''); setTime(''); setShowPicker(false); setIsSaving(false); }
  }, [visible]);

  const onChangeTime = (_e: any, d?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (d) {
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      setTime(`${h}:${m}`);
      setTempDate(d);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert(ALL_STRINGS.diet.alerts.error, STRINGS.modals.newMeal.errorName);
    setIsSaving(true);
    try {
      await onCreate(title.trim(), time || '00:00');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={STRINGS.modals.newMeal.title} avoidKeyboard>
      <Text style={styles.label}>{STRINGS.modals.newMeal.nameLabel}</Text>
      <TextInput style={styles.input} placeholder={STRINGS.modals.newMeal.namePlaceholder} placeholderTextColor={COLORS.gray400} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>{STRINGS.modals.newMeal.timeLabel}</Text>
      <TouchableOpacity style={styles.timeInput} onPress={() => setShowPicker(true)}>
        <Text style={[styles.timeText, !time && styles.placeholder]}>{time || '00:00'}</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker value={tempDate} mode="time" is24Hour display="default" onChange={onChangeTime} />
      )}

      <TouchableOpacity style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} onPress={handleCreate} disabled={isSaving}>
        {isSaving ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.saveBtnText}>{STRINGS.modals.newMeal.create}</Text>
        )}
      </TouchableOpacity>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', color: COLORS.gray500, marginBottom: SPACING.sm, textTransform: 'uppercase' },
  input: { backgroundColor: COLORS.gray100, borderRadius: 12, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md + 2, fontSize: 16, fontWeight: '600', color: COLORS.secondary, marginBottom: SPACING.xl },
  timeInput: { backgroundColor: COLORS.gray100, borderRadius: 12, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md + 2, marginBottom: SPACING.xl },
  timeText: { fontSize: 16, fontWeight: '600', color: COLORS.secondary },
  placeholder: { color: COLORS.gray400 },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: SPACING.lg, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16, letterSpacing: 1 },
});
