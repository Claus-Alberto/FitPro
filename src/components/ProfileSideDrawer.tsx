import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Certifique-se de ter: npx expo install react-native-svg
import { useRouter } from 'expo-router'; // <--- Importado
import Svg, { Circle } from 'react-native-svg';
import { useProfileDrawer } from '../context/ProfileDrawerContext';

const { width, height } = Dimensions.get('window');

// Largura do Drawer (85% da tela fica bom para mobile)
const DRAWER_WIDTH = width * 0.85;

// DADOS MOCKADOS DE XP E USUÁRIO
const USER_XP = {
  current: 2400,
  next_level: 3000,
  level: 12
};

const USER_DATA = {
  name: 'Claus',
  email: 'claus@fitpro.com',
  streak: 12,
  xp: { current: 2400, next: 3000, level: 12 }
};

// --- COMPONENTE: AVATAR COM CÍRCULO DE XP ---
const AvatarWithXP = () => {
  const size = 80; // Tamanho total
  const strokeWidth = 4; // Grossura da barra
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Cálculo da porcentagem (0 a 1)
  const progress = USER_XP.current / USER_XP.next_level;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* O DESENHO DO CÍRCULO */}
      <View style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Svg width={size} height={size}>
          {/* Círculo de Fundo (Cinza) */}
          <Circle
            stroke="#F3F4F6"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Círculo de Progresso (Verde) */}
          <Circle
            stroke="#008E00"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round" // Ponta arredondada
          />
        </Svg>
      </View>

      {/* O AVATAR NO MEIO */}
      <View style={styles.avatarInner}>
        <MaterialCommunityIcons name="account" size={40} color="#FFF" />
      </View>

      {/* BADGE DE NÍVEL */}
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>{USER_XP.level}</Text>
      </View>
    </View>
  );
};

// --- COMPONENTE: ITEM DE MENU ---
const MenuItem = ({ icon, label, badge, color = "#191511", onPress }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <View style={[styles.iconBox, { backgroundColor: color === '#EF4444' ? '#FEF2F2' : '#F3F4F6' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
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
              
              {/* Componente do Avatar com Círculo de XP */}
              <AvatarWithXP />

              <View style={{ flex: 1, justifyContent: 'center' }}>
                
                {/* LINHA DO NOME + STREAK */}
                <View style={styles.nameRow}>
                  <Text style={styles.userName} numberOfLines={1}>{USER_DATA.name}</Text>
                  
                  <View style={styles.streakBadgeSmall}>
                    <MaterialCommunityIcons name="fire" size={14} color="#F59E0B" />
                    <Text style={styles.streakTextSmall}>{USER_DATA.streak}</Text>
                  </View>
                </View>

                {/* Linha de XP (Abaixo do nome) */}
                <View style={styles.xpRow}>
                  <Text style={styles.xpText}>
                    {USER_DATA.xp.current}/{USER_DATA.xp.next} XP
                  </Text>
                  <Text style={styles.xpLabel}>próx. nível</Text>
                </View>

                <Text style={styles.userEmail} numberOfLines={1}>{USER_DATA.email}</Text>
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
            
            <MenuItem icon="cog-outline" label="Configurações" onPress={() => alert('Config')} />
            <MenuItem icon="credit-card-outline" label="Assinatura Pro" badge="PRO" onPress={() => alert('Assinatura')} />
            <MenuItem icon="shield-check-outline" label="Privacidade" onPress={() => alert('Privacidade')} />
            
            <View style={styles.dividerSmall} />

            <MenuItem icon="logout" label="Sair do App" color="#EF4444" onPress={() => alert('Logout')} />
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
    gap: 16,
    marginTop: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    gap: 2,
  },
  streakTextSmall: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
  },
  
  // ESTILOS DO AVATAR COM XP
  avatarInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#191511',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#008E00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  levelText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },

  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191511',
    maxWidth: '70%',
  },
  // Estilos da linha de XP
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  xpText: { fontSize: 12, fontWeight: '700', color: '#008E00' },
  xpLabel: { fontSize: 10, color: '#9CA3AF' },

  userEmail: { fontSize: 12, color: '#6B7280' },
  closeBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 20, alignSelf: 'flex-start' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 24 },
  dividerSmall: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingVertical: 4 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 15, fontWeight: '600' },
  badge: { backgroundColor: '#008E00', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' }
});