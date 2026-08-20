import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router'; // <--- Importado
import STRINGS from '../constants/strings.json';
import { COLORS } from '../constants/theme';
import { useProfileDrawer } from '../context/ProfileDrawerContext';
import { resetUserData } from '../database/db';
import { ProfileService } from '../features/profile/services/ProfileService';
import { WorkoutService } from '../features/workout/services/WorkoutService';

const { width, height } = Dimensions.get('window');

// Largura do Drawer (85% da tela fica bom para mobile)
const DRAWER_WIDTH = width * 0.85;

const DRAWER_STRINGS = STRINGS.profile.drawer;

// --- COMPONENTE: AVATAR SIMPLES (foto real, ou ícone genérico como fallback) ---
const Avatar = ({ photoUri }: { photoUri: string | null }) => {
  const size = 64;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.avatarPhoto} />
      ) : (
        <View style={styles.avatarInner}>
          <MaterialCommunityIcons name="account" size={32} color="#FFF" />
        </View>
      )}
    </View>
  );
};

// --- COMPONENTE: ITEM DE MENU ---
const MenuItem = ({ icon, label, badge, color = "#191511", onPress, customIcon }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <View style={[styles.iconBox, { backgroundColor: color === '#EF4444' ? '#FEF2F2' : '#F3F4F6' }]}>
        {customIcon || <MaterialCommunityIcons name={icon} size={20} color={color} />}
      </View>
      <Text style={[styles.menuText, { color }]}>{label}</Text>
    </View>
    {badge && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
    {!badge && <MaterialCommunityIcons name="chevron-right" size={20} color="#E5E7EB" />}
  </TouchableOpacity>
);

// --- COMPONENTE PRINCIPAL: DRAWER ---
export default function ProfileSideDrawer() {
  const { isOpen, closeDrawer } = useProfileDrawer();
  const insets = useSafeAreaInsets();
  const router = useRouter(); // <--- Hook de navegação
  const [isResetting, setIsResetting] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  // O drawer é montado fora da árvore de qualquer `Screen` (é irmão do `<Stack>` no layout raiz —
  // veja app/_layout.tsx), então `useFocusEffect` não se aplica aqui. Recarrega os dados reais
  // toda vez que o drawer abre, já que o perfil pode ter sido editado desde a última abertura.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const [profile, currentStreak] = await Promise.all([
          ProfileService.getProfile(),
          WorkoutService.getCurrentStreak(),
        ]);
        if (cancelled) return;
        setDisplayName(profile.name);
        setPhotoUri(profile.photoUri);
        setStreak(currentStreak);
      } catch (e) {
        console.warn('[ProfileSideDrawer] Erro ao carregar dados do usuário:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  const handleResetData = () => {
    if (isResetting) return;
    Alert.alert(
      'Resetar dados locais',
      'Isso apaga fichas, treinos concluídos, refeições, água e alimentos personalizados salvos neste aparelho. Não dá pra desfazer. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetar',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              await resetUserData();
              closeDrawer();
              router.replace('/(tabs)');
              Alert.alert('Pronto', 'Dados locais resetados.');
            } catch (e) {
              console.warn('[ProfileSideDrawer] Erro ao resetar dados:', e);
              Alert.alert('Erro', 'Não foi possível resetar os dados. Tenta de novo.');
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  // Animações
  const slideAnim = useRef(new Animated.Value(width)).current; // Começa fora da tela (direita)
  const fadeAnim = useRef(new Animated.Value(0)).current;      // Começa invisível

  useEffect(() => {
    if (isOpen) {
      // Entrando
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: width - DRAWER_WIDTH, // Vai para a posição final (direita da tela)
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Saindo
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: width, // Volta pra fora da tela
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  // Se o drawer estiver fechado, usamos pointerEvents='none' para que os toques passem para a tela de baixo
  // Mas mantemos o componente renderizado para a animação de saída funcionar.
  
  return (
    <View 
      style={[styles.overlayContainer, !isOpen && { zIndex: -1 }]} // Esconde zIndex quando fechado
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      
      {/* BACKDROP (FUNDO ESCURO) */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={closeDrawer} 
          activeOpacity={1} 
        />
      </Animated.View>

      {/* GAVETA DESLIZANTE */}
      <Animated.View 
        style={[
          styles.drawer, 
          { 
            transform: [{ translateX: slideAnim }],
            paddingTop: insets.top,
            paddingBottom: insets.bottom 
          }
        ]}
      >
        <View style={styles.drawerContent}>
          
          {/* HEADER DO MENU */}
          <View style={styles.header}>

              {/* Avatar real (foto do perfil, ou ícone genérico se não houver) */}
              <Avatar photoUri={photoUri} />

              <View style={{ flex: 1, justifyContent: 'center' }}>

                {/* LINHA DO NOME + STREAK */}
                <View style={styles.nameRow}>
                  <Text style={styles.userName} numberOfLines={1}>{displayName || STRINGS.profile.screen.namePlaceholder}</Text>

                  {streak > 0 && (
                    <View style={styles.streakBadgeSmall}>
                      <MaterialCommunityIcons name="fire" size={14} color="#F59E0B" />
                      <Text style={styles.streakTextSmall}>{streak}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.streakSubtitle}>
                  {streak > 0 ? `${streak} ${DRAWER_STRINGS.streakSuffix}` : DRAWER_STRINGS.noStreak}
                </Text>
              </View>

              <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={24} color="#191511" />
              </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* ITENS DO MENU */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <MenuItem 
              icon="account-cog-outline" 
              label="Dados do Perfil" 
              onPress={() => {
                closeDrawer(); // Fecha o menu
                router.push('/profile'); // Navega para a tela de edição
              }} 
            />
            <MenuItem icon="trophy-outline" label="Minhas Conquistas" onPress={() => {
                closeDrawer(); // Fecha o menu
                router.push('/achievements'); // Navega para a tela de edição
              }}  />
            <MenuItem icon="chart-line" label="Estatísticas" onPress={() => {
                closeDrawer(); // Fecha o menu
                router.push('/stats'); // Navega para a tela de edição
              }} />
            
            <View style={styles.dividerSmall} />
            
            <MenuItem icon="cog-outline" label="Configurações" onPress={() => Alert.alert(DRAWER_STRINGS.settingsTitle, DRAWER_STRINGS.settingsMsg)} />
            <MenuItem icon="credit-card-outline" label="Assinatura Pro" badge="PRO" onPress={() => Alert.alert(DRAWER_STRINGS.subscriptionTitle, DRAWER_STRINGS.subscriptionMsg)} />
            <MenuItem icon="shield-check-outline" label="Privacidade" onPress={() => Alert.alert(DRAWER_STRINGS.privacyTitle, DRAWER_STRINGS.privacyMsg)} />
            <MenuItem
              icon={isResetting ? undefined : "database-remove-outline"}
              label={isResetting ? "Resetando..." : "Resetar Dados Locais"}
              color="#EF4444"
              onPress={handleResetData}
              customIcon={isResetting ? <ActivityIndicator size="small" color="#EF4444" /> : undefined}
            />

            <View style={styles.dividerSmall} />

            <MenuItem icon="logout" label="Sair do App" color={COLORS.secondary} onPress={() => Alert.alert(DRAWER_STRINGS.logoutTitle, DRAWER_STRINGS.logoutMsg)} />
          </ScrollView>
          
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000, // Fica acima de tudo
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', // Fundo escuro semitransparente
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0, // Ocupa a tela toda, mas usamos width e translateX para posicionar
    width: width, // Largura total para facilitar o slide
    backgroundColor: 'transparent', // O fundo real é o drawerContent
    shadowColor: "#000",
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  drawerContent: {
    position: 'absolute',
    right: 0, // Gruda na direita
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    padding: 24,
    paddingRight: 10, // Menos padding na direita pois é canto da tela
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  streakBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDBA74',
    marginLeft: 8,
  },
  streakTextSmall: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    marginLeft: 2,
  },

  // ESTILOS DO AVATAR
  avatarInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#191511',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191511',
    maxWidth: '70%',
  },
  streakSubtitle: { fontSize: 12, color: '#6B7280' },
  closeBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 20, alignSelf: 'flex-start' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 24 },
  dividerSmall: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingVertical: 4 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuText: { fontSize: 15, fontWeight: '600' },
  badge: { backgroundColor: '#008E00', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' }
});