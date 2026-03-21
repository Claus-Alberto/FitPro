import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface ExerciseHistoryModalProps {
    visible: boolean;
    exerciseName: string;
    history: any[];
    onClose: () => void;
    bottomInset: number;
}

const HistoryChart = ({ data }: { data: any[] }) => {
    const chartHeight = 180;
    const chartWidth = width - 80;
    const padding = 20;
    const weights = data.map(d => d.weight);
    const maxWeight = Math.max(...weights) + 2;
    const minWeight = Math.min(...weights) - 2;
    const getX = (index: number) => (index / (data.length - 1)) * (chartWidth - padding) + padding / 2;
    const getY = (weight: number) => chartHeight - ((weight - minWeight) / (maxWeight - minWeight)) * (chartHeight - padding * 2) - padding;
    const points = data.map((d, i) => `${getX(i)},${getY(d.weight)}`).join(' ');

    return (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <Svg width={chartWidth} height={chartHeight}>
                <Line x1="0" y1={getY(maxWeight)} x2={chartWidth} y2={getY(maxWeight)} stroke="#F3F4F6" strokeDasharray="4 4" strokeWidth="1" />
                <Line x1="0" y1={getY(minWeight)} x2={chartWidth} y2={getY(minWeight)} stroke="#F3F4F6" strokeDasharray="4 4" strokeWidth="1" />
                <Polyline points={points} fill="none" stroke="#008E00" strokeWidth="3" />
                {data.map((d, i) => (
                    <React.Fragment key={i}>
                        <Circle cx={getX(i)} cy={getY(d.weight)} r="5" fill="#191511" stroke="#008E00" strokeWidth="2" />
                        <SvgText x={getX(i)} y={getY(d.weight) - 10} fill="#191511" fontSize="12" fontWeight="bold" textAnchor="middle">{d.weight}</SvgText>
                        <SvgText x={getX(i)} y={chartHeight} fill="#9CA3AF" fontSize="10" textAnchor="middle">{d.date}</SvgText>
                    </React.Fragment>
                ))}
            </Svg>
        </View>
    );
};

export function ExerciseHistoryModal({ visible, exerciseName, history, onClose, bottomInset }: ExerciseHistoryModalProps) {
    return (
        <Modal visible={visible} transparent={true} animationType="slide" statusBarTranslucent={true} onRequestClose={onClose}>
            <View style={styles.mapBackdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={[styles.mapContent, { paddingBottom: bottomInset + 20 }]}>
                    <View style={styles.mapHeader}>
                        <View>
                            <Text style={styles.mapTitle}>Progresso de Carga</Text>
                            <Text style={styles.mapSubtitle}>{exerciseName}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeIconBg}>
                            <MaterialCommunityIcons name="close" size={24} color="#191511" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.prContainer}>
                            <View style={styles.prIconBox}>
                                <MaterialCommunityIcons name="trophy" size={24} color="#F59E0B" />
                            </View>
                            <View>
                                <Text style={styles.prLabel}>RECORDE PESSOAL</Text>
                                <Text style={styles.prValue}>45kg <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '400' }}>x 8 reps</Text></Text>
                            </View>
                        </View>

                        <HistoryChart data={history} />

                        <Text style={styles.historyListTitle}>Histórico Recente</Text>
                        {history.slice().reverse().map((item, index) => (
                            <View key={index} style={styles.historyRow}>
                                <Text style={styles.historyDate}>{item.date}</Text>
                                <View style={styles.historyValues}>
                                    <Text style={styles.historyWeight}>{item.weight}kg</Text>
                                    <Text style={styles.historyReps}>{item.reps} reps</Text>
                                </View>
                                {item.weight === 45 && <MaterialCommunityIcons name="trophy-variant" size={16} color="#F59E0B" />}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    mapBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', width: width, height: height },
    mapContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    mapTitle: { fontSize: 20, fontWeight: '800', color: '#191511' },
    mapSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
    closeIconBg: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 20 },
    prContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', padding: 16, borderRadius: 16, marginBottom: 16, gap: 16, borderWidth: 1, borderColor: '#FFEDD5' },
    prIconBox: { width: 48, height: 48, backgroundColor: '#FFFFFF', borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: "#F59E0B", shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
    prLabel: { fontSize: 12, fontWeight: '700', color: '#F59E0B', letterSpacing: 1 },
    prValue: { fontSize: 24, fontWeight: '800', color: '#191511' },
    historyListTitle: { fontSize: 16, fontWeight: '800', color: '#191511', marginTop: 10, marginBottom: 12 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    historyDate: { fontSize: 14, color: '#6B7280', fontWeight: '600', width: 60 },
    historyValues: { flexDirection: 'row', gap: 12, flex: 1 },
    historyWeight: { fontSize: 16, fontWeight: '800', color: '#191511' },
    historyReps: { fontSize: 14, color: '#6B7280', fontWeight: '500', marginTop: 2 },
});
