import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableHighlight, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-elements';
import { useFormik } from 'formik';
import InfoAnimal from '../InfoAnimal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
//import 'expo-firestore-offline-persistence';


import firebase from '../../database/firebase';
import Icon from 'react-native-vector-icons/FontAwesome';
import { format } from 'date-fns';
import Modal from 'react-native-modal';
// import DropDownPicker from 'react-native-dropdown-picker';

import { useRoute } from '@react-navigation/core';

export default ({ navigation }) => {
  const [show, setShow] = useState(false);
  const [fecha, setFecha] = useState(new Date());
  const [openMotivo, setOpenMotivo] = useState(false);
  const [selectedMotivo, setSelectedMotivo] = useState('Infertil');

  const route = useRoute();
  const { animal } = route.params;
  const { usuario } = route.params;

  const options = [
    { value: 'Infertil', label: 'INFERTIL' },
    { value: 'Baja Producción', label: 'BAJA PRODUCCION' },
    { value: 'Enf. Sanitarias', label: 'ENF. SANITARIAS' },
    { value: 'Fin de vida Útil', label: 'FIN VIDA UTIL' },
    { value: 'Mastitis', label: 'MASTITIS' },
    { value: 'Patas', label: 'PATAS' },
    { value: 'Ubre', label: 'UBRE' },
    { value: 'Otras causas', label: 'OTRAS CAUSAS' },
  ];

  const [alerta, setAlerta] = useState({
    show: false,
    titulo: '',
    mensaje: '',
    color: '#DD6B55',
    vuelve: false
  });

  const validate = values => {

    const errors = {}
    if (!values.obs.length && (values.motivo == 'Otras causas')) {
      errors.obs = "DEBE INGRESAR UNA OBSERVACION"
    }
    return errors
  }

  //La funcion validate debe estar declarada antes del form sino no funciona
  const formRechazo = useFormik({
    initialValues: {
      fecha: new Date(),
      motivo: 'Infertil',
      obs: ''
    },
    validate,
    onSubmit: datos => guardar(datos)
  });



  function guardar(datos) {

    //Formatea fecha 
    const tipof = typeof datos.fecha;
    let fstring;
    let fdate;
    if (tipof == 'string') {
      let parts = datos.fecha.split('/');
      fstring = (parts[2]) + '-' + (parts[1]) + '-' + parts[0];
      let fs = fstring + 'T04:00:00';
      fdate = new Date(fs);
    } else {
      fstring = format(datos.fecha, 'yyyy-MM-dd');
      fdate = datos.fecha;

    }

    let detalle = datos.motivo;
    if (datos.obs.length) detalle = detalle + ': ' + datos.obs;
    try {

      //firebase.db.collection('animal').doc(animal.id).update({ estpro: 'rechazo' });
      firebase.db.collection('animal').doc(animal.id).collection('eventos').add({
        fecha: fecha,
        tipo: 'Rechazo',
        detalle: detalle,
        usuario: usuario,
        idtambo: animal.idtambo,
      })
      setAlerta({
        show: true,
        titulo: '¡ATENCION!',
        mensaje: 'RECHAZO REGISTRADO CON ÉXITO',
        color: '#3AD577',
        vuelve: true
      });

    } catch (error) {
      setAlerta({
        show: true,
        titulo: '¡ ERROR !',
        mensaje: 'NO SE PUEDE REGISTRAR EL RECHAZO',
        color: '#DD6B55'
      });
    }

  }



  function cambiarFecha(event, date) {
    const currentDate = date;
    setShow(false);
    setFecha(currentDate);
    formRechazo.handleChange('fecha')
  };
  const handlever = () => {
    setShow(true);
  }
  let texto = format(fecha, 'yyyy-MM-dd');

  return (
    <View style={styles.container}>
      <InfoAnimal
        animal={animal}
      />
      <View style={styles.form}>
        <Text style={styles.texto}>FECHA:</Text>
        <TouchableHighlight style={styles.calendario} onPress={handlever}>
          <View

          ><Text style={styles.textocalendar}>{texto}</Text></View></TouchableHighlight>
        {show && (
          <DateTimePicker
            placeholder="Fecha"
            dateFormat="DD/MM/YYYY"
            maximumDate={new Date()}
            showIcon={true}
            androidMode="spinner"
            style={styles.fecha}
            value={fecha}
            onChange={cambiarFecha}
            customStyles={{
              dateInput: {
                borderColor: 'grey',
                borderWidth: 1,
                borderRadius: 10,
                backgroundColor: 'white'
              }
            }}
          />)}
        <View>
          <Text style={styles.texto}>MOTIVO:</Text>

          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setOpenMotivo(true)}
          >
            <Text style={styles.selectorText}>
              {options.find(i => i.value === selectedMotivo)?.label || 'SELECCIONAR MOTIVO'}
            </Text>
            <Icon name="chevron-down" size={15} color="#555" />
          </TouchableOpacity>

          <Modal
            isVisible={openMotivo}
            onBackdropPress={() => setOpenMotivo(false)}
            style={styles.modalStyle}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>SELECCIONAR MOTIVO</Text>
              <ScrollView style={styles.listContainer}>
                {options.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={styles.optionItem}
                    onPress={() => {
                      setSelectedMotivo(item.value);
                      formRechazo.setFieldValue('motivo', item.value);
                      setOpenMotivo(false);
                    }}
                  >
                    <Text style={styles.optionText}>{item.label}</Text>
                    {selectedMotivo === item.value && (
                      <Icon name="check" size={20} color="#1b829b" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Button
                title="CERRAR"
                onPress={() => setOpenMotivo(false)}
                buttonStyle={styles.closeButton}
                containerStyle={{ width: '100%', marginTop: 10 }}
              />
            </View>
          </Modal>


          <Text></Text>
          <Text style={styles.texto}>OBSERVACIONES:</Text>
          <TextInput
            style={styles.entrada}
            onChangeText={formRechazo.handleChange('obs')}
          />
          {formRechazo.errors.obs ? <Text style={styles.error}>{formRechazo.errors.obs}</Text> : null}
        </View>

      </View>
      <Button
        title="  ACEPTAR"
        icon={
          <Icon
            name="check-square"
            size={35}
            color="white"
          />
        }
        onPress={formRechazo.handleSubmit}
      />
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
    </View >
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,

  },
  header: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#399dad'
  },
  textocalendar: {
    textAlign: "center"
  },
  calendario: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    padding: 10,
    width: wp('90%'),
    alignSelf: 'center',
    marginVertical: 10,
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
    margin: 5
  },
  pickerStyle: {
    inputIOS: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      height: 50,
      borderColor: '#d0d0d0',
      borderWidth: 1,
      paddingHorizontal: 15,
      color: '#333',
      fontSize: 16,
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
    },
    inputAndroid: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      height: 50,
      borderColor: '#d0d0d0',
      borderWidth: 1,
      paddingHorizontal: 15,
      color: '#333',
      fontSize: 16,
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
    },
    placeholder: {
      color: '#9EA0A4',
    },
    iconContainer: {
      top: 10,
      right: 10,
    },

  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  selectorText: {
    fontSize: 16,
    color: '#000',
  },
  modalStyle: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#1b829b',
  },
  listContainer: {
    marginBottom: 10,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 18,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#999',
    borderRadius: 8,
    paddingVertical: 12,
  },
});