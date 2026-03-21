import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WorkoutTimerProps {
    elapsedTime: number;
    exercises: any[];
    currentExerciseIndex: number;
    checkExerciseCompletion: (index: number) => boolean;
    onFinish: () => void;
    topInset: number;
}

export function WorkoutTimer({ elapsedTime, exercises, currentExerciseIndex, checkExerciseCompletion, onFinish, topInset }: WorkoutTimerProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <View style={[styles.header, { paddingTop: topInset + 10 }]}>
            <View style={styles.timerContainer}>
                <MaterialCommunityIcons name="clock-outline" size={18} color="#FFF" />
                <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
            </View>
            <View style={styles.progressPills}>
                {exercises.map((_, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.pill,
                            idx === currentExerciseIndex ? styles.pillActive :
                                checkExerciseCompletion(idx) ? styles.pillCompleted : styles.pillInactive
                        ]}
                    />
                ))}
            </View>
            <TouchableOpacity style={styles.finishBtn} onPress={onFinish}>
                <Text style={styles.finishText}>FINALIZAR</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, zIndex: 10 },
    timerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    timerText: { fontSize: 16, fontWeight: '700', color: '#FFF', fontVariant: ['tabular-nums'] },
    finishBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    finishText: { color: '#EF4444', fontWeight: '800', fontSize: 12 },
    progressPills: { flexDirection: 'row', gap: 4 },
    pill: { width: 20, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
    pillActive: { backgroundColor: '#FFFFFF', width: 30 },
    pillCompleted: { backgroundColor: '#008E00' },
    pillInactive: { backgroundColor: 'rgba(255,255,255,0.3)' },
});
