import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api',
  ios: 'http://localhost:3000/api',
  default: 'http://localhost:3000/api'
});

const api = {
  async istek(yol, options = {}) {
    const token = await AsyncStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${yol}`, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.hata || 'Bir hata olustu');
    }
    return data;
  },

  // Auth
  async giris(telefon, sifre, rol) {
    return this.istek('/auth/giris', {
      method: 'POST',
      body: JSON.stringify({ telefon, sifre, rol })
    });
  },

  async kayit(veriler) {
    return this.istek('/auth/kayit', {
      method: 'POST',
      body: JSON.stringify(veriler)
    });
  },

  async profilGetir() {
    return this.istek('/auth/profil');
  },

  async profilGuncelle(veriler) {
    return this.istek('/auth/profil', {
      method: 'PUT',
      body: JSON.stringify(veriler)
    });
  },

  async sifreDegistir(eski_sifre, yeni_sifre) {
    return this.istek('/auth/sifre', {
      method: 'PUT',
      body: JSON.stringify({ eski_sifre, yeni_sifre })
    });
  },

  // Kurye
  async musaitlikDegistir() {
    return this.istek('/kurye/musaitlik', { method: 'PUT' });
  },

  async konumGuncelle(enlem, boylam, hiz) {
    return this.istek('/kurye/konum', {
      method: 'PUT',
      body: JSON.stringify({ enlem, boylam, hiz })
    });
  },

  async kuryeSiparislerim() {
    return this.istek('/kurye/siparislerim');
  },

  async kuryeAktifSiparisler() {
    return this.istek('/kurye/aktif-siparislerim');
  },

  async siparisKabul(siparisId) {
    return this.istek(`/kurye/siparis-kabul/${siparisId}`, { method: 'POST' });
  },

  async siparisRed(siparisId) {
    return this.istek(`/kurye/siparis-red/${siparisId}`, { method: 'POST' });
  },

  async durumGuncelle(siparisId, durum, fotolar, notlar) {
    return this.istek(`/kurye/durum-guncelle/${siparisId}`, {
      method: 'PUT',
      body: JSON.stringify({ durum, fotolar, notlar })
    });
  },

  async kuryeKazanc() {
    return this.istek('/kurye/kazanc');
  },

  // Isletme
  async isletmeProfil() {
    return this.istek('/isletme/profil');
  },

  async isletmeProfilGuncelle(veriler) {
    return this.istek('/isletme/profil', {
      method: 'PUT',
      body: JSON.stringify(veriler)
    });
  },

  async siparisOlustur(veriler) {
    return this.istek('/isletme/siparis', {
      method: 'POST',
      body: JSON.stringify(veriler)
    });
  },

  async isletmeSiparislerim(sayfa = 1) {
    return this.istek(`/isletme/siparislerim?sayfa=${sayfa}`);
  },

  async isletmeAktif() {
    return this.istek('/isletme/aktif');
  },

  async siparisIptal(siparisId, neden) {
    return this.istek(`/isletme/siparis/${siparisId}/iptal`, {
      method: 'PUT',
      body: JSON.stringify({ neden })
    });
  },

  // Harita
  async aktifKuryeler() {
    return this.istek('/harita/kuryeler');
  },

  async mesafeHesapla(enlem1, boylam1, enlem2, boylam2) {
    return this.istek(`/harita/mesafe?enlem1=${enlem1}&boylam1=${boylam1}&enlem2=${enlem2}&boylam2=${boylam2}`);
  },

  // Siparis
  async siparisDetay(siparisId) {
    return this.istek(`/siparis/${siparisId}`);
  },

  async siparisTakip(siparisNo) {
    return this.istek(`/siparis/takip/${siparisNo}`);
  }
};

export default api;
