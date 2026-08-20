import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ALL_STRINGS from '../../../constants/strings.json';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { DietService, FoodEntry } from '../services/DietService';

const STRINGS = ALL_STRINGS.diet;

interface Props {
  visible: boolean;
  /** @description Modo "ingrediente" (montando uma receita) troca só o título — o resto do fluxo de busca é idêntico. */
  mode: 'meal' | 'ingredient';
  onClose: () => void;
  onSelect: (food: FoodEntry) => void;
  /** @description Botão "+" no header — abre o menu de criação (foto / alimento / receita). */
  onCreatePress: () => void;
}

/**
 * @description Busca de alimentos em tela cheia (mesmo padrão de `ExercisePickerModal`: header
 * com voltar + título, barra de busca, lista abaixo) — usada tanto para adicionar um item a uma
 * refeição quanto para escolher um ingrediente de receita. Busca de verdade via
 * `DietService.searchFoods`, sobre o catálogo TACO + alimentos customizados do usuário.
 */
export default function FoodSearchModal({ visible, mode, onClose, onSelect, onCreatePress }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setIsLoading(true);
    const handle = setTimeout(async () => {
      try {
        const data = await DietService.searchFoods(query);
        if (!cancelled) setResults(data);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [visible, query]);

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const sourceLabel = (food: FoodEntry) => {
    if (food.source === 'custom') return STRINGS.modals.foodSearch.sourceCustom;
    if (food.source === 'off') return STRINGS.modals.foodSearch.sourceScanned;
    return food.category || null;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn} accessibilityLabel="Fechar" accessibilityRole="button">
            <MaterialCommunityIcons name="close" size={28} color={COLORS.secondary} />
          </TouchableOpacity>
          <Text style={styles.title}>{mode === 'ingredient' ? STRINGS.modals.foodSearch.titleIngredient : STRINGS.modals.foodSearch.titleAdd}</Text>
          <TouchableOpacity onPress={onCreatePress} style={styles.iconBtn} accessibilityLabel="Criar novo" accessibilityRole="button">
            <MaterialCommunityIcons name="plus" size={26} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={22} color={COLORS.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder={STRINGS.modals.foodSearch.placeholder}
            placeholderTextColor={COLORS.gray400}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>

        {isLoading ? (
          <View style={styles.centerBox}><ActivityIndicator color={COLORS.primary} /></View>
        ) : results.length === 0 ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons name="magnify-close" size={32} color={COLORS.gray200} />
            <Text style={styles.emptyText}>{STRINGS.modals.foodSearch.noResults}</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: insets.bottom + SPACING.xl }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultRow} onPress={() => onSelect(item)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.resultMetaRow}>
                    <Text style={styles.resultMacros}>{Math.round(item.kcal_100g)} {STRINGS.modals.foodSearch.kcalPer100}</Text>
                    {sourceLabel(item) ? (
                      <View style={styles.tag}><Text style={styles.tagText}>{sourceLabel(item)}</Text></View>
                    ) : null}
                  </View>
                </View>
                <MaterialCommunityIcons name="plus-circle" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.xl, marginBottom: SPACING.md },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { ...TYPOGRAPHY.h3, color: COLORS.secondary },
  searchRow: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    height: 50,
    borderRadius: 16,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.soft,
  },
  searchInput: { flex: 1, marginLeft: SPACING.sm, fontSize: 16, color: COLORS.secondary, fontWeight: '600' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: COLORS.gray400, fontWeight: '600', marginTop: SPACING.sm },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  resultName: { fontSize: 16, fontWeight: '700', color: COLORS.secondary, marginBottom: 4 },
  resultMetaRow: { flexDirection: 'row', alignItems: 'center' },
  resultMacros: { fontSize: 12, color: COLORS.gray400, fontWeight: '500', marginRight: SPACING.sm },
  tag: { backgroundColor: COLORS.successLight, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: 8 },
  tagText: { fontSize: 10, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase' },
});
