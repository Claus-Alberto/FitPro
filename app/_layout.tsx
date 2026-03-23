import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native'; // <--- Importante para o container
import 'react-native-reanimated';
import "../global.css";

import { useColorScheme } from '@/components/useColorScheme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// --- NOVOS IMPORTS PARA O MENU LATERAL ---
import ProfileSideDrawer from '../src/components/ProfileSideDrawer';
import { ProfileDrawerProvider } from '../src/context/ProfileDrawerContext';

// --- DATABASE IMPORTS ---
import { initLocalDatabase } from '../src/database/db';
import { WorkoutService } from '../src/features/workout/services/WorkoutService';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    async function setupApp() {
      try {
        await initLocalDatabase();
        await WorkoutService.seedInitialData();
      } catch (e) {
        console.warn('Erro fatal banco local:', e);
      } finally {
        if (loaded) {
          SplashScreen.hideAsync();
        }
      }
    }
    
    // Roda apenas se houver carga de fontes da view
    if (loaded) {
      setupApp();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        
        {/* 1. O PROVIDER ENVOLVE TUDO (Para o botão lá dentro funcionar) */}
        <ProfileDrawerProvider>
          
          {/* Usamos uma View flex:1 para segurar o Stack e o Drawer juntos */}
          <View style={{ flex: 1 }}>
            
            <Stack>
              {/* 1. Fluxo de Entrada */}
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />

              {/* 2. Fluxo de Onboarding */}
              <Stack.Screen name="onboarding" options={{ title: 'Meu Plano', headerShown: false }} />
              <Stack.Screen name="onboarding/goal" options={{ title: 'Seu Objetivo', headerShown: false }} />
              <Stack.Screen name="onboarding/biometric" options={{ title: 'Seus Dados', headerShown: false }} />
              <Stack.Screen name="onboarding/activity" options={{ title: 'Nível de Atividade', headerShown: false }} />
              <Stack.Screen name="onboarding/workout" options={{ title: 'Estratégia de Treino', headerShown: false }} />
              <Stack.Screen name="onboarding/nutrition" options={{ title: 'Estratégia Alimentar', headerShown: false }} />
              
              {/* Tela de Loading */}
              <Stack.Screen name="onboarding/loading" options={{ headerShown: false, gestureEnabled: false }} />

              {/* 3. O App Principal (Abas) */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
              
              {/* Modais Globais */}
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>

            {/* 2. O DRAWER FICA AQUI FORA DO STACK 
               Como ele está depois do Stack no código, ele renderiza POR CIMA.
               Isso garante que ele cubra inclusive a Tab Bar lá embaixo.
            */}
            <ProfileSideDrawer />

          </View>
        </ProfileDrawerProvider>

      </ThemeProvider>
    </SafeAreaProvider>
  );
}