import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function KuryeSiparisler() {
  const [siparisler, setSiparisler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [aktifTab, setAktifTab] = useState('aktif');

  useEffect(() => { siparisleriYukle(); }, [aktifTab]);

  const siparisleriYukle = async () => {
    setYukleniyor(true);
    try {
      const veri = aktifTab === 'aktif' ? await api.kuryeAktifSiparisler() : await api.kuryeSiparislerim();
      setSiparisler(veri);
    } catch (hata) { console.error(hata); }
    setYukleniyor(false);
  };

  const durumRengi = (durum) => {
    const renkler = { bekliyor: '#FFC107', atandi: '#2196F3', alindi: '#9C27B0', yolda: '#FF9800', teslim: '#4CAF50', iptal: '#F44336' };
    return renkler[durum] || '#999';
  };

  const durumIkonu = (durum) => {
    const ikonlar = { bekliyor: 'time', atandi: 'checkmark-circle', alindi: 'hand-left', yolda: 'car', teslim: 'checkmark-done', iptal: 'close-circle' };
    return ikonlar[durum] || 'help-circle';
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.kart} onPress={() => Alert.alert('Siparis Detayi', `Siparis No: ${item.siparis_no}\nDurum: ${item.durum}\n Alici: ${item.alic_ad}\nAdres: ${item.alic_adres}\nUcret: ${item.ucret} TL`)}>
      <View style={styles.kartBaslik}>
        <Text style={styles.siparisNo}>#{item.siparis_no}</Text>
        <View style={[styles.durumKutu, { backgroundColor: durumRengi(item.durum) }]}>
          <Ionicons name={durumIkonu(item.durum)} size={16} color="#fff" />
          <Text style={styles.durumYazi}>{item.durum.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.adresler}>
        <View style={styles.adresSatiri}>
          <Ionicons name="location" size={16} color="#FF6B00" />
          <Text style={styles.adres} numberOfLines={1}>{item.gonderen_adres}</Text>
        </View>
        <Ionicons name="arrow-down" size={16} color="#999" style={styles.okIkon} />
        <View style={styles.adresSatiri}>
          <Ionicons name="flag" size={16} color="#4CAF50" />
          <Text style={styles.adres} numberOfLines={1}>{item.alic_adres}</Text>
        </View>
      </View>

      <View style={styles.kartAlt}>
        <Text style={styles.ucret}>{item.ucret} TL</Text>
        <Text style={styles.tarih}>{new Date(item.olusturma_tarihi).toLocaleDateString('tr-TR')}</Text>
      </View>

      {item.durum === 'bekliyor' && (
        <View style={styles.butonlar}>
          <TouchableOpacity style={styles.kabulButon} onPress={() => kabulEt(item.id)}>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.butonYazi}>Kabul Et</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.redButon} onPress={() => redEt(item.id)}>
            <Ionicons name="close" size={20} color="#fff" />
            <Text style={styles.butonYazi}>Reddet</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const kabulEt = async (id) => {
    try { await api.siparisKabul(id); siparisleriYukle(); } catch (hata) { console.error(hata); }
  };

  const redEt = async (id) => {
    try { await api.siparisRed(id); siparisleriYukle(); } catch (hata) { console.error(hata); }
  };

  return (
    <View style={styles.konteyner}>
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, aktifTab === 'aktif' && styles.tabAktif]} onPress={() => setAktifTab('aktif')}>
          <Text style={[styles.tabYazi, aktifTab === 'aktif' && styles.tabYaziAktif]}>Aktif ({siparisler.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, aktifTab === 'gecmis' && styles.tabAktif]} onPress={() => setAktifTab('gecmis')}>
          <Text style={[styles.tabYazi, aktifTab === 'gecmis' && styles.tabYaziAktif]}>Gecmis</Text>
        </TouchableOpacity>
      </View>

      <FlatList data={siparisler} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} contentContainerStyle={styles.liste} refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={siparisleriYukle} tintColor="#FF6B00" />} ListEmptyComponent={<Text style={styles.bos}>{aktifTab === 'aktif' ? 'Aktif siparis yok' : 'Gecmis siparis bulunamadi'}</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  konteyner: { flex: 1, backgroundColor: '#f5f5f5' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  tabAktif: { borderBottomWidth: 3, borderBottomColor: '#FF6B00' },
  tabYazi: { fontSize: 16, color: '#999', fontWeight: '600' },
  tabYaziAktif: { color: '#FF6B00' },
  liste: { padding: 15 },
  kart: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  kartBaslik: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  siparisNo: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  durumKutu: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 5 },
  durumYazi: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  adresler: { marginBottom: 12 },
  adresSatiri: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  okIkon: { marginLeft: 8, marginVertical: 4 },
  adres: { fontSize: 14, color: '#666', flex: 1 },
  kartAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  ucret: { fontSize: 18, fontWeight: 'bold', color: '#FF6B00' },
  tarih: { fontSize: 13, color: '#999' },
  butonlar: { flexDirection: 'row', gap: 10, marginTop: 12 },
  kabulButon: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 10, borderRadius: 8, gap: 5 },
  redButon: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F44336', paddingVertical: 10, borderRadius: 8, gap: 5 },
  butonYazi: { color: '#fff', fontWeight: 'bold' },
  bos: { textAlign: 'center', color: '#999', marginTop: 50, fontSize: 16 }
});
