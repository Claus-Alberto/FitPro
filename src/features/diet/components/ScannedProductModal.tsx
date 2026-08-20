import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ALL_STRINGS from '../../../constants/strings.json';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import BottomSheetModal from '../../../components/BottomSheetModal';
import { FoodEntry, Meal } from '../services/DietService';

const STRINGS = ALL_STRINGS.diet;

interface Props {
  visible: boolean;
  onClose: () => void;
  product: FoodEntry | null;
  meals: Meal[];
  targetMealId: string | null;
  onSelectTargetMeal: (mealId: string) => void;
  onConfirm: () => void;
}

/**
 * @description Confirmação de um produto encontrado via `DietService.lookupBarcode` (cache local
 * ou Open Food Facts). Deixa o usuário escolher em qual refeição lançar antes de seguir pro
 * `QuantityModal` (que faz a pergunta real de quantidade em gramas).
 */
export default function ScannedProductModal({ visible, onClose, product, meals, targetMealId, onSelectTargetMeal, onConfirm }: Props) {
  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={STRINGS.modals.scanner.foundTitle}>
      {product && (
        <>
          <View style={styles.productCard}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.macroGrid}>
              <View style={styles.macroBox}><Text style={[styles.macroValue, { color: COLORS.gray500 }]}>{Math.round(product.kcal_100g)}</Text><Text style={styles.macroLabel}>KCAL/100G</Text></View>
              <View style={styles.macroBox}><Text style={[styles.macroValue, { color: COLORS.primary }]}>{Math.round(product.protein_100g)}g</Text><Text style={styles.macroLabel}>PROT</Text></View>
              <View style={styles.macroBox}><Text style={[styles.macroValue, { color: COLORS.info }]}>{Math.round(product.carb_100g)}g</Text><Text style={styles.macroLabel}>CARB</Text></View>
              <View style={styles.macroBox}><Text style={[styles.macroValue, { color: COLORS.accent }]}>{Math.round(product.fat_100g)}g</Text><Text style={styles.macroLabel}>GORD</Text></View>
            </View>
          </View>

          <Text style={styles.label}>{STRINGS.modals.scanner.addIn}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.xl }}>
            {meals.map((m) => {
              const isSelected = targetMealId === m.id;
              return (
                <TouchableOpacity key={m.id} style={[styles.pill, isSelected && styles.pillActive, { marginRight: SPACING.sm }]} onPress={() => onSelectTargetMeal(m.id)}>
                  <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{m.title}</Text>
                  {isSelected && <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.primary} style={{ marginLeft: SPACING.xs }} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
            <Text style={styles.confirmText}>{STRINGS.modals.scanner.confirm}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  productCard: { backgroundColor: COLORS.background, borderRadius: 16, padding: SPACING.lg, marginBottom: SPACING.xl },
  productName: { fontSize: 18, fontWeight: '700', color: COLORS.secondary, textAlign: 'center' },
  macroGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.lg },
  macroBox: { alignItems: 'center', flex: 1 },
  macroValue: { fontSize: 16, fontWeight: '800' },
  macroLabel: { ...TYPOGRAPHY.tiny, color: COLORS.gray400, marginTop: 2 },
  label: { ...TYPOGRAPHY.tiny, color: COLORS.gray500, marginBottom: SPACING.sm },
  pill: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderRadius: 12, backgroundColor: COLORS.gray100 },
  pillActive: { backgroundColor: COLORS.successLight, borderWidth: 1, borderColor: COLORS.primary },
  pillText: { color: COLORS.gray500, fontWeight: '600' },
  pillTextActive: { color: COLORS.primary, fontWeight: '700' },
  confirmBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: SPACING.lg, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  confirmText: { color: COLORS.white, fontWeight: '800', fontSize: 16, marginRight: SPACING.sm },
});
