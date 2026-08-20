import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BodyMetricsService } from "../../../features/stats/services/BodyMetricsService";
import STRINGS from "../../../constants/strings.json";
import { COLORS, SHADOWS, SPACING } from "../../../constants/theme";
import WeightLogModal from "./WeightLogModal";

interface DashboardBentoBoxProps {
  /** Último peso registrado (kg), ou null se o usuário nunca registrou nenhum. */
  weight: number | null;
  /** Chamado depois de um registro bem-sucedido, pra quem renderiza recarregar os dados (ex: `useDashboard().refreshDashboard`). */
  onLogged?: () => void;
}

/**
 * @description Bento Box exibindo métricas corporais do usuário (hoje, só peso). Toque no card
 * abre um modal pra registrar um novo peso, persistido via `BodyMetricsService` — mesma fonte
 * usada pela tela de Perfil e por Estatísticas.
 * @param {number | null} weight - Último peso registrado do usuário, ou null se nunca houve registro.
 * @param {() => void} [onLogged] - Callback disparado após salvar um novo peso.
 * @returns {JSX.Element} The rendered Bento Box metrics component.
 */
export const DashboardBentoBox = ({ weight, onLogged }: DashboardBentoBoxProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = async (kg: number) => {
    await BodyMetricsService.logMetric('weight_kg', kg);
    onLogged?.();
  };

  return (
    <View style={styles.bentoContainer}>
      <TouchableOpacity activeOpacity={0.8} style={styles.wideWidget} onPress={() => setIsModalOpen(true)}>
        <View>
          <Text style={styles.widgetLabel}>
            {STRINGS.dashboard.metrics.weightLabel}
          </Text>
          <Text style={styles.widgetValue}>
            {weight !== null ? (
              <>
                {weight} <Text style={styles.unit}>{STRINGS.common.units.kg}</Text>
              </>
            ) : (
              <Text style={styles.widgetValueEmpty}>{STRINGS.dashboard.metrics.weightEmpty}</Text>
            )}
          </Text>
        </View>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name="chart-line"
            size={24}
            color={COLORS.primary}
          />
        </View>
      </TouchableOpacity>

      <WeightLogModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentWeight={weight}
        onSave={handleSave}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bentoContainer: {
    marginBottom: SPACING.lg,
  },
  wideWidget: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.soft,
  },
  widgetLabel: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: 4,
    fontWeight: "600",
  },
  widgetValue: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.secondary,
  },
  unit: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray400,
  },
  widgetValueEmpty: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.successLight,
    justifyContent: "center",
    alignItems: "center",
  },
});
