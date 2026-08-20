import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Design System & Components
import HistoryCalendarModal from "../../../../components/HistoryCalendarModal";
import WaterModal from "../../../components/WaterModal";
import { COLORS, SPACING } from "../../../constants/theme";
import { DashboardActionGrid } from "../components/DashboardActionGrid";
import { DashboardBentoBox } from "../components/DashboardBentoBox";
import { DashboardHeader } from "../components/DashboardHeader";
import { DashboardHeroCard } from "../components/DashboardHeroCard";
import { DashboardJourney } from "../components/DashboardJourney";
import { DashboardSocialProof } from "../components/DashboardSocialProof";

// Utils
import { DateUtils } from "../../../utils/DateUtils";

// Logic
import { useDashboard } from "../hooks/useDashboard";

const { width } = Dimensions.get("window");

/**
 * @description Dashboard Screen (HomeScreen) for FitPro.
 * Follows "Premium Personal Trainer" voice and sales psychology.
 */
export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const { user, timeline, nutrition, water, waterGoal, addWater, setWaterGoal, refreshDashboard } = useDashboard();

  const startWorkout = () => {
    router.push("/workout/active");
  };

  const formattedDate = DateUtils.getFormattedShortDate();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <DashboardHeader userName={user.name} formattedDate={formattedDate} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO CARD: Visão Geral e Nutrição */}
        <DashboardHeroCard
          streak={user.streak}
          nutrition={nutrition}
          water={water}
          waterGoal={waterGoal}
          onOpenWater={() => setIsWaterModalOpen(true)}
        />

        {/* BENTO BOX: Métricas Corporais */}
        <DashboardBentoBox weight={user.weight} onLogged={refreshDashboard} />

        {/* GRID DE AÇÃO: Rapidez e Facilidade */}
        <DashboardActionGrid onStartWorkout={startWorkout} onOpenWater={() => setIsWaterModalOpen(true)} />

        {/* SEÇÃO JORNADA: Recompensas e Histórico */}
        <DashboardJourney
          timeline={timeline}
          onStartWorkout={startWorkout}
          onSeeAll={() => setIsHistoryModalOpen(true)}
        />

        {/* SOCIAL PROOF: Gatilho de Comunidade */}
        <DashboardSocialProof />

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAIS REUTILIZÁVEIS */}
      <HistoryCalendarModal
        visible={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
      <WaterModal
        visible={isWaterModalOpen}
        onClose={() => setIsWaterModalOpen(false)}
        current={water}
        goal={waterGoal}
        onAdd={addWater}
        onChangeGoal={setWaterGoal}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 0,
  },
});
