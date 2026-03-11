import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from 'react-native-elements';
import { useFormik } from 'formik';
import InfoAnimal from '../InfoAnimal';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
//import 'expo-firestore-offline-persistence';


import firebase from '../../database/firebase';
import Icon from 'react-native-vector-icons/FontAwesome';
import Modal from 'react-native-modal';
import { MovieContext } from "../Contexto";
import { useRoute } from '@react-navigation/core';

export default ({ navigation }) => {
  const { movies, setMovies } = useContext(MovieContext)

  const route = useRoute();
  const { animal } = route.params;
  const { animales } = route.params;
  const { usuario } = route.params;

  const hoy = new Date();
  const [alerta, setAlerta] = useState({
    show: false,
    titulo: '',
    mensaje: '',
    color: '#DD6B55',
    vuelve: false
  });

  const validate = values => {
    const errors = {}
    if (values.erp) {
      let erp = values.erp.trim();
      erp = erp.replace('.', ',');
      if (erp.length) {
        if (isNaN(erp)) {
          errors.erp = "El eRP DEBE SER NUMERICO";
        } else {
          if (erp.length != 15) {
            errors.erp = "El eRP DEBE SER DE 15 DIGITOS";
          } else {
            //chequeo que no exista

            const filtro = animales.filter(animal => {
              return (
                animal.erp == erp
              )
            });
            if (filtro.length > 0) errors.erp = "EL eRP YA SE ENCUENTRA ASIGNADO";
          }
        }
      }
    } else {
      errors.erp = "DEBE INGRESAR UN eRP";
    }
    return errors
  }

  //La funcion validate debe estar declarada antes del form sino no funciona
  const formErp = useFormik({
    initialValues: {

      erp: '',
      obs: ''
    },
    validate,
    onSubmit: datos => guardar(datos)
  });


  function guardar(datos) {
    let detalle = 'eRP anterior: ' + animal.erp;
    if (datos.obs && datos.obs.trim().length) {
      detalle += ' / Obs: ' + datos.obs.trim();
    }
    try {
      let objIndex = movies.findIndex((obj => obj.id == animal.id));
      const copia = [...movies]
      copia[objIndex].erp = datos.erp
      setMovies(copia)
      firebase.db.collection('animal').doc(animal.id).update({ erp: datos.erp });
      setAlerta({
        show: true,
        titulo: '¡ATENCION!',
        mensaje: ' BOTON (eRP) CAMBIADO CON ÉXITO ',
        color: '#3AD577',
        vuelve: true
      });

      firebase.db.collection('animal').doc(animal.id).collection('eventos').add({
        fecha: hoy,
        tipo: 'Cambio eRP',
        detalle: detalle,
        usuario: usuario
      })

    } catch (error) {
      setAlerta({
        show: true,
        titulo: '¡ ERROR !',
        mensaje: 'NO SE PUDO CAMBIAR EL eRP',
        color: '#DD6B55',
        vuelve: false
      });

    }

  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={100} // Prueba con diferentes valores

    >
      <InfoAnimal
        animal={animal}
        datos='erp'
      />
      <View style={styles.form}>
        <View>
          <Text style={styles.texto}>Nuevo Botón (eRP) :</Text>
          <TextInput
            style={styles.entrada}
            onChangeText={formErp.handleChange('erp')}
            value={formErp.values.erp.toString()} // Convierte a Cadena ( String )
            keyboardType="numeric"
          />
          {formErp.errors.erp ? <Text style={styles.error}>{formErp.errors.erp}</Text> : null}
          <Text style={styles.texto}>Observacion (opcional):</Text>
          <TextInput
            style={styles.entrada}
            onChangeText={formErp.handleChange('obs')}
            value={formErp.values.observacion}
            placeholder='Escribe una observacion sobre el cambio'
          />
        </View>
        <Button
          buttonStyle={{ Color: '#e1e8ee', margin: 40, backgroundColor: '#4db150' }}
          title="  ACEPTAR"
          icon={Platform.OS === 'ios' ? (
            <Icon
              name="check-square"
              size={35}
              color="white"
            />
          ) : null}
          onPress={formErp.handleSubmit}
        />
      </View>

      {alerta.show && (
        <Modal
          isVisible={alerta.show}
          onBackdropPress={() => setAlerta({ ...alerta, show: false })}
          onBackButtonPress={() => setAlerta({ ...alerta, show: false })}
        >
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: alerta.color }}>{alerta.titulo}</Text>
            <Text style={{ marginVertical: 10 }}>{alerta.mensaje}</Text>
            <Button
              title="ACEPTAR"
              onPress={() => {
                setAlerta({ ...alerta, show: false });
                if (alerta.vuelve) {
                  navigation.popToTop();
                }
              }}
              buttonStyle={{ backgroundColor: alerta.color, marginTop: 10 }}
            />
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e1e8ee',
  },
  form: {
    flex: 1,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginHorizontal: 10,
  },
  fecha: {
    width: wp('100%'),
    padding: 5,
    height: 50
  },
  lista: {
    marginLeft: 5,
    marginRight: 5,
    borderRadius: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'grey',
    height: 50

  },
  texto: {
    marginLeft: 5,
    marginTop: 10,

  },
  header: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#399dad'
  },
  error: {
    marginLeft: 5,
    marginRight: 5,
    fontSize: 13,
    borderRadius: 5,
    color: 'red',
    backgroundColor: 'pink',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'red'

  },

  entrada: {
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingLeft: 10,
    height: 50,

  },
  boton: {
    backgroundColor: '#4db150',
    borderRadius: 8,
    marginTop: 15,
  }

});