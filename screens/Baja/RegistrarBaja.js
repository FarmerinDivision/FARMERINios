import React, { useState, useEffect, useContext } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from 'react-native-modal';
// import DropDownPicker from 'react-native-dropdown-picker';
import { MovieContext } from "../Contexto"
import { useRoute } from '@react-navigation/core';

export default ({ navigation }) => {
  const [fecha, setFecha] = useState(new Date());
  const { movies, setMovies, motivosx } = useContext(MovieContext)
  const route = useRoute();
  const { animal } = route.params;
  const { usuario } = route.params;
  const { tambo } = route.params;
  const [tambos, setTambos] = useState([{ value: '0', label: 'OTRO' }]);
  const [motivos, setMotivos] = useState([{ value: '', label: '' }]);
  const [show, setShow] = useState(false);
  const [openMotivo, setOpenMotivo] = useState(false);
  const [openTambo, setOpenTambo] = useState(false);

  const [selectedMotivo, setSelectedMotivo] = useState('Muerte');
  const [selectedTambo, setSelectedTambo] = useState('0');


  const [alerta, setAlerta] = useState({
    show: false,
    titulo: '',
    mensaje: '',
    color: '#DD6B55',
    vuelve: false
  });

  useEffect(() => {

    //busca los tambos y motivos de baja
    obtenerTambos();
    obtenerMotivos();

  }, []);


  const validate = values => {
    const errors = {}
    if (!values.motivo) {
      errors.motivo = "INGRESE UN MOTIVO DE BAJA"
    }
    if ((values.motivo == 'Transferencia') && (values.tambo == '0') && (values.nombreTambo == '')) {
      errors.nombreTambo = "INGRESE EL NOMBRE DEL TAMBO"
    }
    return errors
  }

  //La funcion validate debe estar declarada antes del form sino no funciona
  const formBaja = useFormik({
    initialValues: {
      fecha: new Date(),
      motivo: 'Muerte',
      tambo: '0',
      nombreTambo: '',

    },
    validate,
    onSubmit: datos => guardar(datos)
  });

  async function obtenerTambos() {

    try {
      AsyncStorage.getItem('usuario').then((keyValue) => {
        try {
          firebase.db.collection('tambo').where('usuarios', 'array-contains', keyValue).orderBy('nombre', 'desc').onSnapshot(snapshotTambo);
        } catch (error) {
          setAlerta({
            show: true,
            titulo: 'Error!',
            mensaje: 'Al recuperar los tambos asociados al usuario',
            color: '#DD6B55'
          });

        }
      });
    } catch (error) {
      setAlerta({
        show: true,
        titulo: 'Error!',
        mensaje: 'Al recuperar los tambos asociados al usuario',
        color: '#DD6B55'
      });

    }
  }

  function snapshotTambo(snapshot) {
    snapshot.docs.map(doc => {
      let t = {
        value: doc.id,
        label: doc.data().nombre
      }

      setTambos(tambos => [...tambos, t]);

    })

  }



  function obtenerMotivos() {
    const motiv = motivosx.filter(e => {
      return (
        e.tipo == "baja"
      )
    }
    )

    motiv.map(doc => {
      let tr = {
        value: doc.descripcion,
        label: doc.descripcion
      }

      setMotivos(motivos => [...motivos, tr]);


    })

  };


  function guardar(datos) {

    let detalle = 'Motivo: ' + datos.motivo;
    let an;
    let tipo = 'Baja';

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

    //Si no es transferida
    if (datos.motivo != 'Transferencia') {
      an = {
        fbaja: fstring,
        mbaja: datos.motivo
      }

    } else {
      //si es transferida a un tambo ajeno
      if (datos.tambo == '0') {
        an = {
          fbaja: fstring,
          mbaja: datos.motivo
        }
        detalle = detalle + ' / Tambo: ' + datos.nombreTambo
        //Si es tranferida a un tambo propio
      } else {
        tipo = 'Alta';
        an = { idtambo: datos.tambo };
      }

    }
    try {
      let objIndex = movies.findIndex((obj => obj.id == animal.id));
      const copia = [...movies]
      const obj = copia[objIndex]
      const nuevo = Object.assign({}, obj, an)
      copia[objIndex] = nuevo
      setMovies(copia)
      firebase.db.collection('animal').doc(animal.id).update(an);
      firebase.db.collection('animal').doc(animal.id).collection('eventos').add({
        fecha: fecha,
        tipo: tipo,
        detalle: detalle,
        usuario: usuario,
        idtambo: tambo.id,
      });
      setAlerta({
        show: true,
        titulo: 'Atención!',
        mensaje: 'Baja registrada con éxito',
        color: '#3AD577',
        vuelve: true
      });

    } catch (error) {
      setAlerta({
        show: true,
        titulo: 'Error!',
        mensaje: 'Al registrar la baja' + error,
        color: '#DD6B55'
      });


    }

  }
  function cambiarFecha(event, date) {
    const currentDate = date;
    setShow(false);
    setFecha(currentDate);
    formBaja.handleChange('fecha')
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
              {motivos.find(i => i.value === selectedMotivo)?.label || 'SELECCIONAR MOTIVO'}
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
                {motivos.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={styles.optionItem}
                    onPress={() => {
                      setSelectedMotivo(item.value);
                      formBaja.setFieldValue('motivo', item.value);
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



        </View>

        {
          formBaja.errors.motivo ? <Text style={styles.error}>{formBaja.errors.motivo}</Text> : null}

        {(formBaja.values.motivo == 'Transferencia') &&
          <View>
            <Text style={styles.texto}>TAMBO:</Text>

            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setOpenTambo(true)}
            >
              <Text style={styles.selectorText}>
                {tambos.find(i => i.value === selectedTambo)?.label || 'SELECCIONAR TAMBO'}
              </Text>
              <Icon name="chevron-down" size={15} color="#555" />
            </TouchableOpacity>

            <Modal
              isVisible={openTambo}
              onBackdropPress={() => setOpenTambo(false)}
              style={styles.modalStyle}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>SELECCIONAR TAMBO</Text>
                <ScrollView style={styles.listContainer}>
                  {tambos.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={styles.optionItem}
                      onPress={() => {
                        setSelectedTambo(item.value);
                        formBaja.setFieldValue('tambo', item.value);
                        setOpenTambo(false);
                      }}
                    >
                      <Text style={styles.optionText}>{item.label}</Text>
                      {selectedTambo === item.value && (
                        <Icon name="check" size={20} color="#1b829b" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Button
                  title="CERRAR"
                  onPress={() => setOpenTambo(false)}
                  buttonStyle={styles.closeButton}
                  containerStyle={{ width: '100%', marginTop: 10 }}
                />
              </View>
            </Modal>


          </View>



        }
        {((formBaja.values.motivo == 'Transferencia') && (formBaja.values.tambo == '0')) &&
          <View>
            <Text style={styles.texto}>NOMBRE:</Text>
            <TextInput
              style={styles.entrada}
              onChangeText={formBaja.handleChange('nombreTambo')}
              value={formBaja.values.nombreTambo}
            />

          </View>
        }
        {formBaja.errors.nombreTambo ? <Text style={styles.error}>{formBaja.errors.nombreTambo}</Text> : null}
      </View>
      <Button
        style={styles.boton}
        title="  ACEPTAR"
        icon={
          <Icon
            name="check-square"
            size={35}
            color="white"
          />
        }
        onPress={formBaja.handleSubmit}
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
                setAlerta(prev => ({ ...prev, show: false }));
                if (alerta.vuelve) {
                  navigation.goBack();
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
    flexDirection: 'column',


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
    marginHorizontal: 5,

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