import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ALL_STRINGS from '../../../constants/strings.json';
import { COLORS, SPACING } from '../../../constants/theme';
import BottomSheetModal from '../../../components/BottomSheetModal';

const STRINGS = ALL_STRINGS.diet;

interface Props {
  visible: boolean;
  onClose: () => void;
  photoUri: string | null;
  /** @description Segue pro fluxo manual de busca/cadastro de alimento — não existe reconhecimento automático de imagem configurado neste projeto. */
  onAddManually: () => void;
}

/**
 * @description Registro visual do prato por foto. Não há integração de visão computacional
 * configurada neste projeto (sem SDK, sem chave de API) — em vez de fingir uma análise, avisa o
 * usuário com um tom transparente e leva direto pro fluxo manual (busca/cadastro de alimento).
 */
export default function PhotoAnalysisModal({ visible, onClose, photoUri, onAddManually }: Props) {
  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={STRINGS.modals.photo.title} maxHeight="90%">
      <View style={styles.previewBox}>
        {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}
      </View>

      <View style={styles.noticeCard}>
        <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.accent} style={{ marginRight: SPACING.sm }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.noticeTitle}>{STRINGS.modals.photo.notAvailableTitle}</Text>
          <Text style={styles.noticeText}>{STRINGS.modals.photo.notAvailableMsg}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.cta} onPress={onAddManually}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.white} />
        <Text style={styles.ctaText}>{STRINGS.modals.photo.manualCta}</Text>
      </TouchableOpacity>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  previewBox: { width: '100%', height: 220, backgroundColor: COLORS.gray100, borderRadius: 20, marginBottom: SPACING.xl, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  preview: { width: '100%', height: '100%', resizeMode: 'cover' },
  noticeCard: { flexDirection: 'row', backgroundColor: COLORS.warningLight, borderRadius: 16, padding: SPACING.lg, marginBottom: SPACING.xl, alignItems: 'flex-start' },
  noticeTitle: { fontSize: 13, fontWeight: '800', color: COLORS.accent, marginBottom: 2 },
  noticeText: { fontSize: 14, color: COLORS.gray800, lineHeight: 20 },
  cta: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: SPACING.lg, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  ctaText: { color: COLORS.white, fontWeight: '800', fontSize: 16, marginLeft: SPACING.sm },
});
