import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlockSuccessModal } from '../../components/profile/BlockSuccessModal';
import { ChallengeSentModal } from '../../components/profile/ChallengeSentModal';
import { ChallengeUserModal } from '../../components/profile/ChallengeUserModal';
import { ProfileActions } from '../../components/profile/ProfileActions';
import { ProfileCover } from '../../components/profile/ProfileCover';
import { ProfileGallery } from '../../components/profile/ProfileGallery';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileInfo } from '../../components/profile/ProfileInfo';
import { ProfileOptionsModal } from '../../components/profile/ProfileOptionsModal';
import { ProfileStats } from '../../components/profile/ProfileStats';
import { ReportSuccessModal } from '../../components/profile/ReportSuccessModal';

// Mock de fotos recentes do usuário visitado
const RECENT_PHOTOS = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&w=400&q=80",
  "https://images.unsplash.com/photo-1574680096145-d05b474e2155?ixlib=rb-4.0.3&w=400&q=80",
  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&w=400&q=80",
  "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?ixlib=rb-4.0.3&w=400&q=80",
];

export default function PublicProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [isFollowing, setIsFollowing] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);

  // State for Modals
  const [sentChallenge, setSentChallenge] = useState<{ type: string } | null>(null);
  const [isReportSuccessOpen, setIsReportSuccessOpen] = useState(false);
  const [isBlockSuccessOpen, setIsBlockSuccessOpen] = useState(false);

  // Dados recebidos via params ou fallback
  const userData = {
    name: params.name || 'Usuário FitPro',
    handle: params.handle || '@usuario',
    avatar: params.avatar || 'https://github.com/shadcn.png',
    level: params.level || '1',
    bio: 'Focado em superação diária. 🏋️‍♂️',
    streak: 8,
    workouts: 42
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // Lógica de backend aqui
  };

  const handleReport = () => {
    setIsOptionsOpen(false);
    setTimeout(() => {
      setIsReportSuccessOpen(true);
    }, 300);
  };

  const handleBlock = () => {
    setIsOptionsOpen(false);
    setTimeout(() => {
      setIsBlockSuccessOpen(true);
    }, 300);
  };

  const handleBlockClose = () => {
    setIsBlockSuccessOpen(false);
    router.back();
  };

  const handleSendChallenge = (type: string, wager: string) => {
    setIsChallengeOpen(false);
    // Show custom success modal instead of Alert
    setTimeout(() => {
      let typeLabel = type;
      if (type === '1x1') typeLabel = '1x1 Rápido';
      if (type === 'monthly') typeLabel = 'Meta Mensal';
      if (type === 'arena') typeLabel = 'Arena';

      setSentChallenge({ type: typeLabel });
    }, 300);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Stack.Screen options={{ headerShown: false }} />

      <ProfileHeader topInset={insets.top} onOptionsPress={() => setIsOptionsOpen(true)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        bounces={false}
      >
        <ProfileCover />

        <View style={styles.profileInfoContainer}>
          <ProfileInfo
            avatar={userData.avatar as string}
            level={userData.level as string}
            name={userData.name as string}
            handle={userData.handle as string}
            bio={userData.bio}
          />

          <ProfileStats
            streak={userData.streak}
            workouts={userData.workouts}
          />

          <ProfileActions
            isFollowing={isFollowing}
            onFollowPress={handleFollow}
            onChallengePress={() => setIsChallengeOpen(true)}
          />
        </View>

        <ProfileGallery photos={RECENT_PHOTOS} />

      </ScrollView>

      <ProfileOptionsModal
        visible={isOptionsOpen}
        userName={userData.name as string}
        onClose={() => setIsOptionsOpen(false)}
        onReport={handleReport}
        onBlock={handleBlock}
      />

      <ChallengeUserModal
        visible={isChallengeOpen}
        userName={userData.name as string}
        onClose={() => setIsChallengeOpen(false)}
        onSend={handleSendChallenge}
      />

      <ChallengeSentModal
        visible={!!sentChallenge}
        userName={userData.name as string}
        challengeType={sentChallenge?.type || ''}
        onClose={() => setSentChallenge(null)}
      />

      <ReportSuccessModal
        visible={isReportSuccessOpen}
        onClose={() => setIsReportSuccessOpen(false)}
      />

      <BlockSuccessModal
        visible={isBlockSuccessOpen}
        userName={userData.name as string}
        onClose={handleBlockClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  profileInfoContainer: {
    paddingHorizontal: 20,
    marginTop: -40, // Para sobrepor a imagem de capa
  },
});