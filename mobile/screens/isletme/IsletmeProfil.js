import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export default function IsletmeProfil({ navigation }) {
  const [profil, setProfil] = useState(null);

  useEffect(() => { profilYukle(); }, []);

  const profilYukle = async () => {
    try {
      const data = await api.isletmeProfil();
      setProfil(data);
    } catch (hata) { console.error(hata); }
  };

  const cikisYap = async () => {
    Alert.alert('Cikis', 'Cikis yapmak istediginize emin misiniz?', [
      { text: 'Iptal', style: 'cancel' },
      { text: 'Cikis Yap', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('kullanici');
        navigation.replace('Giris');
      }}
    ]);
  };

  if (!profil) return <View style={styles.konteyner}><Text style={styles.yukleniyor}>Yukleniyor...</Text></View>;

  return (
    <ScrollView style={styles.konteyner}>
      <View style={styles.baslikAlani}>
        <View style={styles.avatar}>
          <Ionicons name="storefront" size={50} color="#fff" />
        </View>
        <Text style={styles.ad}>{profil.isletme_adi}</Text>
        <Text style={styles.tur}>{profil.isletme_turu}</Text>
        <View style={styles.rolKutu}>
          <Ionicons name="business" size={16} color="#FF6B00" />
          <Text style={styles.rolYazi}>Isletme</Text>
        </View>
      </View>

      <View style={styles.ekBilgi}>
        <View style={styles.bilgiSatiri}>
          <Ionicons name="location" size={20} color="#666" />
          <Text style={styles.bilgiDeger}>{profil.adres || 'Adres belirtilmemis'}</Text>
        </View>
        <View style={styles.bilgiSatiri}>
          <Ionicons name="time" size={20} color="#666" />
          <Text style={styles.bilgiDeger}>Calisma Saati: {profil.calisma_saati}</Text>
        </View>
        <View style={styles.bilgiSatiri}>
          <Ionicons name="cash" size={20} color="#666" />
          <Text style={styles.bilgiDeger}>Toplam Borc: {profil.toplam_borc || 0} TL</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuOgesi}>
          <Ionicons name="create-outline" size={24} color="#FF6B00" />
          <Text style={styles.menuYazi}>Isletme Bilgilerini Duzenle</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuOgesi}>
          <Ionicons name="receipt-outline" size={24} color="#FF6B00" />
          <Text style={styles.menuYazi}>Borc / Fatura Takibi</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuOgesi}>
          <Ionicons name="bar-chart-outline" size={24} color="#FF6B00" />
          <Text style={styles.menuYazi}>Raporlar</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuOgesi}>
          <Ionicons name="help-circle-outline" size={24} color="#FF6B00" />
          <Text style={styles.menuYazi}>Yardim</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuOgesi, styles.cikisOgesi]} onPress={cikisYap}>
          <Ionicons name="log-out-outline" size={24} color="#F44336" />
          <Text style={[styles.menuYazi, styles.cikisYazi]}>Cikis Yap</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  konteyner: { flex: 1, backgroundColor: '#f5f5f5' },
  yukleniyor: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#999' },
  baslikAlani: { backgroundColor: '#FF6B00', paddingVertical: 30, alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  ad: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  tur: { fontSize: 16, color: '#fff', opacity: 0.8, marginTop: 5 },
  rolKutu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15, marginTop: 10, gap: 5 },
  rolYazi: { fontSize: 14, fontWeight: '600', color: '#FF6B00' },
  ekBilgi: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 12 },
  bilgiSatiri: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  bilgiDeger: { fontSize: 14, color: '#333', flex: 1 },
  menu: { backgroundColor: '#fff', margin: 15, borderRadius: 12, overflow: 'hidden' },
  menuOgesi: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 15 },
  menuYazi: { flex: 1, fontSize: 16, color: '#333' },
  cikisOgesi: { borderBottomWidth: 0 },
  cikisYazi: { color: '#F44336' }
});
