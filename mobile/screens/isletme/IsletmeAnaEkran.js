import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function IsletmeAnaEkran() {
  const [aktifSiparisler, setAktifSiparisler] = useState([]);
  const [istatistikler, setIstatistikler] = useState({ toplam: 0, aktif: 0, tamamlanan: 0 });
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => { verileriYukle(); }, []);

  const verileriYukle = async () => {
    setYukleniyor(true);
    try {
      const aktif = await api.isletmeAktif();
      setAktifSiparisler(aktif);
      setIstatistikler({ toplam: aktif.length, aktif: aktif.filter(s => ['bekliyor', 'atandi'].includes(s.durum)).length, tamamlanan: 0 });
    } catch (hata) { console.error(hata); }
    setYukleniyor(false);
  };

  const durumRengi = (durum) => {
    const renkler = { bekliyor: '#FFC107', atandi: '#2196F3', alindi: '#9C27B0', yolda: '#FF9800' };
    return renkler[durum] || '#999';
  };

  return (
    <ScrollView style={styles.konteyner} refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={verileriYukle} tintColor="#FF6B00" />}>
      <View style={styles.istatistikler}>
        <View style={[styles.istatistikKart, { borderLeftColor: '#FF6B00' }]}>
          <Text style={styles.istatistikDeger}>{istatistikler.aktif}</Text>
          <Text style={styles.istatistikEtiket}>Aktif Siparis</Text>
        </View>
        <View style={[styles.istatistikKart, { borderLeftColor: '#4CAF50' }]}>
          <Text style={styles.istatistikDeger}>{istatistikler.tamamlanan}</Text>
          <Text style={styles.istatistikEtiket}>Tamamlanan</Text>
        </View>
      </View>

      <View style={styles.baslikAlani}>
        <Text style={styles.baslik}>Aktif Siparisler</Text>
      </View>

      {aktifSiparisler.length === 0 ? (
        <View style={styles.bosKonteyner}>
          <Ionicons name="cube-outline" size={64} color="#ccc" />
          <Text style={styles.bosYazi}>Aktif siparis bulunmuyor</Text>
        </View>
      ) : (
        aktifSiparisler.map((siparis) => (
          <View key={siparis.id} style={styles.siparisKarti}>
            <View style={styles.kartBaslik}>
              <Text style={styles.siparisNo}>#{siparis.siparis_no}</Text>
              <View style={[styles.durumKutu, { backgroundColor: durumRengi(siparis.durum) }]}>
                <Text style={styles.durumYazi}>{siparis.durum.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.detaylar}>
              <View style={styles.detaySatiri}>
                <Ionicons name="person" size={16} color="#666" />
                <Text style={styles.detay}>Alici: {siparis.alic_ad}</Text>
              </View>
              <View style={styles.detaySatiri}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.detay} numberOfLines={2}>{siparis.alic_adres}</Text>
              </View>
              {siparis.kurye && (
                <View style={styles.detaySatiri}>
                  <Ionicons name="bicycle" size={16} color="#FF6B00" />
                  <Text style={styles.detay}>Kurye: {siparis.kullanici?.ad_soyad}</Text>
                </View>
              )}
            </View>

            <View style={styles.kartAlt}>
              <Text style={styles.ucret}>{siparis.ucret} TL</Text>
              <Text style={styles.tarih}>{new Date(siparis.olusturma_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  konteyner: { flex: 1, backgroundColor: '#f5f5f5' },
  istatistikler: { flexDirection: 'row', padding: 15, gap: 15 },
  istatistikKart: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 20, borderLeftWidth: 4, elevation: 2 },
  istatistikDeger: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  istatistikEtiket: { fontSize: 13, color: '#999', marginTop: 4 },
  baslikAlani: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 5 },
  baslik: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  siparisKarti: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 12, borderRadius: 12, padding: 15, elevation: 2 },
  kartBaslik: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  siparisNo: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  durumKutu: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  durumYazi: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  detaylar: { gap: 6 },
  detaySatiri: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detay: { fontSize: 14, color: '#666', flex: 1 },
  kartAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  ucret: { fontSize: 18, fontWeight: 'bold', color: '#FF6B00' },
  tarih: { fontSize: 13, color: '#999' },
  bosKonteyner: { alignItems: 'center', marginTop: 50 },
  bosYazi: { fontSize: 16, color: '#999', marginTop: 15 }
});
