import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../data/colors';
import { encartes, lojas } from '../data/encartes';
import Header from '../components/Header';
import EncarteCard from '../components/EncarteCard';
import LojaCard from '../components/LojaCard';

export default function HomeScreen() {
  const navigation = useNavigation();

  const abrirEncarte = (encarte) => {
    navigation.navigate('Encartes', {
      screen: 'EncarteDetalhe',
      params: { encarte },
    });
  };

  const abrirWhatsApp = () => {
    Linking.openURL('https://wa.me/555197078458?text=Olá, vim pelo app!');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER / BANNER */}
      <Header />

      {/* BANNER TELEVENDAS */}
      <TouchableOpacity style={styles.whatsappBanner} onPress={abrirWhatsApp} activeOpacity={0.85}>
        <Ionicons name="logo-whatsapp" size={24} color="#fff" />
        <View style={styles.whatsappInfo}>
          <Text style={styles.whatsappTitle}>Televendas WhatsApp</Text>
          <Text style={styles.whatsappNumber}>(51) 9707-8458</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      {/* ENCARTES E PROMOÇÕES */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Encartes e Promoções</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Encartes')}>
            <Text style={styles.verTodos}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={encartes.slice(0, 3)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <EncarteCard encarte={item} onPress={abrirEncarte} compact />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
        />
      </View>

      {/* NOSSAS LOJAS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nossas Lojas</Text>
        {lojas.map((loja) => (
          <LojaCard key={loja.id} loja={loja} />
        ))}
      </View>

      {/* INFORMAÇÕES RÁPIDAS */}
      <View style={styles.infoSection}>
        <Text style={styles.infoSectionTitle}>Informações</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="time-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.infoLabel}>Horário</Text>
            <Text style={styles.infoValue}>Seg a Dom{'\n'}8h - 20h</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="location-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.infoLabel}>Localização</Text>
            <Text style={styles.infoValue}>Taquara, RS</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="call-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.infoLabel}>Fale Conosco</Text>
            <Text style={styles.infoValue}>(51) 9119-8639</Text>
          </View>
        </View>
      </View>

      {/* FORMAS DE PAGAMENTO */}
      <View style={styles.paymentSection}>
        <Text style={styles.paymentTitle}>Formas de Pagamento</Text>
        <View style={styles.paymentGrid}>
          {['Visa', 'Master', 'Amex', 'Elo', 'Pix', 'Dinheiro'].map((item) => (
            <View key={item} style={styles.paymentBadge}>
              <Text style={styles.paymentText}>{item}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.paymentObs}>
          * Aceitamos todas as principais bandeiras e cartões de benefícios.
        </Text>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerLogoRow}>
          <View style={styles.footerLogoIcon}>
            <Ionicons name="checkmark" size={18} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.footerLogoName}>Certo</Text>
            <Text style={styles.footerLogoSub}>Atacado & Varejo</Text>
          </View>
        </View>
        <Text style={styles.footerDesc}>
          Lugar certo de comprar barato.{'\n'}Qualidade e economia para você e sua família.
        </Text>
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => Linking.openURL('https://www.facebook.com')}
          >
            <Ionicons name="logo-facebook" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => Linking.openURL('https://www.instagram.com')}
          >
            <Ionicons name="logo-instagram" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => Linking.openURL('https://www.linkedin.com/company/grupo-muller-rs/')}
          >
            <Ionicons name="logo-linkedin" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.footerCopy}>
          © 2026 Certo Atacado & Varejo. Todos os direitos reservados.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  whatsappBanner: {
    backgroundColor: '#25D366',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  whatsappInfo: {
    flex: 1,
    marginLeft: 12,
  },
  whatsappTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  whatsappNumber: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  section: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 16,
  },
  verTodos: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  carouselContent: {
    paddingRight: 16,
  },
  infoSection: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  infoSectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 11,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 16,
  },
  paymentSection: {
    marginTop: 28,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 14,
    textAlign: 'center',
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  paymentBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  paymentObs: {
    fontSize: 11,
    color: COLORS.grayLight,
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    backgroundColor: COLORS.primary,
    marginTop: 32,
    padding: 30,
    alignItems: 'center',
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  footerLogoIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogoName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  footerLogoSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  footerDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCopy: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});
