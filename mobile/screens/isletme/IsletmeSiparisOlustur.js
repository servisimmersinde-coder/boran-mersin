import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function IsletmeSiparisOlustur() {
  const [aliciAd, setAliciAd] = useState('');
  const [aliciTel, setAliciTel] = useState('');
  const [aliciAdres, setAliciAdres] = useState('');
  const [paketAciklama, setPaketAciklama] = useState('');
  const [paketAgirligi, setPaketAgirligi] = useState('');
  const [oncelik, setOncelik] = useState('normal');
  const [odemeTuru, setOdemeTuru] = useState('nakit');
  const [ucret, setUcret] = useState('');
  const [notlar, setNotlar] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const siparisOlustur = async () => {
    if (!aliciAd || !aliciTel || !aliciAdres || !paketAciklama) {
      Alert.alert('Hata', 'Alici bilgileri ve paket aciklamasi zorunludur');
      return;
    }

    setYukleniyor(true);
    try {
      await api.siparisOlustur({
        alic_ad: aliciAd,
        alic_tel: aliciTel,
        alic_adres: aliciAdres,
        paket_aciklama: paketAciklama,
        paket_agirligi: paketAgirligi ? parseFloat(paketAgirligi) : null,
        oncelik,
        odeme_turu: odemeTuru,
        ucret: ucret ? parseFloat(ucret) : null,
        notlar
      });

      Alert.alert('Basarili', 'Siparis olusturuldu! Kurye bekleniyor...', [{ text: 'Tamam' }]);
      setAliciAd(''); setAliciTel(''); setAliciAdres(''); setPaketAciklama(''); setPaketAgirligi(''); setOncelik('normal'); setOdemeTuru('nakit'); setUcret(''); setNotlar('');
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.konteyner} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.baslik}>Yeni Siparis Olustur</Text>

        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Alici Bilgileri</Text>
          <View style={styles.inputAlani}>
            <Ionicons name="person-outline" size={20} color="#999" style={styles.ikon} />
            <TextInput style={styles.input} placeholder="Alici Adi" placeholderTextColor="#999" value={aliciAd} onChangeText={setAliciAd} />
          </View>
          <View style={styles.inputAlani}>
            <Ionicons name="call-outline" size={20} color="#999" style={styles.ikon} />
            <TextInput style={styles.input} placeholder="Alici Telefon" placeholderTextColor="#999" keyboardType="phone-pad" value={aliciTel} onChangeText={setAliciTel} />
          </View>
          <View style={[styles.inputAlani, styles.adresAlani]}>
            <Ionicons name="location-outline" size={20} color="#999" style={styles.ikon} />
            <TextInput style={[styles.input, styles.adresInput]} placeholder="Teslimat Adresi" placeholderTextColor="#999" multiline numberOfLines={3} value={aliciAdres} onChangeText={setAliciAdres} />
          </View>
        </View>

        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Paket Bilgileri</Text>
          <View style={[styles.inputAlani, styles.adresAlani]}>
            <Ionicons name="cube-outline" size={20} color="#999" style={styles.ikon} />
            <TextInput style={[styles.input, styles.adresInput]} placeholder="Paket Aciklamasi" placeholderTextColor="#999" multiline value={paketAciklama} onChangeText={setPaketAciklama} />
          </View>
          <View style={styles.inputAlani}>
            <Ionicons name="scale-outline" size={20} color="#999" style={styles.ikon} />
            <TextInput style={styles.input} placeholder="Agirlik (kg, opsiyonel)" placeholderTextColor="#999" keyboardType="numeric" value={paketAgirligi} onChangeText={setPaketAgirligi} />
          </View>
        </View>

        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Oncelik</Text>
          <View style={styles.secimSatiri}>
            {[{ deger: 'normal', etiket: 'Normal' }, { deger: 'acil', etiket: 'Acil (+50%)' }, { deger: 'vip', etiket: 'VIP' }].map(secenek => (
              <TouchableOpacity key={secenek.deger} style={[styles.secimButonu, oncelik === secenek.deger && styles.secimAktif]} onPress={() => setOncelik(secenek.deger)}>
                <Text style={[styles.secimYazi, oncelik === secenek.deger && styles.secimYaziAktif]}>{secenek.etiket}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Odeme Turu</Text>
          <View style={styles.secimSatiri}>
            {[{ deger: 'nakit', etiket: 'Nakit' }, { deger: 'kart', etiket: 'Kart' }, { deger: 'fatura', etiket: 'Fatura' }].map(secenek => (
              <TouchableOpacity key={secenek.deger} style={[styles.secimButonu, odemeTuru === secenek.deger && styles.secimAktif]} onPress={() => setOdemeTuru(secenek.deger)}>
                <Text style={[styles.secimYazi, odemeTuru === secenek.deger && styles.secimYaziAktif]}>{secenek.etiket}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Ucret (opsiyonel - sistem hesaplar)</Text>
          <View style={styles.inputAlani}>
            <Ionicons name="cash-outline" size={20} color="#999" style={styles.ikon} />
            <TextInput style={styles.input} placeholder="Ucret (TL)" placeholderTextColor="#999" keyboardType="numeric" value={ucret} onChangeText={setUcret} />
          </View>
        </View>

        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Notlar (opsiyonel)</Text>
          <View style={[styles.inputAlani, styles.adresAlani]}>
            <Ionicons name="document-text-outline" size={20} color="#999" style={styles.ikon} />
            <TextInput style={[styles.input, styles.adresInput]} placeholder="Siparis notlari..." placeholderTextColor="#999" multiline value={notlar} onChangeText={setNotlar} />
          </View>
        </View>

        <TouchableOpacity style={[styles.gonderButon, yukleniyor && styles.gonderButonPasif]} onPress={siparisOlustur} disabled={yukleniyor}>
          <Ionicons name="send" size={22} color="#fff" />
          <Text style={styles.gonderYazi}>{yukleniyor ? 'Gonderiliyor...' : 'SIPARIS OLUSTUR'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  konteyner: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  baslik: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  bolum: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15 },
  bolumBaslik: { fontSize: 16, fontWeight: 'bold', color: '#FF6B00', marginBottom: 12 },
  inputAlani: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, marginBottom: 10, paddingHorizontal: 15 },
  adresAlani: { alignItems: 'flex-start' },
  ikon: { marginRight: 10, marginTop: 5 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#333' },
  adresInput: { minHeight: 80, textAlignVertical: 'top', paddingTop: 14 },
  secimSatiri: { flexDirection: 'row', gap: 10 },
  secimButonu: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: '#ddd', alignItems: 'center' },
  secimAktif: { borderColor: '#FF6B00', backgroundColor: '#FF6B00' },
  secimYazi: { fontSize: 14, fontWeight: '600', color: '#666' },
  secimYaziAktif: { color: '#fff' },
  gonderButon: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF6B00', paddingVertical: 16, borderRadius: 12, gap: 10, marginBottom: 30 },
  gonderButonPasif: { opacity: 0.6 },
  gonderYazi: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
