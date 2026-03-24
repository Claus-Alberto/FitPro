import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text // Adicionado Text aqui
  ,




  TouchableOpacity,
  View
} from 'react-native';
// 1. IMPORTAR O HOOK DE SAFE AREA
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileDrawer } from '../../src/context/ProfileDrawerContext';

const HeaderLogo = () => (
  <View style={{ marginLeft: 20, justifyContent: 'center' }}>
    <Image
      source={require('../../assets/images/logotipobg.png')}
      style={{
        width: 120,
        height: 40,
        resizeMode: 'contain'
      }}
    />
  </View>
);

const HeaderAvatar = () => {
  const { toggleDrawer } = useProfileDrawer();

  return (
    <TouchableOpacity
      onPress={toggleDrawer}
      style={{ marginRight: 20 }}
    >
      <View style={styles.avatarContainer}>
        <MaterialCommunityIcons name="account" size={24} color="#008E00" />
        <View style={styles.notificationDot} />
      </View>
    </TouchableOpacity>
  );
};

// --- NOVO: HEADER DIREITO ESPECÍFICO PARA SOCIAL ---
const SocialHeaderRight = () => {
  const { toggleDrawer } = useProfileDrawer();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}>
      {/* Badge de Juiz */}
      <View style={styles.judgeBadge}>
        <MaterialCommunityIcons name="gavel" size={14} color="#F59E0B" />
        <Text style={styles.judgeText}>Nv. 3</Text>
      </View>

      {/* Avatar (Reutilizando a lógica, mas inline para alinhamento) */}
      <TouchableOpacity onPress={toggleDrawer}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="account" size={24} color="#008E00" />
          <View style={styles.notificationDot} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default function TabLayout() {
  // 2. PEGAR OS INSETS (MEDIDAS SEGURAS)
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FAFAFA',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
          height: Platform.OS === 'ios' ? 110 : 90, // Ajuste fino para caber a logo
        },
        headerTitle: "",
        headerLeft: () => <HeaderLogo />,
        headerRight: () => <HeaderAvatar />,

        tabBarActiveTintColor: '#008E00',
        tabBarInactiveTintColor: '#9CA3AF',

        // 3. AQUI ESTÁ A MÁGICA DO PADDING
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          elevation: 0,
          // A altura é 60 (base) + o espaço da barra de baixo
          height: 60 + insets.bottom,
          // O padding de baixo é exatamente o inset + um respiro (opcional, pus +4)
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        }
      }}
    >
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          headerShown: true,
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              // Alterna entre preenchido e outline para dar feedback visual de seleção
              name={focused ? "account-group" : "account-group-outline"}
              size={28}
              color={color}
            />
          ),
          // AQUI ESTÁ A MÁGICA: Substitui o headerRight padrão APENAS nesta tela
          headerRight: () => <SocialHeaderRight />,
        }}
      />


      <Tabs.Screen
        name="workout/index"
        options={{
          title: 'Treino',
          headerShown: true,
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "dumbbell" : "dumbbell"}
              size={28}
              color={color}
            />
          ),
        }}
      />


      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "home" : "home-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="diet/index"
        options={{
          title: 'Dieta',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "food-apple" : "food-apple-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="market"
        options={{
          title: 'Mercado',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "cart" : "cart-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />

      {/* TELAS OCULTAS (SEM ABA E SEM TAB BAR QUANDO ABERTAS) */}

      <Tabs.Screen
        name="workout/active"
        options={{
          title: 'Treino',
          headerShown: false,
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />

      <Tabs.Screen
        name="workout/summary"
        options={{
          title: 'Treino',
          headerShown: false,
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />

      <Tabs.Screen
        name="workout/details"
        options={{
          title: 'Treino',
          headerShown: false,
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />

      <Tabs.Screen
        name="workout/create"
        options={{
          headerShown: false,
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          href: null,
        }}
      />

      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Minhas Conquistas',
          headerShown: false,
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: 'Estatísticas',
          headerShown: false,
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F9E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    backgroundColor: '#EF4444',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#E3F9E5',
  },
  // Estilos do Badge de Juiz (Novos)
  judgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginRight: 12 // Espaço entre o badge e o avatar
  },
  judgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B'
  },
});