import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import GirisEkrani from './screens/GirisEkrani';
import KayitEkrani from './screens/KayitEkrani';
import KuryeAnaEkran from './screens/kurye/KuryeAnaEkran';
import KuryeSiparisler from './screens/kurye/KuryeSiparisler';
import KuryeKazanc from './screens/kurye/KuryeKazanc';
import KuryeProfil from './screens/kurye/KuryeProfil';
import IsletmeAnaEkran from './screens/isletme/IsletmeAnaEkran';
import IsletmeSiparisOlustur from './screens/isletme/IsletmeSiparisOlustur';
import IsletmeSiparisler from './screens/isletme/IsletmeSiparisler';
import IsletmeProfil from './screens/isletme/IsletmeProfil';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function KuryeTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'AnaSayfa') iconName = focused ? 'map' : 'map-outline';
        else if (route.name === 'Siparislerim') iconName = focused ? 'list' : 'list-outline';
        else if (route.name === 'Kazanc') iconName = focused ? 'wallet' : 'wallet-outline';
        else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#FF6B00',
      tabBarInactiveTintColor: 'gray',
      headerStyle: { backgroundColor: '#FF6B00' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' }
    })}>
      <Tab.Screen name="AnaSayfa" component={KuryeAnaEkran} options={{ title: 'Boran Mersin' }} />
      <Tab.Screen name="Siparislerim" component={KuryeSiparisler} />
      <Tab.Screen name="Kazanc" component={KuryeKazanc} options={{ title: 'Kazancim' }} />
      <Tab.Screen name="Profil" component={KuryeProfil} />
    </Tab.Navigator>
  );
}

function IsletmeTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'AnaSayfa') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'YeniSiparis') iconName = focused ? 'add-circle' : 'add-circle-outline';
        else if (route.name === 'Siparislerim') iconName = focused ? 'list' : 'list-outline';
        else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#FF6B00',
      tabBarInactiveTintColor: 'gray',
      headerStyle: { backgroundColor: '#FF6B00' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' }
    })}>
      <Tab.Screen name="AnaSayfa" component={IsletmeAnaEkran} options={{ title: 'Boran Mersin' }} />
      <Tab.Screen name="YeniSiparis" component={IsletmeSiparisOlustur} options={{ title: 'Siparis Olustur' }} />
      <Tab.Screen name="Siparislerim" component={IsletmeSiparisler} />
      <Tab.Screen name="Profil" component={IsletmeProfil} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => { loginKontrol(); }, []);

  const loginKontrol = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const kullaniciData = await AsyncStorage.getItem('kullanici');
      if (token && kullaniciData) setKullanici(JSON.parse(kullaniciData));
    } catch (hata) {
      console.error('Login kontrol hatasi:', hata);
    } finally {
      setYukleniyor(false);
    }
  };

  const girisYap = async (token, kullaniciData) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('kullanici', JSON.stringify(kullaniciData));
    setKullanici(kullaniciData);
  };

  const cikisYap = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('kullanici');
    setKullanici(null);
  };

  if (yukleniyor) return null;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!kullanici ? (
          <>
            <Stack.Screen name="Giris">
              {(props) => <GirisEkrani {...props} onLogin={girisYap} />}
            </Stack.Screen>
            <Stack.Screen name="Kayit">
              {(props) => <KayitEkrani {...props} onLogin={girisYap} />}
            </Stack.Screen>
          </>
        ) : kullanici.rol === 'kurye' ? (
          <Stack.Screen name="KuryeAna" component={KuryeTabs} />
        ) : (
          <Stack.Screen name="IsletmeAna" component={IsletmeTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
