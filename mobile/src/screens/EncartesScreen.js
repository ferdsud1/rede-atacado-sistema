import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { COLORS } from '../data/colors';
import { encartes } from '../data/encartes';
import EncarteCard from '../components/EncarteCard';

export default function EncartesScreen({ navigation }) {
  const abrirEncarte = (encarte) => {
    navigation.navigate('EncarteDetalhe', { encarte, titulo: encarte.titulo });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={encartes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <EncarteCard encarte={item} onPress={abrirEncarte} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.headerText}>
            Confira nossos encartes e promoções da semana!
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 16,
  },
  headerText: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
});
