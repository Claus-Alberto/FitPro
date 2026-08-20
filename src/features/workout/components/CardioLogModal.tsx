import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import BottomSheetModal from '../../../components/BottomSheetModal';
import ALL_STRINGS from '../../../constants/strings.json';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { CardioEntry, CardioService } from '../services/CardioService';

const STRINGS = ALL_STRINGS.workout.cardioModal;

// Habilita `LayoutAnimation` no Android (é opt-in lá; no iOS já funciona por padrão) — mesmo
// padrão usado em `components/profile/ProfileGallery.tsx`.
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

/**
 * @description Atividades pré-definidas (chips) — os rótulos dobram como o valor persistido em
 * `CardioLog.activity` e como chave de `CardioService.KCAL_PER_MIN`, então não vêm de
 * `strings.json` (mesmo padrão de `BODY_PARTS_PT` em `ExercisePickerModal`: dado + rótulo juntos).
 * "Outro" abre um campo de texto livre em vez de logar como "Outro" literal.
 */
const ACTIVITIES: { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { label: 'Corrida', icon: 'run' },
  { label: 'Caminhada', icon: 'walk' },
  { label: 'Futebol', icon: 'soccer' },
  { label: 'Vôlei', icon: 'volleyball' },
  { label: 'Ciclismo', icon: 'bike' },
  { label: 'Natação', icon: 'swim' },
  { label: 'Outro', icon: 'dots-horizontal' },
];

// Só faz sentido registrar distância pra atividades de deslocamento — Futebol/Vôlei/Outro
// não têm uma distância percorrida relevante pro usuário registrar.
const ACTIVITIES_WITH_DISTANCE = ['Corrida', 'Caminhada', 'Ciclismo'];

/** @description Formata 'YYYY-MM-DD' para 'DD/MM', consistente com o resto da UI em pt-BR. */
const formatDateShort = (isoDate: string): string => {
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  /** @description Chamado após persistir com sucesso — quem chama decide o feedback/fechamento (mesmo padrão de `CustomFoodModal`/`DietScreen`). */
  onSaved: (entry: CardioEntry) => void;
}

/**
 * @description Registro manual de atividades de esporte/cardio (fora da ficha de musculação) —
 * grava em `CardioLog` via `CardioService.logActivity`, que também estima o gasto calórico.
 * Mostra os últimos registros para dar contexto de progresso ao reabrir o modal.
 */
export function CardioLogModal({ visible, onClose, onSaved }: Props) {
  const [selectedActivity, setSelectedActivity] = useState('Corrida');
  const [customActivity, setCustomActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [recent, setRecent] = useState<CardioEntry[]>([]);

  useEffect(() => {
    if (!visible) {
      setSelectedActivity('Corrida');
      setCustomActivity('');
      setDuration('');
      setDistance('');
      setIsSaving(false);
      return;
    }
    let cancelled = false;
    CardioService.getRecent(3).then((data) => { if (!cancelled) setRecent(data); });
    return () => { cancelled = true; };
  }, [visible]);

  const showsDistance = ACTIVITIES_WITH_DISTANCE.includes(selectedActivity);

  const handleSave = async () => {
    const activity = selectedActivity === 'Outro' ? customActivity.trim() : selectedActivity;
    if (!activity) {
      Alert.alert(ALL_STRINGS.diet.alerts.error, STRINGS.errorActivity);
      return;
    }
    const durationMinutes = parseInt(duration, 10);
    if (!durationMinutes || durationMinutes <= 0) {
      Alert.alert(ALL_STRINGS.diet.alerts.error, STRINGS.errorDuration);
      return;
    }
    const distanceKm = showsDistance && distance ? parseFloat(distance.replace(',', '.')) : null;

    setIsSaving(true);
    try {
      const entry = await CardioService.logActivity({ activity, durationMinutes, distanceKm });
      onSaved(entry);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={STRINGS.title} avoidKeyboard maxHeight="90%">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>{STRINGS.activityLabel}</Text>
        <View style={styles.chipsRow}>
          {ACTIVITIES.map((item) => {
            const active = selectedActivity === item.label;
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  // Anima a entrada/saída do campo de distância e do campo "Outro" em vez de um
                  // salto abrupto de layout — chamado antes do setState que muda a visibilidade.
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSelectedActivity(item.label);
                }}
              >
                <MaterialCommunityIcons name={item.icon} size={15} color={active ? COLORS.white : COLORS.gray500} style={styles.chipIcon} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedActivity === 'Outro' && (
          <TextInput
            style={styles.input}
            placeholder={STRINGS.otherPlaceholder}
            placeholderTextColor={COLORS.gray400}
            value={customActivity}
            onChangeText={setCustomActivity}
          />
        )}

        <Text style={styles.label}>{STRINGS.durationLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={COLORS.gray400}
          keyboardType="numeric"
          value={duration}
          onChangeText={setDuration}
        />

        {showsDistance && (
          <>
            <Text style={styles.label}>{STRINGS.distanceLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={COLORS.gray400}
              keyboardType="numeric"
              value={distance}
              onChangeText={setDistance}
            />
          </>
        )}

        <TouchableOpacity style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>{STRINGS.save}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.recentTitle}>{STRINGS.recentTitle}</Text>
        {recent.length === 0 ? (
          <Text style={styles.recentEmpty}>{STRINGS.recentEmpty}</Text>
        ) : (
          recent.map((item) => (
            <View key={item.id} style={styles.recentRow}>
              <View style={styles.recentIconBox}>
                <MaterialCommunityIcons
                  name={ACTIVITIES.find((a) => a.label === item.activity)?.icon || 'run'}
                  size={16}
                  color={COLORS.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentActivity}>{item.activity}</Text>
                <Text style={styles.recentMeta}>
                  {formatDateShort(item.date)} · {item.duration_minutes} min{item.kcal_estimate ? ` · ${item.kcal_estimate} kcal` : ''}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  label: { ...TYPOGRAPHY.tiny, color: COLORS.gray500, marginBottom: SPACING.sm },
  input: { backgroundColor: COLORS.gray100, borderRadius: 12, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md + 2, fontSize: 16, fontWeight: '600', color: COLORS.secondary, marginBottom: SPACING.xl },
  // `gap` evitado de propósito (bug documentado) — espaçamento via marginRight/marginBottom nos chips.
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.lg },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 20, backgroundColor: COLORS.gray100, marginRight: SPACING.sm, marginBottom: SPACING.sm },
  chipActive: { backgroundColor: COLORS.secondary },
  chipIcon: { marginRight: SPACING.xs },
  chipText: { fontSize: 13, fontWeight: '700', color: COLORS.gray500 },
  chipTextActive: { color: COLORS.white },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: SPACING.lg, alignItems: 'center', marginTop: SPACING.xs },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  recentTitle: { ...TYPOGRAPHY.tiny, color: COLORS.gray500, marginTop: SPACING.xxl, marginBottom: SPACING.md },
  recentEmpty: { fontSize: 13, color: COLORS.gray400, fontWeight: '600', marginBottom: SPACING.md },
  recentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray100, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.sm },
  recentIconBox: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.successLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md, flexShrink: 0 },
  recentActivity: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  recentMeta: { fontSize: 11, color: COLORS.gray500, fontWeight: '600', marginTop: 2 },
});
