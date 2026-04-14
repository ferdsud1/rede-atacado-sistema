import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../data/colors';

const { width } = Dimensions.get('window');

export default function EncarteDetalheScreen({ route }) {
  const { encarte } = route.params;
  const [paginaAtual, setPaginaAtual] = useState(0);

  const compartilharWhatsApp = () => {
    const texto = `Confira o encarte "${encarte.titulo}" do Certo Atacado! Válido de ${encarte.dataInicio} a ${encarte.dataFim}.`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(texto)}`);
  };

  const falarComercial = () => {
    Linking.openURL('https://wa.me/555197078458?text=Olá, vim pelo encarte do app!');
  };

  const handleScroll = (event) => {
    const offset = event.nativeEvent.contentOffset.x;
    const page = Math.round(offset / (width - 32));
    setPaginaAtual(page);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* INFO DO ENCARTE */}
      <View style={styles.infoBox}>
        <View style={[styles.categoriaBadge, { backgroundColor: encarte.categoriaCor + '20' }]}>
          <Text style={[styles.categoriaText, { color: encarte.categoriaCor }]}>
            {encarte.categoria}
          </Text>
        </View>
        <Text style={styles.titulo}>{encarte.titulo}</Text>
        <Text style={styles.datas}>
          Válido de {encarte.dataInicio} a {encarte.dataFim}
        </Text>
      </View>

      {/* TOOLBAR */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.btnComercial} onPress={falarComercial}>
          <Ionicons name="headset-outline" size={18} color="#fff" />
          <Text style={styles.btnComercialText}>Fale com o Comercial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnShare} onPress={compartilharWhatsApp}>
          <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* PÁGINAS DO ENCARTE */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.paginasContainer}
      >
        {encarte.paginas.map((pagina, index) => (
          <Image
            key={index}
            source={{ uri: pagina }}
            style={styles.paginaImagem}
            resizeMode="contain"
          />
        ))}
      </ScrollView>

      {/* INDICADOR DE PÁGINAS */}
      <View style={styles.pageIndicator}>
        <Text style={styles.pageText}>
          Página {paginaAtual + 1} de {encarte.paginas.length}
        </Text>
        <View style={styles.dots}>
          {encarte.paginas.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === paginaAtual && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.spacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  infoBox: {
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoriaBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 10,
  },
  categoriaText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 8,
  },
  datas: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  btnComercial: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnComercialText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnShare: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  paginasContainer: {
    marginHorizontal: 16,
  },
  paginaImagem: {
    width: width - 32,
    height: (width - 32) * 1.4,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  pageIndicator: {
    alignItems: 'center',
    padding: 16,
  },
  pageText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
    marginBottom: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.grayBorder,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  spacing: {
    height: 32,
  },
});
