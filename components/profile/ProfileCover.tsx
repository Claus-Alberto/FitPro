import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export function ProfileCover() {
    return (
        <View style={styles.headerContainer}>
            <Image
                source={{ uri: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&w=800&q=80" }}
                style={styles.coverImage}
            />
            <View style={styles.coverOverlay} />
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: { height: 180, width: '100%', position: 'relative' },
    coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
});
