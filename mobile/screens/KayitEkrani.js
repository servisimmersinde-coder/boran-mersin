import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function KayitEkrani({ navigation, onLogin }) {
  const [rol, setRol] = useState('kurye');
  const [adSoyad, setAdSoyad] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [aracTipi, setAracTipi] = useState('motorlu');
  const [plaka, setPlaka] = useState('');
  const [isletmeAdi, setIsletmeAdi] = useState('');
  const [adres, setAdres] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const kayitOl = async () => {
    if (!adSoyad || !telefon || !sifre) {
      Alert.alert('Hata', 'Ad, telefon ve sifre alanlarini doldurun');
      return;
    }
    if (rol === 'isletme' && !isletmeAdi) {
      Alert.alert('Hata', 'Isletme adi zorunludur');
      return;
    }

    setYukleniyor(true);
    try {
      const veriler = { rol, ad_soyad: adSoyad, telefon, sifre };
      if (rol === 'kurye') { veriler.arac_tipi = aracTipi; veriler.plaka = plaka; }
      if (rol === 'isletme') { veriler.email = email; veriler.isletme_adi = isletmeAdi; veriler.adres = adres; }

      const sonuc = await api.kayit(veriler);
      onLogin(sonuc.token, sonuc.kullanici);
    } catch (hata) {
      Alert.alert('Kayit Hatasi', hata.message);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.konteyner} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.baslikAlani}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.baslik}>Kayit Ol</Text>
      </View>

      <ScrollView style={styles.formKonteyner} showsVerticalScrollIndicator={false}>
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
          <Ionicons name="person-outline" size={20} color="#999" style={styles.ikon} />
          <TextInput style={styles.input} placeholder="Ad Soyad" placeholderTextColor="#999" value={adSoyad} onChangeText={setAdSoyad} />
        </View>

        <View style={styles.inputAlani}>
          <Ionicons name="call-outline" size={20} color="#999" style={styles.ikon} />
          <TextInput style={styles.input} placeholder="Telefon Numarasi" placeholderTextColor="#999" keyboardType="phone-pad" value={telefon} onChangeText={setTelefon} />
        </View>

        {rol === 'isletme' && (
          <>
            <View style={styles.inputAlani}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.ikon} />
              <TextInput style={styles.input} placeholder="E-posta" placeholderTextColor="#999" keyboardType="email-address" value={email} onChangeText={setEmail} />
            </View>
            <View style={styles.inputAlani}>
              <Ionicons name="storefront-outline" size={20} color="#999" style={styles.ikon} />
              <TextInput style={styles.input} placeholder="Isletme Adi" placeholderTextColor="#999" value={isletmeAdi} onChangeText={setIsletmeAdi} />
            </View>
            <View style={styles.inputAlani}>
              <Ionicons name="location-outline" size={20} color="#999" style={styles.ikon} />
              <TextInput style={styles.input} placeholder="Isletme Adresi" placeholderTextColor="#999" multiline value={adres} onChangeText={setAdres} />
            </View>
          </>
        )}

        {rol === 'kurye' && (
          <>
            <Text style={styles.etiket}>Arac Tipi</Text>
            <View style={styles.aracSecimi}>
              {['motorlu', 'bisiklet', 'yaya'].map(tip => (
                <TouchableOpacity key={tip} style={[styles.aracButon, aracTipi === tip && styles.aracAktif]} onPress={() => setAracTipi(tip)}>
                  <Text style={[styles.aracYazi, aracTipi === tip && styles.aracYaziAktif]}>
                    {tip === 'motorlu' ? 'Motorlu' : tip === 'bisiklet' ? 'Bisiklet' : 'Yaya'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inputAlani}>
              <Ionicons name="car-outline" size={20} color="#999" style={styles.ikon} />
              <TextInput style={styles.input} placeholder="Plaka (opsiyonel)" placeholderTextColor="#999" value={plaka} onChangeText={setPlaka} />
            </View>
          </>
        )}

        <View style={styles.inputAlani}>
          <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.ikon} />
          <TextInput style={styles.input} placeholder="Sifre" placeholderTextColor="#999" secureTextEntry value={sifre} onChangeText={setSifre} />
        </View>

        <TouchableOpacity style={styles.kayitButon} onPress={kayitOl} disabled={yukleniyor}>
          <Text style={styles.kayitYazi}>{yukleniyor ? 'Kayit yapiliyor...' : 'KAYIT OL'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.girisLinki} onPress={() => navigation.goBack()}>
          <Text style={styles.girisYazi}>Zaten hesabiniz var mi? <Text style={styles.girisVurgu}>Giris Yap</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  konteyner: { flex: 1, backgroundColor: '#FF6B00' },
  baslikAlani: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  geriButon: { marginRight: 15 },
  baslik: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  formKonteyner: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  rolSecimi: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginBottom: 25, marginTop: 10 },
  rolButon: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, borderWidth: 2, borderColor: '#FF6B00', gap: 8 },
  rolAktif: { backgroundColor: '#FF6B00' },
  rolYazi: { fontSize: 16, fontWeight: '600', color: '#FF6B00' },
  rolYaziAktif: { color: '#fff' },
  inputAlani: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15 },
  ikon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: '#333' },
  etiket: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginLeft: 5 },
  aracSecimi: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  aracButon: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: '#FF6B00', alignItems: 'center' },
  aracAktif: { backgroundColor: '#FF6B00' },
  aracYazi: { fontWeight: '600', color: '#FF6B00' },
  aracYaziAktif: { color: '#fff' },
  kayitButon: { backgroundColor: '#FF6B00', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  kayitYazi: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  girisLinki: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  girisYazi: { fontSize: 14, color: '#666' },
  girisVurgu: { color: '#FF6B00', fontWeight: 'bold' }
});
