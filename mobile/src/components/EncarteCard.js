import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../data/colors';

export default function EncarteCard({ encarte, onPress, compact }) {
  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={() => onPress(encarte)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: encarte.imagem }} style={[styles.imagem, compact && styles.imagemCompact]} />
      <View style={styles.zoomIcon}>
        <Ionicons name="expand-outline" size={16} color={COLORS.primary} />
      </View>
      <View style={styles.info}>
        <View style={[styles.categoriaBadge, { backgroundColor: encarte.categoriaCor + '20' }]}>
          <Text style={[styles.categoriaText, { color: encarte.categoriaCor }]}>
            {encarte.categoria}
          </Text>
        </View>
        <Text style={styles.titulo} numberOfLines={2}>{encarte.titulo}</Text>
        <Text style={styles.datas}>
          {encarte.dataInicio} a {encarte.dataFim}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 16,
    width: '100%',
  },
  cardCompact: {
    width: 240,
    marginRight: 16,
    marginBottom: 0,
  },
  imagem: {
    width: '100%',
    height: 180,
  },
  imagemCompact: {
    height: 140,
  },
  zoomIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  info: {
    padding: 14,
  },
  categoriaBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoriaText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  titulo: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 6,
    lineHeight: 22,
  },
  datas: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
