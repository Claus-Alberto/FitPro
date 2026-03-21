import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DaySchedule {
    id: string;
    day: string;
    date: string;
    status: string;
    workout: any;
}

interface WeeklyTimelineProps {
    schedule: DaySchedule[];
    selectedIndex: number;
    onDayPress: (index: number) => void;
    onCalendarPress: () => void;
}

export function WeeklyTimeline({ schedule, selectedIndex, onDayPress, onCalendarPress }: WeeklyTimelineProps) {
    return (
        <View style={styles.timelineSection}>
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Sua Semana</Text>
                <TouchableOpacity onPress={onCalendarPress}>
                    <Text style={styles.seeAllText}>Ver Calendário</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.timelineRow}>
                {schedule.map((item, index) => {
                    const isSelected = selectedIndex === index;
                    let bgColor = 'transparent'; let textColor = '#6B7280'; let borderColor = 'transparent'; let icon = null;

                    if (item.status === 'today') { bgColor = '#191511'; textColor = '#FFFFFF'; }
                    else if (item.status === 'completed') { bgColor = '#E3F9E5'; textColor = '#008E00'; icon = 'check'; }
                    else if (item.status === 'skipped') { bgColor = '#FEF2F2'; textColor = '#EF4444'; icon = 'close'; }
                    else if (item.status === 'rest') { textColor = '#3B82F6'; icon = 'coffee'; }

                    if (isSelected && item.status !== 'today') { borderColor = '#008E00'; }

                    return (
                        <TouchableOpacity key={item.day} style={styles.dayColumn} onPress={() => onDayPress(index)}>
                            <Text style={[styles.dayLabel, isSelected && { color: '#008E00' }]}>{item.day}</Text>
                            <View style={[styles.dayCircle, { backgroundColor: bgColor, borderColor, borderWidth: 1 }]}>
                                {item.status === 'today' ? (
                                    <Text style={[styles.dateText, { color: textColor }]}>{item.date}</Text>
                                ) : icon ? (
                                    <MaterialCommunityIcons name={icon as any} size={14} color={textColor} />
                                ) : (
                                    <Text style={[styles.dateText, { color: textColor }]}>{item.date}</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    timelineSection: { paddingVertical: 24, paddingHorizontal: 20, paddingTop: 0 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#191511' },
    seeAllText: { fontSize: 14, fontWeight: '700', color: '#008E00' },
    timelineRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayColumn: { alignItems: 'center', gap: 8 },
    dayLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700' },
    dayCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderColor: '#E5E7EB' },
    dateText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
});
