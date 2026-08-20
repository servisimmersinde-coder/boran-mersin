import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function IsletmeSiparisler() {
  const [siparisler, setSiparisler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sayfa, setSayfa] = useState(1);
  const [toplam, setToplam] = useState(0);

  useEffect(() => { siparisleriYukle(); }, []);

  const siparisleriYukle = async (yeniSayfa = 1) => {
    setYukleniyor(true);
    try {
      const veri = await api.isletmeSiparislerim(yeniSayfa);
      if (yeniSayfa === 1) { setSiparisler(veri.siparisler); }
      else { setSiparisler([...siparisler, ...veri.siparisler]); }
      setToplam(veri.toplam);
      setSayfa(yeniSayfa);
    } catch (hata) { console.error(hata); }
    setYukleniyor(false);
  };

  const durumRengi = (durum) => {
    const renkler = { bekliyor: '#FFC107', atandi: '#2196F3', alindi: '#9C27B0', yolda: '#FF9800', teslim: '#4CAF50', iptal: '#F44336' };
    return renkler[durum] || '#999';
  };

  const renderItem = ({ item }) => (
    <View style={styles.kart}>
      <View style={styles.kartBaslik}>
        <Text style={styles.siparisNo}>#{item.siparis_no}</Text>
        <View style={[styles.durumKutu, { backgroundColor: durumRengi(item.durum) }]}>
          <Text style={styles.durumYazi}>{item.durum.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.detaylar}>
        <View style={styles.detaySatiri}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.detay}>Alici: {item.alic_ad}</Text>
        </View>
        <View style={styles.detaySatiri}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detay} numberOfLines={1}>{item.alic_adres}</Text>
        </View>
        {item.kurye && (
          <View style={styles.detaySatiri}>
            <Ionicons name="bicycle" size={16} color="#FF6B00" />
            <Text style={styles.detay}>Kurye: {item.kurye.kullanici?.ad_soyad || 'Atanmadi'}</Text>
          </View>
        )}
      </View>

      <View style={styles.kartAlt}>
        <Text style={styles.ucret}>{item.ucret} TL</Text>
        <Text style={styles.tarih}>{new Date(item.olusturma_tarihi).toLocaleDateString('tr-TR')} {new Date(item.olusturma_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>

      {['bekliyor', 'atandi'].includes(item.durum) && (
        <TouchableOpacity style={styles.iptalButon} onPress={() => iptalEt(item.id)}>
          <Ionicons name="close-circle" size={18} color="#F44336" />
          <Text style={styles.iptalYazi}>Iptal Et</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const iptalEt = async (id) => {
    try {
      await api.siparisIptal(id, 'Isletme tarafindan iptal');
      siparisleriYukle();
    } catch (hata) { console.error(hata); }
  };

  return (
    <View style={styles.konteyner}>
      <View style={styles.baslikAlani}>
        <Text style={styles.baslik}>Siparislerim ({toplam})</Text>
      </View>
      <FlatList data={siparisler} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} contentContainerStyle={styles.liste} refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={() => siparisleriYukle(1)} tintColor="#FF6B00" />} onEndReached={() => { if (siparisler.length < toplam) siparisleriYukle(sayfa + 1); }} onEndReachedThreshold={0.5} ListEmptyComponent={<Text style={styles.bos}>Henuz siparis yok</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  konteyner: { flex: 1, backgroundColor: '#f5f5f5' },
  baslikAlani: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 5 },
  baslik: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  liste: { padding: 15 },
  kart: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  kartBaslik: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  siparisNo: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  durumKutu: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  durumYazi: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  detaylar: { gap: 6 },
  detaySatiri: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detay: { fontSize: 14, color: '#666', flex: 1 },
  kartAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  ucret: { fontSize: 18, fontWeight: 'bold', color: '#FF6B00' },
  tarih: { fontSize: 12, color: '#999' },
  iptalButon: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#F44336', gap: 5 },
  iptalYazi: { color: '#F44336', fontWeight: '600' },
  bos: { textAlign: 'center', color: '#999', marginTop: 50, fontSize: 16 }
});
