import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ExtraActivityCardProps {
    onPress: () => void;
}

export function ExtraActivityCard({ onPress }: ExtraActivityCardProps) {
    return (
        <View style={styles.extraActivitySection}>
            <TouchableOpacity style={styles.extraActivityCard} onPress={onPress} activeOpacity={0.8}>
                <View style={styles.extraIconBox}>
                    <MaterialCommunityIcons name="whistle" size={24} color="#008E00" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.extraTitle}>Registrar Esporte / Cardio</Text>
                    <Text style={styles.extraDesc}>Futebol, Vôlei, Corrida ou Caminhada</Text>
                </View>
                <MaterialCommunityIcons name="plus-circle" size={28} color="#008E00" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    extraActivitySection: { paddingHorizontal: 20, marginBottom: 24 },
    extraActivityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#008E00', borderStyle: 'dashed', gap: 16 },
    extraIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
    extraTitle: { fontSize: 16, fontWeight: '800', color: '#191511' },
    extraDesc: { fontSize: 12, color: '#008E00', fontWeight: '600' },
});
