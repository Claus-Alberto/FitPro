import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Opções focadas em BENEFÍCIOS, não apenas características
const GOALS = [
  {
    id: 'weight_loss',
    emoji: '🔥',
    title: 'Queimar Gordura & Secar',
    description: 'Foco em déficit calórico e aceleração metabólica.',
  },
  {
    id: 'muscle_gain',
    emoji: '💪',
    title: 'Ganhar Massa & Força',
    description: 'Hipertrofia, aumento de carga e volume muscular.',
  },
  {
    id: 'health',
    emoji: '❤️',
    title: 'Saúde & Vitalidade',
    description: 'Melhorar disposição, sono e reeducação alimentar.',
  },
  {
    id: 'performance',
    emoji: '⚡',
    title: 'Performance Atlética',
    description: 'Resistência, explosão e preparação para esportes.',
  },
];

export default function StepGoalScreen() {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const handleNext = () => {
    if (selectedGoal) {
      // Aqui você salvaria o estado (Redux, Context ou enviaria pro Backend)
      console.log('Objetivo selecionado:', selectedGoal);

      // Vai para o próximo passo (Dados Biológicos)
      router.push('/onboarding/biometric');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* BARRA DE PROGRESSO: Passo 1 de 4 */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: '25%' }]} />
          </View>
          <Text style={styles.stepText}>PASSO 1 DE 5</Text>
        </View>

        <Text style={styles.title}>Qual é o seu foco principal?</Text>
        <Text style={styles.subtitle}>
          Isso nos ajuda a calibrar as calorias e o tipo de treino ideal
          para você.
        </Text>

        {/* LISTA DE OPÇÕES (CARDS SELECIONÁVEIS) */}
        <ScrollView
          style={styles.optionsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {GOALS.map((goal) => {
            const isSelected = selectedGoal === goal.id;

            return (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected, // Estilo condicional
                ]}
                onPress={() => setSelectedGoal(goal.id)}
                activeOpacity={0.9}
              >
                <View style={styles.optionHeader}>
                  <Text style={styles.emoji}>{goal.emoji}</Text>
                  {/* Radio Button Visual */}
                  <View
                    style={[
                      styles.radioButton,
                      isSelected && styles.radioButtonSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioButtonInner} />}
                  </View>
                </View>

                <Text
                  style={[
                    styles.optionTitle,
                    isSelected && styles.optionTitleSelected,
                  ]}
                >
                  {goal.title}
                </Text>

                <Text style={styles.optionDescription}>
                  {goal.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FOOTER */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedGoal && styles.continueButtonDisabled, // Desabilitado se não escolheu
            ]}
            onPress={handleNext}
            disabled={!selectedGoal}
          >
            <Text style={styles.continueButtonText}>CONTINUAR</Text>
          </TouchableOpacity>
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
    paddingTop: 20,
  },
  // --- PROGRESSO ---
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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

  // --- CABEÇALHO ---
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

  // --- CARDS DE OPÇÃO ---
  optionsList: {
    flex: 1,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB', // Borda cinza padrão
    padding: 20,
    marginBottom: 16,
  },
  optionCardSelected: {
    borderColor: '#008E00', // Borda verde quando selecionado
    backgroundColor: '#F0FDF4', // Fundo verde bem clarinho
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 28,
  },
  // Radio Button Customizado
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#008E00',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#008E00',
  },

  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191511',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#008E00', // Título fica verde também
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // --- FOOTER ---
  footer: {
    paddingVertical: 20,
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
    backgroundColor: '#E5E7EB', // Cinza se desabilitado
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