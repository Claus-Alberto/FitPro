import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface ProfileInfoProps {
    avatar: string;
    level: string;
    name: string;
    handle: string;
    bio: string;
}

export function ProfileInfo({ avatar, level, name, handle, bio }: ProfileInfoProps) {
    return (
        <>
            <View style={styles.avatarWrapper}>
                <Image source={{ uri: avatar }} style={styles.avatar} />
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>{level}</Text>
                </View>
            </View>

            <View style={styles.textInfo}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.handle}>{handle}</Text>
                <Text style={styles.bio}>{bio}</Text>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
        alignSelf: 'center',
    },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#FAFAFA' },
    levelBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#F59E0B', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FAFAFA' },
    levelText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

    textInfo: { alignItems: 'center', marginBottom: 20 },
    name: { fontSize: 22, fontWeight: '800', color: '#191511', marginBottom: 2 },
    handle: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginBottom: 8 },
    bio: { fontSize: 14, color: '#4B5563', textAlign: 'center', paddingHorizontal: 20 },
});
