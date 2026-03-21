import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileActionsProps {
    isFollowing: boolean;
    onFollowPress: () => void;
    onChallengePress: () => void;
}

export function ProfileActions({ isFollowing, onFollowPress, onChallengePress }: ProfileActionsProps) {
    return (
        <View style={styles.actionButtonsRow}>
            <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followingBtn]}
                onPress={onFollowPress}
            >
                <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                </Text>
                {isFollowing && <MaterialCommunityIcons name="check" size={16} color="#191511" />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.challengeBtn} onPress={onChallengePress}>
                <Text style={styles.challengeBtnText}>Desafiar</Text>
                <MaterialCommunityIcons name="sword-cross" size={18} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    actionButtonsRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 30 },
    followBtn: { flex: 1, backgroundColor: '#191511', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    followingBtn: { backgroundColor: '#E5E7EB' },
    followBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    followingBtnText: { color: '#191511' },
    challengeBtn: { flex: 1, backgroundColor: '#008E00', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    challengeBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
