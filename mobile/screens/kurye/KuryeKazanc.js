import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function KuryeKazanc() {
  const [veriler, setVeriler] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => { kazancYukle(); }, []);

  const kazancYukle = async () => {
    setYukleniyor(true);
    try {
      const data = await api.kuryeKazanc();
      setVeriler(data);
    } catch (hata) { console.error(hata); }
    setYukleniyor(false);
  };

  if (!veriler) return <View style={styles.konteyner}><Text style={styles.yukleniyor}>Yukleniyor...</Text></View>;

  return (
    <ScrollView style={styles.konteyner} refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={kazancYukle} tintColor="#FF6B00" />}>
      <View style={styles.istatistikler}>
        <View style={styles.istatistikKart}>
          <Ionicons name="wallet" size={32} color="#FF6B00" />
          <Text style={styles.istatistikDeger}>{veriler.toplam_kazanc} TL</Text>
          <Text style={styles.istatistikEtiket}>Toplam Kazanc</Text>
        </View>
        <View style={styles.istatistikKart}>
          <Ionicons name="today" size={32} color="#4CAF50" />
          <Text style={styles.istatistikDeger}>{veriler.gunluk_kazanc} TL</Text>
          <Text style={styles.istatistikEtiket}>Bugunku Kazanc</Text>
        </View>
      </View>

      <View style={styles.istatistikler}>
        <View style={styles.istatistikKart}>
          <Ionicons name="checkmark-done-circle" size={32} color="#2196F3" />
          <Text style={styles.istatistikDeger}>{veriler.toplam_teslim}</Text>
          <Text style={styles.istatistikEtiket}>Toplam Teslimat</Text>
        </View>
        <View style={styles.istatistikKart}>
          <Ionicons name="star" size={32} color="#FFC107" />
          <Text style={styles.istatistikDeger}>{veriler.puan}</Text>
          <Text style={styles.istatistikEtiket}>Kurye Puani</Text>
        </View>
      </View>

      <View style={styles.bolumBaslik}>
        <Text style={styles.bolumBaslikYazi}>Son Islemler</Text>
      </View>

      {veriler.son_islemler.length === 0 ? (
        <Text style={styles.bos}>Henuz islem yok</Text>
      ) : (
        veriler.son_islemler.map((islem, index) => (
          <View key={index} style={styles.islemKarti}>
            <View style={styles.islemSol}>
              <Ionicons name={islem.tip === 'kazanc' ? 'add-circle' : 'remove-circle'} size={24} color={islem.tip === 'kazanc' ? '#4CAF50' : '#F44336'} />
              <View>
                <Text style={styles.islemAciklama}>{islem.aciklama}</Text>
                <Text style={styles.islemTarih}>{new Date(islem.olusturma_tarihi).toLocaleDateString('tr-TR')}</Text>
              </View>
            </View>
            <Text style={[styles.islemTutar, { color: islem.tip === 'kazanc' ? '#4CAF50' : '#F44336' }]}>
              {islem.tip === 'kazanc' ? '+' : '-'}{islem.tutar} TL
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  konteyner: { flex: 1, backgroundColor: '#f5f5f5' },
  yukleniyor: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#999' },
  istatistikler: { flexDirection: 'row', padding: 15, gap: 15 },
  istatistikKart: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', elevation: 2, gap: 8 },
  istatistikDeger: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  istatistikEtiket: { fontSize: 13, color: '#999' },
  bolumBaslik: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 5 },
  bolumBaslikYazi: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  islemKarti: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 10, padding: 15, borderRadius: 12 },
  islemSol: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  islemAciklama: { fontSize: 14, color: '#333', fontWeight: '500' },
  islemTarih: { fontSize: 12, color: '#999', marginTop: 2 },
  islemTutar: { fontSize: 16, fontWeight: 'bold' },
  bos: { textAlign: 'center', color: '#999', marginTop: 30, fontSize: 14 }
});
