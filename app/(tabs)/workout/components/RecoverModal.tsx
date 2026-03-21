import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  item: any;
  onClose: () => void;
  onAction: (action: 'push' | 'swap' | 'ignore') => void;
}

export function RecoverModal({ visible, item, onClose, onAction }: Props) {
  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <View style={styles.modalContent}>
          {/* CABEÇALHO */}
          <View style={styles.modalHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <MaterialCommunityIcons name="alert-circle" size={28} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Treino Pulado</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeIconBg}>
              <MaterialCommunityIcons name="close" size={24} color="#191511" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>
            Você não treinou <Text style={{fontWeight: 'bold'}}>{item?.workout?.title}</Text> na {item?.day}. O que deseja fazer?
          </Text>

          {/* OPÇÕES */}
          <OptionButton 
            icon="calendar-arrow-right" color="#008E00" bg="#E3F9E5" 
            title="Fazer Hoje (Mover Fila)" 
            desc="Empurra todos os treinos futuros 1 dia pra frente."
            onPress={() => onAction('push')} 
          />
          <OptionButton 
            icon="swap-horizontal" color="#0EA5E9" bg="#E0F2FE" 
            title="Trocar por Descanso" 
            desc="Joga este treino para o próximo dia de folga."
            onPress={() => onAction('swap')} 
          />
          <OptionButton 
            icon="close-circle-outline" color="#6B7280" bg="#F3F4F6" 
            title="Manter como Pulado" 
            desc="Ignorar e seguir o cronograma original."
            onPress={() => onAction('ignore')} 
          />
        </View>
      </View>
    </Modal>
  );
}

// Helper interno
const OptionButton = ({ icon, color, bg, title, desc, onPress }: any) => (
  <TouchableOpacity style={styles.optionCard} onPress={onPress}>
    <View style={[styles.optionIcon, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.optionTitle}>{title}</Text>
      <Text style={styles.optionDesc}>{desc}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', width: width, height: height },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#191511' },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 20 },
  closeIconBg: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 20 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
  optionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: '#191511' },
  optionDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});