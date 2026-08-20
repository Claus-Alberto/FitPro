import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ALL_STRINGS from '../constants/strings.json';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import BottomSheetModal from './BottomSheetModal';
import ProgressRing from './ProgressRing';

const STRINGS = ALL_STRINGS.diet;

interface Props {
  visible: boolean;
  onClose: () => void;
  current: number;
  goal: number;
  onAdd: (ml: number) => void;
  onChangeGoal: (ml: number) => void;
}

/**
 * @description Registro de água do dia — componente genérico e compartilhado (usado tanto no FAB
 * de água da aba Dieta quanto na ação "Hidratação" da Home). Persistência real fica a cargo de
 * quem chama (`onAdd`/`onChangeGoal`), não deste componente.
 */
export default function WaterModal({ visible, onClose, current, goal, onAdd, onChangeGoal }: Props) {
  const [amount, setAmount] = useState('250');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(String(goal));

  useEffect(() => {
    if (visible) { setAmount('250'); setIsEditingGoal(false); setTempGoal(String(goal)); }
  }, [visible, goal]);

  const adjust = (delta: number) => setAmount(String(Math.max(0, (parseInt(amount) || 0) + delta)));

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={STRINGS.modals.water.title}>
      <View style={styles.ringWrap}>
        <ProgressRing size={180} strokeWidth={15} progress={goal > 0 ? current / goal : 0} color={COLORS.info}>
          <MaterialCommunityIcons name="water" size={36} color={COLORS.info} style={{ marginBottom: SPACING.sm }} />
          <Text style={styles.currentValue}>{current}</Text>
          <View style={styles.goalRow}>
            <Text style={styles.goalText}>{STRINGS.modals.water.goal} {goal}{STRINGS.modals.water.unit}</Text>
            <TouchableOpacity onPress={() => { setTempGoal(String(goal)); setIsEditingGoal(true); }} style={{ marginLeft: SPACING.xs }}>
              <MaterialCommunityIcons name="pencil" size={16} color={COLORS.info} />
            </TouchableOpacity>
          </View>
        </ProgressRing>
      </View>

      {isEditingGoal ? (
        <View style={styles.goalEditRow}>
          <TextInput style={styles.goalInput} value={tempGoal} onChangeText={setTempGoal} keyboardType="numeric" autoFocus />
          <TouchableOpacity
            style={styles.goalSaveBtn}
            onPress={() => { onChangeGoal(parseInt(tempGoal) || goal); setIsEditingGoal(false); }}
          >
            <Text style={styles.goalSaveText}>{STRINGS.modals.water.save}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.controlBtn} onPress={() => adjust(-250)}>
              <MaterialCommunityIcons name="minus" size={24} color={COLORS.info} />
            </TouchableOpacity>
            <View style={styles.amountBox}>
              <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount} keyboardType="numeric" />
              <Text style={styles.amountUnit}>{STRINGS.modals.water.unit}</Text>
            </View>
            <TouchableOpacity style={styles.controlBtn} onPress={() => adjust(250)}>
              <MaterialCommunityIcons name="plus" size={24} color={COLORS.info} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { const ml = parseInt(amount) || 0; if (ml > 0) onAdd(ml); }}
          >
            <Text style={styles.addBtnText}>{STRINGS.modals.water.add}</Text>
          </TouchableOpacity>
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  ringWrap: { alignItems: 'center', marginBottom: SPACING.huge },
  currentValue: { fontSize: 32, fontWeight: '800', color: COLORS.secondary },
  goalRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs },
  goalText: { fontSize: 14, color: COLORS.gray500, fontWeight: '600' },
  goalEditRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  goalInput: { flex: 1, backgroundColor: COLORS.gray100, borderRadius: 12, paddingVertical: SPACING.md, fontSize: 16, fontWeight: '700', color: COLORS.secondary, textAlign: 'center', marginRight: SPACING.md },
  goalSaveBtn: { backgroundColor: COLORS.info, borderRadius: 16, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  goalSaveText: { color: COLORS.white, fontWeight: '800' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xxl },
  controlBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.info + '1A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.info + '40' },
  amountBox: { alignItems: 'center', width: 100, marginHorizontal: SPACING.xl },
  amountInput: { fontSize: 24, fontWeight: '800', color: COLORS.secondary, textAlign: 'center', borderBottomWidth: 2, borderBottomColor: COLORS.info, width: '100%', paddingBottom: SPACING.xs },
  amountUnit: { ...TYPOGRAPHY.tiny, color: COLORS.gray400 },
  addBtn: { backgroundColor: COLORS.info, borderRadius: 16, paddingVertical: SPACING.lg, alignItems: 'center' },
  addBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16, letterSpacing: 1 },
});
