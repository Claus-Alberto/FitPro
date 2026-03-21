import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RestOverlayProps {
    isVisible: boolean;
    restTime: number;
    onAdd30s: () => void;
    onSkip: () => void;
    bottomInset: number;
}

export function RestOverlay({ isVisible, restTime, onAdd30s, onSkip, bottomInset }: RestOverlayProps) {
    if (!isVisible) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <View style={[styles.restOverlay, { bottom: bottomInset + 90 }]}>
            <View style={styles.restContent}>
                <View>
                    <Text style={styles.restLabel}>DESCANSANDO</Text>
                    <Text style={styles.restTimerText}>{formatTime(restTime)}</Text>
                </View>
                <View style={styles.restControls}>
                    <TouchableOpacity onPress={onAdd30s} style={styles.restBtnSmall}>
                        <Text style={styles.restBtnText}>+30s</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onSkip} style={styles.restBtnSkip}>
                        <Text style={[styles.restBtnText, { color: '#FFF' }]}>Pular</Text>
                        <MaterialCommunityIcons name="skip-next" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    restOverlay: { position: 'absolute', left: 20, right: 20, backgroundColor: '#191511', borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10, zIndex: 20 },
    restContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    restLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    restTimerText: { color: '#F59E0B', fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
    restControls: { flexDirection: 'row', gap: 12 },
    restBtnSmall: { backgroundColor: '#374151', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    restBtnSkip: { backgroundColor: '#F59E0B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    restBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
});
