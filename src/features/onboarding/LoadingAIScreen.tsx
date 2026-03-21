import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

// As etapas que a IA está "processando"
const LOADING_STEPS = [
  { text: "Analisando seu biotipo...", icon: "account-search" },
  { text: "Calculando taxa metabólica...", icon: "calculator-variant" },
  { text: "Montando divisão de treino...", icon: "dumbbell" },
  { text: "Otimizando lista de compras...", icon: "cart-check" },
  { text: "Estratégia 100% pronta!", icon: "check-decagram" },
];

export default function LoadingAIScreen() {
  const router = useRouter();
  
  // Estados para controlar qual mensagem mostrar
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Animação da Barra de Progresso
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    // 1. Inicia a animação da barra de progresso (dura 5 segundos no total)
    Animated.timing(progress, {
      toValue: 1, // 100%
      duration: 5000, // 5 segundos de "teatro"
      useNativeDriver: false, // false porque vamos animar 'width'
    }).start();

    // 2. Loop para trocar as mensagens a cada 1s
    const messageInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    // 3. Redirecionamento final após o show
    const totalTimeout = setTimeout(() => {
      clearInterval(messageInterval);
      
      // AQUI: Navegar para a Home (ou Paywall)
      // Usamos 'replace' para ele não poder voltar para a tela de loading
      router.replace('/(tabs)'); 
      
    }, 5500); // Um pouco mais que a animação para ler a última mensagem

    return () => {
      clearInterval(messageInterval);
      clearTimeout(totalTimeout);
    };
  }, []);

  // Interpolação para largura da barra
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const currentStep = LOADING_STEPS[currentStepIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* CÍRCULO PULSANTE / ÍCONE CENTRAL */}
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons 
          name={currentStep.icon as any} 
          size={80} 
          color="#008E00" 
        />
      </View>

      {/* TÍTULO DA ETAPA ATUAL */}
      <Text style={styles.loadingText}>
        {currentStep.text}
      </Text>

      {/* BARRA DE PROGRESSO */}
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
      </View>

      {/* TEXTO DE RODAPÉ (Reforço de Autoridade) */}
      <Text style={styles.footerText}>
        Nossa IA está analisando {'>'}10.000 combinações para você.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F0FDF4', // Verde bem clarinho
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#008E00',
    // Sombra para dar destaque
    shadowColor: "#008E00",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#191511',
    textAlign: 'center',
    height: 60, // Altura fixa para o texto não pular a tela quando mudar
    marginBottom: 32,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 40,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#008E00',
    borderRadius: 4,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    position: 'absolute',
    bottom: 60,
  },
});