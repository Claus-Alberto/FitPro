import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import STRINGS from "../../../constants/strings.json";
import { COLORS, SPACING, TYPOGRAPHY } from "../../../constants/theme";
import { WorkoutItem } from "../hooks/useDashboard";

interface DashboardJourneyProps {
  timeline: WorkoutItem[];
  onStartWorkout: () => void;
  onSeeAll: () => void;
}

/**
 * @description Journey/Timeline component displaying user's recent and upcoming workouts.
 * @param {WorkoutItem[]} timeline - List of workout timeline items.
 * @param {function} onStartWorkout - Action triggered to start the current pending workout.
 * @param {function} onSeeAll - Action triggered to open the history modal.
 * @returns {JSX.Element} The rendered journey timeline component.
 */
export const DashboardJourney = ({
  timeline,
  onStartWorkout,
  onSeeAll,
}: DashboardJourneyProps) => {
  return (
    <>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>
          {STRINGS.dashboard.journey.title}
        </Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAllText}>
            {STRINGS.common.actions.seeAll}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timelineWidget}>
        <View style={styles.timelineLine} />
        {timeline.map((item, index) => {
          const prev = timeline[index - 1];
          const isRepeat = item.status === "future" && item.hasData && prev?.status === "future" && prev.title === item.title;
          return (
            <TimelineRow
              key={item.id}
              item={item}
              isLast={index === timeline.length - 1}
              isRepeat={isRepeat}
              onStart={onStartWorkout}
            />
          );
        })}
      </View>
    </>
  );
};

/**
 * @description Internal component for timeline rows to keep main component clean.
 */
const TimelineRow = ({
  item,
  isLast,
  isRepeat,
  onStart,
}: {
  item: WorkoutItem;
  isLast: boolean;
  isRepeat: boolean;
  onStart: () => void;
}) => {
  let dotColor = COLORS.gray200;
  let dotBorder = COLORS.gray200;
  let icon = null;
  let titleColor = COLORS.gray400;

  if (item.status === "completed") {
    dotColor = COLORS.primary;
    dotBorder = COLORS.primary;
    icon = "check";
    titleColor = COLORS.gray800;
  } else if (item.status === "skipped" && item.hasData) {
    // Só o vermelho de "falhou" quando de fato havia um treino marcado — um dia sem nenhum
    // registro (antes de existir ficha, ou app não aberto naquele dia) cai no default acima
    // (ponto cinza neutro), pra não parecer que o usuário falhou algo que nem existia.
    dotColor = COLORS.error;
    dotBorder = COLORS.error;
    icon = "close";
    titleColor = COLORS.gray800;
  } else if (item.status === "pending") {
    dotColor = COLORS.white;
    dotBorder = COLORS.primary;
    titleColor = COLORS.secondary;
  }

  const isToday = item.status === "pending";

  return (
    <View
      style={[
        styles.timelineRow,
        item.status === "completed" || item.status === "skipped" ? styles.timelineRowCompact : null,
        isToday && styles.timelineRowToday,
        isLast && { marginBottom: 0 },
      ]}
    >
      <View style={styles.dateCol}>
        <Text style={[styles.dayText, isToday && styles.todayText]}>
          {item.day}
        </Text>
      </View>
      <View style={styles.nodeCol}>
        <View
          style={[
            styles.node,
            { backgroundColor: dotColor, borderColor: dotBorder },
            isToday && styles.nodePulse,
          ]}
        >
          {icon && (
            <MaterialCommunityIcons
              name={icon as any}
              size={12}
              color={COLORS.white}
            />
          )}
        </View>
      </View>
      <View style={styles.infoCol}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.workoutTitle,
              { color: titleColor },
              isRepeat && styles.workoutTitleRepeat,
            ]}
          >
            {isRepeat ? STRINGS.dashboard.journey.sameWorkout : item.title}
          </Text>
          {item.status === "completed" && (
            <MaterialCommunityIcons
              name="check"
              size={13}
              color={COLORS.primary}
              style={styles.completedIcon}
            />
          )}
        </View>
        {isToday && (
          <Text style={styles.nowLabel}>
            {STRINGS.dashboard.journey.nextStep}
          </Text>
        )}
      </View>
      {isToday && (
        <TouchableOpacity style={styles.playButton} onPress={onStart}>
          <MaterialCommunityIcons
            name="play"
            size={16}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    fontWeight: TYPOGRAPHY.h3.fontWeight,
    color: COLORS.secondary,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  timelineWidget: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    left: 74,
    top: 30,
    bottom: 30,
    width: 2,
    backgroundColor: COLORS.gray100,
    zIndex: 0,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    zIndex: 1,
  },
  timelineRowCompact: {
    // Dias concluídos/pulados já aconteceram e não pedem ação — menos altura pra sobrar espaço
    // visual pro dia de hoje e pros próximos, que são os que importam pro usuário agora.
    marginBottom: 12,
  },
  timelineRowToday: {
    backgroundColor: COLORS.successLight,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginHorizontal: -10,
  },
  dateCol: {
    width: 45,
    alignItems: "flex-end",
    marginRight: 12,
  },
  dayText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray400,
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  nodeCol: {
    width: 20,
    alignItems: "center",
    marginRight: 12,
  },
  node: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  nodePulse: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  workoutTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  workoutTitleRepeat: {
    fontSize: 13,
    fontWeight: "500",
    fontStyle: "italic",
  },
  completedIcon: {
    marginLeft: 6,
    opacity: 0.6,
  },
  nowLabel: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.successLight,
    justifyContent: "center",
    alignItems: "center",
  },
});
