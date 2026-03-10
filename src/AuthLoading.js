import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from '../database/firebase';

export default function AuthLoading({ navigation }) {
  useEffect(() => {
    const checkLogin = async () => {
      const user = await AsyncStorage.getItem('usuario');
      const clave = await AsyncStorage.getItem('clave');

      if (user && clave) {
        try {
          await firebase.autenticacion.signInWithEmailAndPassword(user, clave);
          console.log("🔥 Autenticación en Firebase restaurada con éxito en AuthLoading");
        } catch (error) {
          console.log("⚠️ Error restaurando autenticación en Firebase:", error);
        }
      }

      navigation.reset({
        index: 0,
        routes: [{ name: user ? 'Root' : 'OnBoarding' }],
      });
    };

    checkLogin();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color='#1b829b' />
    </View>
  );
}
