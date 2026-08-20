import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function GirisEkrani({ navigation, onLogin }) {
  const [telefon, setTelefon] = useState('');
  const [sifre, setSifre] = useState('');
  const [rol, setRol] = useState('kurye');
  const [yukleniyor, setYukleniyor] = useState(false);

  const girisYap = async () => {
    if (!telefon || !sifre) {
      Alert.alert('Hata', 'Telefon ve sifre alanlarini doldurun');
      return;
    }

    setYukleniyor(true);
    try {
      const sonuc = await api.giris(telefon, sifre, rol);
      onLogin(sonuc.token, sonuc.kullanici);
    } catch (hata) {
      Alert.alert('Giris Hatasi', hata.message);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.konteyner} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.ustKisim}>
        <Ionicons name="bicycle" size={80} color="#fff" />
        <Text style={styles.baslik}>Boran Mersin</Text>
        <Text style={styles.altBaslik}>Kurye Havuz Sistemi</Text>
      </View>

      <View style={styles.formKonteyner}>
        <Text style={styles.formBaslik}>Giris Yap</Text>

        <View style={styles.rolSecimi}>
          <TouchableOpacity style={[styles.rolButon, rol === 'kurye' && styles.rolAktif]} onPress={() => setRol('kurye')}>
            <Ionicons name="bicycle" size={24} color={rol === 'kurye' ? '#fff' : '#FF6B00'} />
            <Text style={[styles.rolYazi, rol === 'kurye' && styles.rolYaziAktif]}>Kurye</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rolButon, rol === 'isletme' && styles.rolAktif]} onPress={() => setRol('isletme')}>
            <Ionicons name="storefront" size={24} color={rol === 'isletme' ? '#fff' : '#FF6B00'} />
            <Text style={[styles.rolYazi, rol === 'isletme' && styles.rolYaziAktif]}>Isletme</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputAlani}>
          <Ionicons name="call-outline" size={20} color="#999" style={styles.ikon} />
          <TextInput style={styles.input} placeholder="Telefon Numarasi" placeholderTextColor="#999" keyboardType="phone-pad" value={telefon} onChangeText={setTelefon} />
        </View>

        <View style={styles.inputAlani}>
          <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.ikon} />
          <TextInput style={styles.input} placeholder="Sifre" placeholderTextColor="#999" secureTextEntry value={sifre} onChangeText={setSifre} />
        </View>

        <TouchableOpacity style={styles.girisButon} onPress={girisYap} disabled={yukleniyor}>
          <Text style={styles.girisYazi}>{yukleniyor ? 'Giris yapiliyor...' : 'GIRIS YAP'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.kayitLinki} onPress={() => navigation.navigate('Kayit')}>
          <Text style={styles.kayitYazi}>Hesabiniz yok mu? <Text style={styles.kayitVurgu}>Kayit Ol</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  konteyner: { flex: 1, backgroundColor: '#FF6B00' },
  ustKisim: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  baslik: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  altBaslik: { fontSize: 16, color: '#fff', opacity: 0.8, marginTop: 5 },
  formKonteyner: { flex: 2, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30 },
  formBaslik: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 20 },
  rolSecimi: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginBottom: 25 },
  rolButon: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, borderWidth: 2, borderColor: '#FF6B00', gap: 8 },
  rolAktif: { backgroundColor: '#FF6B00' },
  rolYazi: { fontSize: 16, fontWeight: '600', color: '#FF6B00' },
  rolYaziAktif: { color: '#fff' },
  inputAlani: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15 },
  ikon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: '#333' },
  girisButon: { backgroundColor: '#FF6B00', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  girisYazi: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  kayitLinki: { alignItems: 'center', marginTop: 20 },
  kayitYazi: { fontSize: 14, color: '#666' },
  kayitVurgu: { color: '#FF6B00', fontWeight: 'bold' }
});
