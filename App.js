import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import store from './src/store';
import Eventos from './src/NavEventos';
import Config from './src/NavConfiguracion';
import OnBoardingNavigator from './src/NavSesiones';
import { MovieProvider } from './screens/Contexto';
import firebase from './database/firebase';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AppNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'EVENTOS') iconName = 'cow';
        else if (route.name === 'CONFIGURACION') iconName = 'cog';
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#287fb9',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: {
        backgroundColor: '#F9F9F9',
        borderTopWidth: 0,
        elevation: 10,
      },
      headerStyle: { backgroundColor: '#287fb9' },
      headerTitleAlign: 'center',
      headerTitleStyle: { fontWeight: 'bold', fontSize: 18, color: '#F9FFFF' },
      headerTintColor: '#F9FFFF',
    })}
  >
    <Tab.Screen name="EVENTOS" component={Eventos} />
    <Tab.Screen name="CONFIGURACION" component={Config} />
  </Tab.Navigator>
);

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = no user, user = logged

  useEffect(() => {
    const restoreLogin = async () => {
      console.log("🔄 Restaurando sesión...");
      const session = await AsyncStorage.getItem("sessionActive");
      const uid = await AsyncStorage.getItem("userUID");

      if (session === "true" && uid) {
        console.log("✅ Sesión local encontrada:", uid);
        setUser({ uid });
      }

      firebase.autenticacion.onAuthStateChanged((u) => {
        if (u) {
          console.log("🔥 Firebase restauró sesión:", u.uid);
          setUser(u);
        } else {
          console.log("⚠ No hay sesión en Firebase");
          setUser(null);
        }
      });
    };

    restoreLogin();
  }, []);



  if (user === undefined) {
    // ⏳ Esperando que Firebase restaure sesión
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#287fb9" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <MovieProvider>
          <NavigationContainer>
            {user ? <AppNavigator /> : <OnBoardingNavigator />}
          </NavigationContainer>
        </MovieProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
