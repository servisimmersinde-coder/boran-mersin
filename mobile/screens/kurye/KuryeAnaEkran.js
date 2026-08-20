import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { io } from 'socket.io-client';

const { width } = Dimensions.get('window');
const SOCKET_URL = 'https://boran-mersin-api.onrender.com';

export default function KuryeAnaEkran() {
  const [konum, setKonum] = useState(null);
  const [musait, setMusait] = useState(false);
  const [aktifSiparis, setAktifSiparis] = useState(null);
  const [yeniSiparis, setYeniSiparis] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    konumIzin();
    socketBaglan();
    aktifSiparisKontrol();

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  useEffect(() => {
    if (konum) {
      const interval = setInterval(() => {
        konumGonder();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [konum]);

  const konumIzin = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Hata', 'Konum izni gerekli');
      return;
    }
    const konum = await Location.getCurrentPositionAsync({});
    setKonum(konum.coords);
  };

  const konumGonder = async () => {
    try {
      const mevcut = await Location.getCurrentPositionAsync({});
      setKonum(mevcut.coords);
      await api.konumGuncelle(mevcut.coords.latitude, mevcut.coords.longitude, 0);
    } catch (hata) { }
  };

  const socketBaglan = async () => {
    const kullaniciData = await AsyncStorage.getItem('kullanici');
    const kullanici = JSON.parse(kullaniciData);

    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('kuryeKatil', kullanici.id);

    socketRef.current.on('yeniSiparis', (data) => {
      setYeniSiparis(data);
      Alert.alert('Yeni Siparis!', `${data.isletmeAdi} - ${data.alic_ad}\nUcret: ${data.ucret} TL`, [
        { text: 'Reddet', style: 'cancel', onPress: () => setYeniSiparis(null) },
        { text: 'Kabul Et', onPress: () => siparisKabulEt(data.siparisId) }
      ]);
    });
  };

  const musaitlikDegistir = async () => {
    try {
      const sonuc = await api.musaitlikDegistir();
      setMusait(sonuc.musait);
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    }
  };

  const aktifSiparisKontrol = async () => {
    try {
      const siparisler = await api.kuryeAktifSiparisler();
      if (siparisler.length > 0) setAktifSiparis(siparisler[0]);
    } catch (hata) { }
  };

  const siparisKabulEt = async (siparisId) => {
    try {
      await api.siparisKabul(siparisId);
      setYeniSiparis(null);
      aktifSiparisKontrol();
      Alert.alert('Basarili', 'Siparis kabul edildi!');
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    }
  };

  return (
    <View style={styles.konteyner}>
      <MapView style={styles.harita} showsUserLocation={true}>
        {konum && (
          <Marker coordinate={{ latitude: konum.latitude, longitude: konum.longitude }} title="Konumum">
            <View style={styles.markerKonteyner}>
              <Ionicons name="bicycle" size={24} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      <View style={styles.kontrolPaneli}>
        <TouchableOpacity style={[styles.musaitlikButon, musait && styles.musaitAktif]} onPress={musaitlikDegistir}>
          <Ionicons name={musait ? 'checkmark-circle' : 'close-circle'} size={24} color="#fff" />
          <Text style={styles.musaitlikYazi}>{musait ? 'MUSAIT' : 'MESEGUL'}</Text>
        </TouchableOpacity>

        {aktifSiparis && (
          <View style={styles.siparisKarti}>
            <Text style={styles.siparisBaslik}>Aktif Siparis</Text>
            <Text style={styles.siparisDetay}>Alis: {aktifSiparis.gonderen_adres}</Text>
            <Text style={styles.siparisDetay}>Teslim: {aktifSiparis.alic_adres}</Text>
            <TouchableOpacity style={styles.detayButon} onPress={() => Alert.alert('Siparis Detayi')}>
              <Text style={styles.detayYazi}>Detay Gor</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  konteyner: { flex: 1 },
  harita: { flex: 1 },
  markerKonteyner: { backgroundColor: '#FF6B00', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  kontrolPaneli: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  musaitlikButon: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ccc', paddingVertical: 16, borderRadius: 12, gap: 10, marginBottom: 15 },
  musaitAktif: { backgroundColor: '#4CAF50' },
  musaitlikYazi: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  siparisKarti: { backgroundColor: '#fff', borderRadius: 12, padding: 15, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  siparisBaslik: { fontSize: 16, fontWeight: 'bold', color: '#FF6B00', marginBottom: 8 },
  siparisDetay: { fontSize: 14, color: '#666', marginBottom: 4 },
  detayButon: { backgroundColor: '#FF6B00', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  detayYazi: { color: '#fff', fontWeight: 'bold' }
});
