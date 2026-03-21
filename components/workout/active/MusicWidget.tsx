import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MusicWidgetProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    track: { title: string; artist: string; cover: string; duration: number };
    bottomInset: number;
}

export function MusicWidget({ isPlaying, onTogglePlay, track, bottomInset }: MusicWidgetProps) {
    const musicProgress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isPlaying) {
            Animated.timing(musicProgress, {
                toValue: 1, duration: track.duration * 1000, useNativeDriver: false, easing: Easing.linear
            }).start();
        } else {
            musicProgress.stopAnimation();
        }
    }, [isPlaying]);

    const progressWidth = musicProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

    return (
        <View style={[styles.musicWidget, { bottom: bottomInset + 90 }]}>
            <View style={styles.musicProgressBarBg}>
                <Animated.View style={[styles.musicProgressBarFill, { width: progressWidth }]} />
            </View>
            <View style={styles.musicContent}>
                <Image source={{ uri: track.cover }} style={styles.musicCover} />
                <View style={styles.musicInfo}>
                    <Text style={styles.musicTitle} numberOfLines={1}>{track.title}</Text>
                    <Text style={styles.musicArtist} numberOfLines={1}>{track.artist}</Text>
                </View>
                <View style={styles.musicControls}>
                    <TouchableOpacity onPress={() => alert('Prev')}><MaterialCommunityIcons name="skip-previous" size={28} color="#FFF" /></TouchableOpacity>
                    <TouchableOpacity onPress={onTogglePlay}><MaterialCommunityIcons name={isPlaying ? "pause-circle" : "play-circle"} size={40} color="#008E00" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => alert('Next')}><MaterialCommunityIcons name="skip-next" size={28} color="#FFF" /></TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    musicWidget: { position: 'absolute', left: 20, right: 20, backgroundColor: '#191511', borderRadius: 16, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    musicProgressBarBg: { height: 2, backgroundColor: 'rgba(255,255,255,0.2)', width: '100%' },
    musicProgressBarFill: { height: '100%', backgroundColor: '#008E00' },
    musicContent: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
    musicCover: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#333' },
    musicInfo: { flex: 1 },
    musicTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    musicArtist: { color: '#9CA3AF', fontSize: 12, fontWeight: '500' },
    musicControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
});
