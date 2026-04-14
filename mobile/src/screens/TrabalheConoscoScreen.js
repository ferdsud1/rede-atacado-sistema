import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../data/colors';

const beneficios = [
  { icon: 'people', titulo: 'Ambiente Colaborativo', desc: 'Trabalhe em uma equipe unida e motivada' },
  { icon: 'trending-up', titulo: 'Crescimento Profissional', desc: 'Oportunidades de desenvolvimento e carreira' },
  { icon: 'heart', titulo: 'Benefícios', desc: 'Pacote completo de benefícios para você e sua família' },
];

const areas = [
  'Vendas e Atendimento',
  'Logística e Estoque',
  'Administrativo',
  'Gerência',
];

export default function TrabalheConoscoScreen() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
    mensagem: '',
  });
  const [enviando, setEnviando] = useState(false);

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const enviarCandidatura = async () => {
    if (!form.nome || !form.email || !form.cargo) {
      Alert.alert('Atenção', 'Preencha os campos obrigatórios: Nome, E-mail e Cargo.');
      return;
    }

    setEnviando(true);
    try {
      // Simula envio (substituir pela URL real da API)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        'Candidatura Enviada!',
        'Recebemos seus dados. Entraremos em contato em breve.',
        [{ text: 'OK' }]
      );
      setForm({ nome: '', email: '', telefone: '', cargo: '', mensagem: '' });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar a candidatura. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const abrirWhatsAppRH = () => {
    Linking.openURL('https://wa.me/555194758382?text=Olá, tenho interesse em trabalhar no Certo Atacado!');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={styles.hero}>
          <Ionicons name="briefcase" size={40} color="#fff" />
          <Text style={styles.heroTitle}>Trabalhe Conosco</Text>
          <Text style={styles.heroSubtitle}>
            Faça parte do nosso time e cresça com a gente!
          </Text>
        </View>

        {/* POR QUE TRABALHAR CONOSCO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Por que trabalhar conosco?</Text>
          <Text style={styles.sectionSubtitle}>
            Oferecemos um ambiente de trabalho que valoriza o crescimento e o bem-estar de cada colaborador
          </Text>
          <View style={styles.beneficiosGrid}>
            {beneficios.map((item, index) => (
              <View key={index} style={styles.beneficioCard}>
                <View style={styles.beneficioIcon}>
                  <Ionicons name={item.icon} size={28} color="#fff" />
                </View>
                <Text style={styles.beneficioTitulo}>{item.titulo}</Text>
                <Text style={styles.beneficioDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ÁREAS DE ATUAÇÃO */}
        <View style={styles.areasSection}>
          <Text style={styles.areasTitulo}>Áreas de Atuação</Text>
          {areas.map((area, index) => (
            <View key={index} style={styles.areaItem}>
              <View style={styles.areaDot} />
              <Text style={styles.areaText}>{area}</Text>
            </View>
          ))}
        </View>

        {/* WHATSAPP RH */}
        <TouchableOpacity style={styles.whatsappBtn} onPress={abrirWhatsAppRH} activeOpacity={0.85}>
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          <Text style={styles.whatsappBtnText}>Falar com RH no WhatsApp</Text>
        </TouchableOpacity>

        {/* FORMULÁRIO */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Formulário de Candidatura</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome completo"
              placeholderTextColor={COLORS.grayLight}
              value={form.nome}
              onChangeText={(v) => handleChange('nome', v)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>E-mail *</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor={COLORS.grayLight}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(v) => handleChange('email', v)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Telefone (WhatsApp)</Text>
            <TextInput
              style={styles.input}
              placeholder="(51) 99999-9999"
              placeholderTextColor={COLORS.grayLight}
              keyboardType="phone-pad"
              value={form.telefone}
              onChangeText={(v) => handleChange('telefone', v)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Cargo de Interesse *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Vendedor, Estoquista, etc."
              placeholderTextColor={COLORS.grayLight}
              value={form.cargo}
              onChangeText={(v) => handleChange('cargo', v)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mensagem</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Conte-nos um pouco sobre você e sua experiência..."
              placeholderTextColor={COLORS.grayLight}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={form.mensagem}
              onChangeText={(v) => handleChange('mensagem', v)}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, enviando && styles.submitBtnDisabled]}
            onPress={enviarCandidatura}
            disabled={enviando}
            activeOpacity={0.85}
          >
            <Ionicons name="paper-plane" size={18} color="#fff" />
            <Text style={styles.submitBtnText}>
              {enviando ? 'Enviando...' : 'Enviar Candidatura'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* CONTATO RH */}
        <View style={styles.contatoSection}>
          <Text style={styles.contatoTitle}>Contato do RH</Text>
          <View style={styles.contatoItem}>
            <Ionicons name="call-outline" size={20} color={COLORS.primary} />
            <Text style={styles.contatoText}>(51) 9475-8382</Text>
          </View>
          <View style={styles.contatoItem}>
            <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
            <Text style={styles.contatoText}>contato@certoatacado.com</Text>
          </View>
          <View style={styles.contatoItem}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.contatoText}>Taquara, RS</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 Certo Atacado & Varejo{'\n'}Todos os direitos reservados.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  hero: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 35,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginTop: 12,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  section: {
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  beneficiosGrid: {
    gap: 14,
  },
  beneficioCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  beneficioIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  beneficioTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 6,
  },
  beneficioDesc: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  areasSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  areasTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
  },
  areaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  areaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  areaText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: '500',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  whatsappBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  formSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: COLORS.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.black,
  },
  textarea: {
    height: 120,
    paddingTop: 14,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  contatoSection: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  contatoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
  },
  contatoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  contatoText: {
    fontSize: 15,
    color: COLORS.gray,
  },
  footer: {
    backgroundColor: COLORS.primary,
    padding: 24,
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
