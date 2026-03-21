import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();

  const handleCompleteOnboarding = () => {
    // Leva para o primeiro passo do questionário (seleção de objetivo)
    router.push('/onboarding/goal');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        
        {/* HEADER: Promessa e Personalização */}
        <View style={styles.headerContainer}>
          <Text style={styles.brandTag}>FITPRO AI</Text>
          <Text style={styles.title}>
            Seu plano definitivo começa <Text style={styles.highlight}>agora.</Text>
          </Text>
          <Text style={styles.subtitle}>
            Para que possamos criar uma estratégia 100% adaptada ao seu metabolismo e rotina, precisamos conhecer melhor você.
          </Text>
        </View>

        {/* BENEFÍCIOS: Reforço positivo do porquê preencher */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.benefitText}>
              Dietas que você consegue manter.
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.benefitText}>
              Treinos baseados na sua biometria.
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.benefitText}>
              Economia no mercado e suplementos.
            </Text>
          </View>
        </View>

        {/* VISUALIZAÇÃO: Card que simula o processo iniciando */}
        <View style={styles.cardContainer}>
          <View style={styles.progressBarBackground}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.cardTitle}>Montando seu perfil...</Text>
          <Text style={styles.cardDescription}>
            Leva menos de 2 minutos.
          </Text>
        </View>

        {/* FOOTER: Única ação possível (Visão de Túnel) */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleCompleteOnboarding}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>CRIAR MEU PLANO</Text>
          </TouchableOpacity>
          
          {/* Adicionei um texto de segurança para substituir o botão de saída e gerar confiança */}
          <Text style={styles.securityText}>
            🔒 Seus dados são processados com segurança.
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between', // Distribui os elementos
    paddingVertical: 40,
  },
  // --- HEADER ---
  headerContainer: {
    marginTop: 20,
  },
  brandTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#008E00',
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#191511',
    lineHeight: 42,
    marginBottom: 16,
  },
  highlight: {
    color: '#008E00',
  },
  subtitle: {
    fontSize: 17,
    color: '#666666',
    lineHeight: 24,
    fontWeight: '400',
  },

  // --- BENEFITS ---
  benefitsContainer: {
    marginVertical: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#008E00',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#191511',
    fontWeight: '500',
  },

  // --- CARD VISUAL ---
  cardContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 16,
  },
  progressBarFill: {
    width: '10%',
    height: '100%',
    backgroundColor: '#008E00',
    borderRadius: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#191511',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#999999',
  },

  // --- FOOTER & CTA ---
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    height: 60,
    backgroundColor: '#008E00',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#008E00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  securityText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  }
});