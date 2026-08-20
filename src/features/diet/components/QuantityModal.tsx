import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ALL_STRINGS from '../../../constants/strings.json';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import BottomSheetModal from '../../../components/BottomSheetModal';

const STRINGS = ALL_STRINGS.diet;

interface FoodLike {
  name: string;
  kcal_100g: number;
  protein_100g: number;
  carb_100g: number;
  fat_100g: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  food: FoodLike | null;
  /** @description Preenchimento inicial do campo (edição de item existente, ou sugestão de porção de uma receita recém-criada). */
  initialGrams?: number;
  /** @description Rótulo do botão de confirmação — muda conforme o contexto (adicionar / atualizar / adicionar ingrediente). */
  mode: 'add' | 'update' | 'ingredient';
  onConfirm: (grams: number) => void;
}

const MacroBox = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <View style={styles.macroBox}>
    <Text style={[styles.macroBoxValue, { color }]}>{value}</Text>
    <Text style={styles.macroBoxLabel}>{label}</Text>
  </View>
);

/**
 * @description Modal de quantidade — sempre em gramas (o schema de alimentos, baseado em
 * TACO/Open Food Facts, expressa tudo por 100g; não existe mais o conceito de "unidades"
 * arbitrárias como colher/dosador do modelo antigo). Mostra o preview de macros calculado
 * ao vivo a partir do valor por 100g do alimento selecionado.
 */
export default function QuantityModal({ visible, onClose, food, initialGrams, mode, onConfirm }: Props) {
  const [grams, setGrams] = useState('');

  useEffect(() => {
    if (visible) setGrams(initialGrams ? String(initialGrams) : '');
  }, [visible, initialGrams, food]);

  const macros = useMemo(() => {
    if (!food) return { kcal: 0, p: 0, c: 0, f: 0 };
    const qty = parseFloat(grams.replace(',', '.'));
    if (isNaN(qty)) return { kcal: 0, p: 0, c: 0, f: 0 };
    return {
      kcal: Math.round((food.kcal_100g * qty) / 100),
      p: Math.round((food.protein_100g * qty) / 100),
      c: Math.round((food.carb_100g * qty) / 100),
      f: Math.round((food.fat_100g * qty) / 100),
    };
  }, [food, grams]);

  const handleConfirm = () => {
    const qty = parseFloat(grams.replace(',', '.'));
    if (isNaN(qty) || qty <= 0) return;
    onConfirm(qty);
  };

  const ctaLabel = mode === 'update' ? STRINGS.modals.quantity.update : mode === 'ingredient' ? STRINGS.modals.quantity.addIngredient : STRINGS.modals.quantity.add;

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={food?.name || ''} avoidKeyboard maxHeight="80%">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.label}>{STRINGS.modals.quantity.gramsLabel}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.bigInput}
            value={grams}
            onChangeText={setGrams}
            keyboardType="numeric"
            autoFocus
            placeholder="0"
            placeholderTextColor={COLORS.gray200}
          />
          <Text style={styles.unitSuffix}>g</Text>
        </View>

        <View style={styles.macroGrid}>
          <MacroBox label={STRINGS.macros_short.kcal} value={macros.kcal} color={COLORS.gray500} />
          <MacroBox label={STRINGS.macros_short.protein} value={macros.p} color={COLORS.primary} />
          <MacroBox label={STRINGS.macros_short.carbs} value={macros.c} color={COLORS.info} />
          <MacroBox label={STRINGS.macros_short.fat} value={macros.f} color={COLORS.accent} />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleConfirm}>
          <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
          <Text style={styles.saveBtnText}>{ctaLabel}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  label: { ...TYPOGRAPHY.tiny, color: COLORS.gray500, marginBottom: SPACING.sm, textAlign: 'center' },
  inputRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: SPACING.lg },
  bigInput: { fontSize: 48, fontWeight: '900', color: COLORS.secondary, borderBottomWidth: 2, borderBottomColor: COLORS.gray100, minWidth: 100, textAlign: 'center' },
  unitSuffix: { fontSize: 18, fontWeight: '700', color: COLORS.gray400, marginBottom: SPACING.sm, marginLeft: SPACING.sm },
  macroGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.gray100, borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.xl },
  macroBox: { alignItems: 'center', flex: 1 },
  macroBoxValue: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  macroBoxLabel: { ...TYPOGRAPHY.tiny, color: COLORS.gray400 },
  saveBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: SPACING.lg, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16, letterSpacing: 1, marginLeft: SPACING.sm },
});
