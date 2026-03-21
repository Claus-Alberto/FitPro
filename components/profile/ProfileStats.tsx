import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProfileStatsProps {
    streak: number;
    workouts: number;
}

export function ProfileStats({ streak, workouts }: ProfileStatsProps) {
    return (
        <View style={styles.statsRow}>
            <View style={styles.statItem}>
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
                <Text style={styles.statValue}>{workouts}</Text>
                <Text style={styles.statLabel}>Treinos</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
                <Text style={styles.statValue}>15</Text>
                <Text style={styles.statLabel}>Medalhas</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6', marginBottom: 20 },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '800', color: '#191511' },
    statLabel: { fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '700' },
    divider: { width: 1, height: '80%', backgroundColor: '#F3F4F6' },
});
