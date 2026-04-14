import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../data/colors';

const stats = [
  { icon: 'calendar', numero: '30+', label: 'Anos de Tradição' },
  { icon: 'storefront', numero: '4', label: 'Lojas' },
  { icon: 'people', numero: '500+', label: 'Colaboradores' },
  { icon: 'heart', numero: '50mil+', label: 'Clientes' },
];

const timeline = [
  {
    ano: '1994',
    titulo: 'O Início',
    descricao:
      'Fundação da primeira loja em Taquara, RS. Com muita dedicação e trabalho, nasceu o Certo Atacado, um pequeno mercado com o sonho de oferecer qualidade e preço justo.',
  },
  {
    ano: '2005',
    titulo: 'Expansão',
    descricao:
      'Abertura da segunda loja no bairro Santa Maria, em Taquara. A confiança dos clientes permitiu o crescimento e a ampliação do atendimento na região.',
  },
  {
    ano: '2015',
    titulo: 'Rede Müller',
    descricao:
      'Integração à Rede Müller, fortalecendo o poder de compra e oferecendo ainda mais vantagens aos clientes. Inauguração da loja em Parobé.',
    destaques: [
      'Parceria com Rede Müller',
      'Maior variedade de produtos',
      'Preços ainda mais competitivos',
    ],
  },
  {
    ano: '2023',
    titulo: 'Modernização',
    descricao:
      'Lançamento do Clube Mais Vantagens, sistema digital de encartes e expansão para a quarta loja no bairro Cruzeiro.',
    destaques: [
      'Clube Mais Vantagens',
      'App disponível na App Store e Google Play',
      'Sistema de encartes digitais',
      'Televendas por WhatsApp',
    ],
  },
];

export default function HistoriaScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HERO */}
      <View style={styles.hero}>
        <View style={styles.heroIconBox}>
          <Ionicons name="time" size={40} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Nossa História</Text>
        <Text style={styles.heroSubtitle}>Tradição e confiança a serviço de Taquara</Text>
      </View>

      {/* STATS */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name={stat.icon} size={26} color="#fff" />
              </View>
              <Text style={styles.statNumero}>{stat.numero}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* TIMELINE */}
      <View style={styles.timelineSection}>
        <Text style={styles.sectionTitle}>Nossa Trajetória</Text>
        <View style={styles.timelineLine} />
        {timeline.map((item, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineYearBadge}>
              <Text style={styles.timelineYear}>{item.ano}</Text>
            </View>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitulo}>{item.titulo}</Text>
              <Text style={styles.timelineDesc}>{item.descricao}</Text>
              {item.destaques && (
                <View style={styles.destaquesBox}>
                  {item.destaques.map((dest, i) => (
                    <View key={i} style={styles.destaqueRow}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                      <Text style={styles.destaqueText}>{dest}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* DESTAQUE FINAL */}
      <View style={styles.highlightSection}>
        <Text style={styles.highlightEmoji}>🛒</Text>
        <Text style={styles.highlightTitle}>
          "Lugar certo de comprar barato"
        </Text>
        <Text style={styles.highlightDesc}>
          Mais de 30 anos oferecendo qualidade, economia e respeito aos nossos clientes.
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
  hero: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '300',
  },
  statsSection: {
    paddingVertical: 30,
    paddingHorizontal: 16,
    backgroundColor: '#fff5f0',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumero: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '600',
    textAlign: 'center',
  },
  timelineSection: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    position: 'relative',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 40,
  },
  timelineLine: {
    position: 'absolute',
    left: 36,
    top: 120,
    bottom: 40,
    width: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  timelineItem: {
    marginBottom: 32,
    paddingLeft: 56,
    position: 'relative',
  },
  timelineYearBadge: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 2,
  },
  timelineYear: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  timelineDot: {
    position: 'absolute',
    left: 30,
    top: 10,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: COLORS.primary,
    zIndex: 3,
  },
  timelineContent: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  timelineTitulo: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 10,
  },
  timelineDesc: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 22,
  },
  destaquesBox: {
    marginTop: 14,
    gap: 8,
  },
  destaqueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  destaqueText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  highlightSection: {
    backgroundColor: COLORS.primary,
    padding: 40,
    alignItems: 'center',
    marginTop: 10,
  },
  highlightEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  highlightTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  highlightDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
});
