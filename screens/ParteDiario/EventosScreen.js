import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/core';

const EVENT_TYPES = [
  { label: 'Cambio eRP', tipo: 'Cambio eRP' },
  { label: 'Servicio', tipo: 'Servicio' },
  { label: 'Parto', tipo: 'Parto' },
  { label: 'Aborto', tipo: 'Aborto' },
  { label: 'Secado', tipo: 'Secado' },
  { label: 'Tacto', tipo: 'Tacto' }, // label distinto, tipo igual al guardado en Firestore
  { label: 'Celo', tipo: 'Celo' },
  { label: 'Alta Vaquillona', tipo: 'Alta Vaquillona' },
  { label: 'Alta', tipo: 'Alta' },
  { label: 'Baja', tipo: 'Baja' },
  { label: 'Rechazo', tipo: 'Rechazo' },
  { label: 'Tratamiento', tipo: 'Tratamiento' },
  { label: 'Recepcion', tipo: 'Recepcion' },
  { label: 'Produccion', tipo: 'Produccion' },
];

const EventosScreen = ({ navigation }) => {
  const route = useRoute();
  const { tambo } = route.params || {};

  const handlePress = (item) => {
    navigation.push('EventHistoryScreen', {
      tipoEvento: item.tipo,
      tituloEvento: item.label,
      tambo,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {EVENT_TYPES.map((event) => (
            <TouchableOpacity
              key={event.label}
              style={styles.boton}
              activeOpacity={0.85}
              onPress={() => handlePress(event)}
            >
              <Text style={styles.botonText}>{event.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default EventosScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 0,
    paddingTop: 0,
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  title: {
    fontSize: 24,
    color: '#1b829b',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  boton: {
    width: '48%',
    minHeight: 96,
    backgroundColor: '#287fb9',
    borderRadius: 20,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#e1eff7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  botonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});

