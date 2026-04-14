import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../data/colors';

export default function LojaCard({ loja }) {
  const abrirMapa = () => {
    Linking.openURL(loja.mapsUrl);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={abrirMapa} activeOpacity={0.8}>
      <View style={styles.iconContainer}>
        <Ionicons name="storefront" size={32} color={COLORS.white} />
      </View>
      <View style={styles.info}>
        <Text style={styles.nome}>{loja.nome}</Text>
        <Text style={styles.endereco}>{loja.endereco}</Text>
      </View>
      <Ionicons name="navigate" size={20} color={COLORS.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  endereco: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
  },
});
