import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthLoading({ navigation }) {
  useEffect(() => {
    const checkLogin = async () => {
      const user = await AsyncStorage.getItem('usuario');

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
