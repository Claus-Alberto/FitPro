import { MaterialCommunityIcons } from '@expo/vector-icons'; // Ícones para ilustrar
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StepWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Estados
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);
  const [location, setLocation] = useState<'gym' | 'home' | null>(null);
  const [days, setDays] = useState(4); // Começa com 4 dias (média ideal)

  // Validação: Tudo precisa estar preenchido (Dias sempre tem valor, então checa exp e loc)
  const isFormValid = experience && location;

  const handleNext = () => {
    if (isFormValid) {
      console.log({ experience, location, days });
      router.push('/onboarding/nutrition');
    }
  };

  const handleDayChange = (change: number) => {
    const newValue = days + change;
    if (newValue >= 1 && newValue <= 7) setDays(newValue);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        
        {/* BARRA DE PROGRESSO: 80% */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: '80%' }]} />
          </View>
          <Text style={styles.stepText}>PASSO 4 DE 5</Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.title}>Sua estratégia de treino</Text>
          <Text style={styles.subtitle}>
            Vamos montar fichas adaptadas ao seu ambiente e nível de força.
          </Text>

          {/* --- SEÇÃO 1: ONDE VAI TREINAR? (Botões Lado a Lado) --- */}
          <Text style={styles.sectionLabel}>Onde você vai treinar?</Text>
          <View style={styles.locationContainer}>
            <TouchableOpacity 
              style={[styles.locationCard, location === 'gym' && styles.cardSelected]}
              onPress={() => setLocation('gym')}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>💪</Text>
              <Text style={[styles.cardTitle, location === 'gym' && styles.textSelected]}>Academia</Text>
              <Text style={styles.cardTinyDesc}>Equipamentos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.locationCard, location === 'home' && styles.cardSelected]}
              onPress={() => setLocation('home')}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>🏠</Text>
              <Text style={[styles.cardTitle, location === 'home' && styles.textSelected]}>Em Casa</Text>
              <Text style={styles.cardTinyDesc}>Pesos livres</Text>
            </TouchableOpacity>
          </View>

          {/* --- SEÇÃO 2: EXPERIÊNCIA (Lista Compacta) --- */}
          <Text style={styles.sectionLabel}>Qual sua experiência?</Text>
          <View style={styles.experienceContainer}>
            {[
              { id: 'beginner', label: 'Iniciante', desc: 'Estou aprendendo os movimentos.' },
              { id: 'intermediate', label: 'Intermediário', desc: 'Já treino regularmente há 6+ meses.' },
              { id: 'advanced', label: 'Avançado', desc: 'Busco performance e carga máxima.' },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.expRow, experience === item.id && styles.expRowSelected]}
                onPress={() => setExperience(item.id as any)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.expLabel, experience === item.id && styles.textSelected]}>
                    {item.label}
                  </Text>
                  <Text style={styles.expDesc}>{item.desc}</Text>
                </View>
                {/* Radio Circle */}
                <View style={[styles.radio, experience === item.id && styles.radioSelected]}>
                  {experience === item.id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* --- SEÇÃO 3: FREQUÊNCIA (Stepper Grande) --- */}
          <Text style={styles.sectionLabel}>Dias por semana</Text>
          <View style={styles.daysContainer}>
            <TouchableOpacity 
              style={styles.stepperButton} 
              onPress={() => handleDayChange(-1)}
            >
              <MaterialCommunityIcons name="minus" size={24} color="#191511" />
            </TouchableOpacity>
            
            <View style={styles.daysDisplay}>
              <Text style={styles.daysNumber}>{days}</Text>
              <Text style={styles.daysText}>dias</Text>
            </View>

            <TouchableOpacity 
              style={[styles.stepperButton, { backgroundColor: '#008E00' }]} 
              onPress={() => handleDayChange(1)}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.daysContext}>
            {days <= 2 ? "Treino Full Body recomendado." : 
             days <= 4 ? "Divisão AB ou ABC recomendada." : 
             "Divisão ABCDE ou ABC 2x recomendada."}
          </Text>

        </ScrollView>

        {/* FOOTER */}
        <View style={[
          styles.footer, 
          { paddingBottom: Math.max(insets.bottom, 20) }
        ]}>
          <TouchableOpacity
            style={[styles.continueButton, !isFormValid && styles.continueButtonDisabled]}
            onPress={handleNext}
            disabled={!isFormValid}
          >
            <Text style={styles.continueButtonText}>CONTINUAR</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#008E00',
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#191511',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191511',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // --- LOCALIZAÇÃO (GRID 2 COLUNAS) ---
  locationContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  locationCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#008E00',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191511',
    marginBottom: 4,
  },
  cardTinyDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  textSelected: {
    color: '#008E00',
  },

  // --- EXPERIÊNCIA (LISTA) ---
  experienceContainer: {
    marginBottom: 32,
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expRowSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#008E00',
  },
  expLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191511',
    marginBottom: 4,
  },
  expDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#008E00',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#008E00',
  },

  // --- DIAS (STEPPER) ---
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysDisplay: {
    alignItems: 'center',
  },
  daysNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#191511',
  },
  daysText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  daysContext: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#008E00',
    fontWeight: '500',
  },

  // --- FOOTER ---
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#008E00',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#008E00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});