import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Button } from 'react-native-elements';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons'; // Asegúrate de tener este paquete instalado
import firebase from '../database/firebase';
import { useFormik } from 'formik';
import AsyncStorage from '@react-native-async-storage/async-storage';
//import AwesomeAlert from 'react-native-awesome-alerts';

const CustomPasswordInput = ({ onChangeText, value }) => {
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.passwordContainer}>
      <TextInput
        style={styles.passwordInput}
        secureTextEntry={!isPasswordVisible}
        onChangeText={onChangeText}
        value={value}
        placeholder="Contraseña"
        placeholderTextColor="gray"
      />
      <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
        <Ionicons
          name={isPasswordVisible ? 'eye-off' : 'eye'}
          size={20}
          color="gray"
        />
      </TouchableOpacity>
    </View>
  );
};

export default ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [alerta, setAlerta] = useState({
    show: false,
    titulo: '',
    mensaje: '',
    color: '#FF5252'
  });

  const validate = values => {
    const errors = {};
    if (!values.usuario) {
      errors.usuario = "Por favor, ingresa tu usuario.";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.usuario)) {
      errors.usuario = 'Correo inválido.';
    }
    if (!values.clave) {
      errors.clave = "Por favor, ingresa tu contraseña.";
    }
    return errors;
  };

  const formLogin = useFormik({
    initialValues: {
      usuario: '',
      clave: '',
    },
    validate,
    onSubmit: datos => Login(datos)
  });

  const guardarUsuario = async (usuario, nombreUsuario) => {
    try {
      await AsyncStorage.setItem('usuario', usuario);
      await AsyncStorage.setItem('nombre', nombreUsuario || '');
      await AsyncStorage.setItem('userUID', usuario);
      await AsyncStorage.setItem('sessionActive', 'true');
      navigation.navigate('Root');
    } catch (error) {
      setAlerta({
        show: true,
        titulo: 'Error',
        mensaje: error.message,
        color: '#FF5252'
      });
    }
  };

  async function Login(datos) {
    setLoading(true);
    const { usuario, clave } = datos;

    await firebase.autenticacion
      .signInWithEmailAndPassword(usuario, clave)
      .then(async (userCredential) => {
        const user = userCredential.user;
        await guardarUsuario(user.uid, user.displayName);
        setLoading(false);
      })
      .catch(async () => {
        setAlerta({
          show: true,
          titulo: 'Error',
          mensaje: "Usuario o contraseña incorrectos.",
          color: '#FF5252'
        });
        await AsyncStorage.multiRemove(['sessionActive', 'userUID']);
        setLoading(false);
      });
  }



  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#4cb050" />
      ) : (
        <>
          <View style={styles.header}>
            <Image source={require('../assets/logolargo2.png')} style={styles.logo} />
          </View>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Correo Electrónico"
              placeholderTextColor="#757575"
              onChangeText={formLogin.handleChange('usuario')}
            />
            {formLogin.errors.usuario && <Text style={styles.errorText}>{formLogin.errors.usuario}</Text>}

            <CustomPasswordInput
              onChangeText={formLogin.handleChange('clave')}
              value={formLogin.values.clave}
            />
            {formLogin.errors.clave && <Text style={styles.errorText}>{formLogin.errors.clave}</Text>}

            <Button
              title="Ingresar"
              onPress={formLogin.handleSubmit}
              buttonStyle={styles.primaryButton}
              titleStyle={styles.primaryButtonTitle}
            />
            <TouchableOpacity onPress={() => navigation.navigate('Recuperar')} style={styles.link}>
              <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            <Button
              title="Registrarse"
              onPress={() => navigation.navigate('Register')}
              buttonStyle={styles.secondaryButton}
              titleStyle={styles.secondaryButtonTitle}
            />
          </View>
          <View style={styles.footer}>
            <Text style={styles.textVersion}>Version 4.0.0</Text>
            <Text style={styles.textVersion}>Farmerin Division S.A. - &copy; 2020</Text>
            <Text style={styles.textVersion}>Developed by Facundo Peralta & Farmerin Team</Text>
          </View>


          <Modal
            transparent={true}
            visible={alerta.show}
            animationType="fade"
            onRequestClose={() => setAlerta({ show: false })}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>{alerta.titulo}</Text>
                <Text style={styles.modalMessage}>{alerta.mensaje}</Text>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: alerta.color }]}
                  onPress={() => setAlerta({ show: false })}
                >
                  <Text style={styles.modalButtonText}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: wp('50%'),
    height: wp('25%'),
    resizeMode: 'contain',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#212121',
    marginBottom: 15,
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    marginBottom: 15,
    height: 50,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#212121',
  },
  eyeIcon: {
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#FF5252',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#4cb050',
    borderRadius: 8,
    height: 50,
    marginBottom: 15,
  },
  primaryButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    height: 50,
    borderColor: '#1b8aa5',
    borderWidth: 2,
  },
  secondaryButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1b8aa5',
  },
  link: {
    alignItems: 'center',
    marginVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#1976D2',
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#757575',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
    textAlign: 'center',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

});
