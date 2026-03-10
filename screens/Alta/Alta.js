import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, TextInput, ActivityIndicator, ScrollView, TouchableHighlight, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-elements';
import { useFormik } from 'formik';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
//import 'expo-firestore-offline-persistence';


import firebase from '../../database/firebase';
import Icon from 'react-native-vector-icons/FontAwesome';
import { format } from 'date-fns';
import Modal from 'react-native-modal';
// import DropDownPicker from 'react-native-dropdown-picker';
import { MovieContext } from "../Contexto";
import { useRoute } from '@react-navigation/core';

export default ({ navigation }) => {
  const { movies, setMovies } = useContext(MovieContext)
  const [fecha, setFecha] = useState(new Date());
  const [fecha2, setFecha2] = useState(new Date());
  const [fecha3, setFecha3] = useState(new Date());
  const [aviso, setAviso] = useState(false);
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);
  const [texto2, setTexto2] = useState("-- / -- / --")
  const [texto3, setTexto3] = useState("-- / -- / --")
  const [openEstrep, setOpenEstrep] = useState(false);
  const [selectedEstrep, setSelectedEstrep] = useState('vacia');

  const [openEstpro, setOpenEstpro] = useState(false);
  const [selectedEstpro, setSelectedEstpro] = useState('seca');

  const route = useRoute();
  const { tambo } = route.params;
  const { usuario } = route.params;

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alerta, setAlerta] = useState({
    show: false,
    titulo: '',
    mensaje: '',
    color: '#DD6B55',
    vuelve: false
  });

  const repOptions = [

    { value: 'vacia', label: 'VACIA' },
    { value: 'preñada', label: 'PREÑADA' }
  ];

  const prodOptions = [

    { value: 'seca', label: 'SECA' },
    { value: 'En Ordeñe', label: 'EN ORDEÑE' },
    { value: 'Vq.p/servicio', label: 'VAQ. P/SERVICIO' }
  ];

  const handleChange = fieldName => option => {
    // Actualiza el estado del formulario con el nuevo valor
    setFormValues(prevValues => ({
      ...prevValues,
      [fieldName]: option.value,
    }));
  };

  const validate = values => {
    const errors = {}

    //valida que el rp exita y no sea repetido
    if (values.rp) {

      //chequeo que no exista
      const rp = values.rp.toString().toLowerCase();
      const filtro = movies.filter(animal => {
        return (
          animal.rp.toString().toLowerCase() == rp
        )
      });
      if (filtro.length > 0) errors.rp = "EL RP YA SE ENCUENTRA ASIGNADO";


    } else {
      errors.rp = "INGRESE RP";
    }

    //valida que el erp tenga 15 digitos
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

            const filtro = movies.filter(animal => {
              return (
                animal.erp == erp
              )
            });
            if (filtro.length > 0) errors.erp = "EL eRP YA SE ENCUENTRA ASIGNADO";
          }
        }
      }
    }
    //Si está en ordeñe se debe ingresar la fecha de parto para los días de lactancia
    if ((values.estpro == 'En Ordeñe') && (!values.fparto)) {
      errors.fparto = "INGRESAR FECHA DE PARTO";
    }

    //Si está en ordeñe al menos debe tener una lactancia
    if ((values.estpro == 'En Ordeñe') && (values.lactancia == '0')) {
      errors.lactancia = "LACTANCIA NO PUEDE SER CERO";
    }
    //Si está en preñada se debe ingresar la fecha del ultimo servicio para los dias de preñez
    if ((values.estrep == 'preñada')) {
      setAviso(true);
    }

    //valida que tenga lactancia
    if (!values.lactancia) {
      errors.lactancia = "INGRESE LACTANCIA";
    } else {
      if (isNaN(values.lactancia)) {
        errors.lactancia = "REVISE LACTANCIA";
      } else {
        if (values.lactancia < 0 || values.lactancia > 15) {
          errors.lactancia = "REVISE LACTANCIA"
        }
      }
    }

    //valida que tenga uc
    if (!values.uc) {
      errors.uc = "INGRESE ULTIMO CONTROL";
    } else {
      if (isNaN(values.uc)) {
        errors.uc = "REVISE UC";
      } else {
        if (values.uc < 0 || values.uc > 80) {
          errors.uc = "REVISE UC"
        }
      }
    }

    //valida que tenga racion
    if (!values.racion) {
      errors.racion = "INGRESE RACION";
    } else {
      if (isNaN(values.racion)) {
        errors.racion = "REVISE RACION";
      } else {

        if (values.racion < 0 || values.racion > 20) {
          errors.racion = "REVISE RACION"
        }
      }
    }

    return errors
  }

  //La funcion validate debe estar declarada antes del form sino no funciona
  const formAlta = useFormik({
    initialValues: {
      fecha: new Date(),
      rp: '',
      erp: '',
      lactancia: "0",
      observaciones: '',
      estpro: 'seca',
      estrep: 'vacia',
      fparto: '',
      fservicio: '',
      racion: "8",
      uc: "0",
    },
    validate,
    onSubmit: datos => guardar(datos)
  });



  /*
    function snapshotAnimal(snapshot) {
      const an = snapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...doc.data()
        }
  
      })
      guardarAnimales(an);
      setLoading(false);
    };
    */
  const guardarAnimal = (anim) => {
    setMovies([...movies, anim])
  }
  async function guardar(datos) {
    setLoading(true);
    let parts;
    //Formatea fecha de ingreso
    const tipof = typeof datos.fecha;
    let fi;
    if (tipof == 'string') {
      parts = datos.fecha.split('/');
      fi = (parts[2]) + '-' + (parts[1]) + '-' + parts[0];
    } else {
      fi = format(datos.fecha, 'yyyy-MM-dd');
    }
    //formatea fecha de parto
    let fp = '';
    if (datos.fparto) {
      fp = datos.fparto
    }

    //formatea fecha de servicio y pone el nro de servicio
    let fs = '';
    let nservicio = 0;
    if (datos.fservicio) {
      fs = datos.fservicio
      nservicio = 1;
    }
    //formatea lactancia y determina categoria
    let lact = parseInt(datos.lactancia);
    let cat = 'Vaquillona';
    if (lact > 1) cat = 'Vaca';

    //formatea uc
    let uc = parseFloat(datos.uc);

    //formatea erp
    let erp = '';
    if (datos.erp) {
      erp = parseInt(datos.erp);
    }

    //formatea racion
    let racion = parseInt(datos.racion);

    let hoy = new Date();
    let ayer = new Date(Date.now() - 86400000);

    const animal = {
      ingreso: fi,
      idtambo: tambo.id,
      rp: datos.rp,
      erp: erp.toString(),
      lactancia: lact,
      observaciones: datos.observaciones,
      estpro: datos.estpro,
      estrep: datos.estrep,
      fparto: fp,
      fservicio: fs,
      categoria: cat,
      racion: racion,
      fracion: ayer,
      nservicio: nservicio,
      uc: uc,
      fuc: hoy,
      ca: 0,
      anorm: '',
      fbaja: '',
      mbaja: '',
      rodeo: 0,
      sugerido: 0,
      grupo: 0,
      porcentaje: 1
    }

    guardarAnimal(animal)
    firebase.db.collection('animal').add(animal).then(function (docRef) {
      guardarEvento(docRef.id, datos.observaciones);
    }).catch(error => {
      setAlerta({
        show: true,
        titulo: '¡ ERROR !',
        mensaje: 'NO SE PUDO REGISTRAR EL ANIMAL' + error,
        color: '#DD6B55'
      });
    });
    setAlerta({
      show: true,
      titulo: '¡ ATENCIÓN !',
      mensaje: 'ANIMAL REGISTRADO CON ÉXITO ',
      color: '#3AD577',
      vuelve: true
    });

    setLoading(false);
  }

  function guardarEvento(id, obs) {
    let hoy = new Date();
    firebase.db.collection('animal').doc(id).collection('eventos').add({
      fecha: hoy,
      tipo: 'Alta',
      detalle: obs,
      usuario: usuario,
      idtambo: tambo.id,
    });
  }
  function borrarFservicio() {
    setTexto2("-- / -- / --");
  }
  function borrarFparto() {
    setTexto3("-- / -- / --");
  }
  function cambiarFecha(event, date) {
    const currentDate = date;
    setShow(false);
    setFecha(currentDate);
    formAlta.setFieldValue('fecha', currentDate);
  };

  function cambiarFecha2(event, date) {
    const currentDate = date;
    setShow2(false);
    setFecha2(currentDate);
    let stringfecha2 = format(currentDate, 'yyyy-MM-dd');
    setTexto2(stringfecha2);
    formAlta.setFieldValue('fservicio', stringfecha2);
  }

  function cambiarFecha3(event, date) {
    const currentDate = date;
    setShow3(false);
    setFecha3(currentDate);
    let stringfecha3 = format(currentDate, 'yyyy-MM-dd');
    setTexto3(stringfecha3);
    formAlta.setFieldValue('fparto', stringfecha3);
  };
  const handlever = () => {
    setShow(true);
  }
  const handlever2 = () => {
    setShow2(true);
  }
  const handlever3 = () => {
    setShow3(true);
  }
  let texto = format(fecha, 'yyyy-MM-dd');



  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color='#1b829b' />
      ) : (
        <View style={styles.form}>
          <ScrollView>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FECHA INGRESO:</Text>
              <TouchableHighlight style={styles.calendar} onPress={handlever}>
                <View>
                  <Text style={styles.calendarText}>{texto}</Text>
                </View>
              </TouchableHighlight>
              {show && (
                <DateTimePicker
                  placeholder="Fecha"
                  dateFormat="DD/MM/YYYY"
                  maximumDate={new Date()}
                  showIcon={true}
                  androidMode="spinner"
                  style={styles.datePicker}
                  value={fecha}
                  onChange={cambiarFecha}
                  customStyles={{
                    dateInput: {
                      borderColor: '#d0d0d0',
                      borderRadius: 12,
                      backgroundColor: '#ffffff',
                      borderWidth: 1,
                    },
                  }}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>RP:</Text>
              <TextInput
                style={styles.input}
                onChangeText={formAlta.handleChange('rp')}
                value={formAlta.values.rp}
              />
              {formAlta.errors.rp && <Text style={styles.error}>{formAlta.errors.rp}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>eRP:</Text>
              <TextInput
                style={styles.input}
                onChangeText={formAlta.handleChange('erp')}
                value={formAlta.values.erp}
                keyboardType="numeric"
              />
              {formAlta.errors.erp && <Text style={styles.error}>{formAlta.errors.erp}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ESTADO REPRODUCTIVO:</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setOpenEstrep(true)}
              >
                <Text style={styles.selectorText}>
                  {repOptions.find(i => i.value === selectedEstrep)?.label || 'SELECCIONAR ESTADO REPRODUCTIVO'}
                </Text>
                <Icon name="chevron-down" size={15} color="#555" />
              </TouchableOpacity>

              <Modal
                isVisible={openEstrep}
                onBackdropPress={() => setOpenEstrep(false)}
                style={styles.modalStyle}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>SELECCIONAR ESTADO REPRODUCTIVO</Text>
                  <ScrollView style={styles.listContainer}>
                    {repOptions.map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={styles.optionItem}
                        onPress={() => {
                          setSelectedEstrep(item.value);
                          formAlta.setFieldValue('estrep', item.value);
                          setOpenEstrep(false);
                        }}
                      >
                        <Text style={styles.optionText}>{item.label}</Text>
                        {selectedEstrep === item.value && (
                          <Icon name="check" size={20} color="#1b829b" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Button
                    title="CERRAR"
                    onPress={() => setOpenEstrep(false)}
                    buttonStyle={styles.closeButton}
                    containerStyle={{ width: '100%', marginTop: 10 }}
                  />
                </View>
              </Modal>
              {aviso && <Text style={styles.warning}>RECUERDA INGRESAR LA FECHA DE SERVICIO</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ULTIMO SERVICIO:</Text>
              <View style={styles.row}>
                <TouchableHighlight style={styles.calendar} onPress={handlever2}>
                  <View>
                    <Text style={styles.calendarText}>{texto2}</Text>
                  </View>
                </TouchableHighlight>
                {show2 && (
                  <DateTimePicker
                    placeholder="DD/MM/AAAA"
                    dateFormat="DD/MM/YYYY"
                    maximumDate={new Date()}
                    showIcon={true}
                    androidMode="spinner"
                    style={styles.datePicker}
                    value={fecha2}
                    onChange={cambiarFecha2}
                    customStyles={{
                      dateInput: {
                        borderColor: '#d0d0d0',
                        borderRadius: 12,
                        backgroundColor: '#ffffff',
                        borderWidth: 1,
                      },
                    }}
                  />
                )}
                {texto2 !== "-- / -- / --" && (
                  <Button
                    style={styles.deleteButton}
                    type="clear"
                    icon={<Icon name="trash" size={25} color="red" />}
                    onPress={borrarFservicio}
                  />
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ESTADO PRODUCTIVO:</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setOpenEstpro(true)}
              >
                <Text style={styles.selectorText}>
                  {prodOptions.find(i => i.value === selectedEstpro)?.label || 'SELECCIONAR ESTADO PRODUCTIVO'}
                </Text>
                <Icon name="chevron-down" size={15} color="#555" />
              </TouchableOpacity>

              <Modal
                isVisible={openEstpro}
                onBackdropPress={() => setOpenEstpro(false)}
                style={styles.modalStyle}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>SELECCIONAR ESTADO PRODUCTIVO</Text>
                  <ScrollView style={styles.listContainer}>
                    {prodOptions.map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={styles.optionItem}
                        onPress={() => {
                          setSelectedEstpro(item.value);
                          formAlta.setFieldValue('estpro', item.value);
                          setOpenEstpro(false);
                        }}
                      >
                        <Text style={styles.optionText}>{item.label}</Text>
                        {selectedEstpro === item.value && (
                          <Icon name="check" size={20} color="#1b829b" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Button
                    title="CERRAR"
                    onPress={() => setOpenEstpro(false)}
                    buttonStyle={styles.closeButton}
                    containerStyle={{ width: '100%', marginTop: 10 }}
                  />
                </View>
              </Modal>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ULTIMO PARTO:</Text>
              <View style={styles.row}>
                <TouchableHighlight style={styles.calendar} onPress={handlever3}>
                  <View>
                    <Text style={styles.calendarText}>{texto3}</Text>
                  </View>
                </TouchableHighlight>
                {show3 && (
                  <DateTimePicker
                    placeholder="DD/MM/AAAA"
                    dateFormat="DD/MM/YYYY"
                    maximumDate={new Date()}
                    showIcon={true}
                    androidMode="spinner"
                    style={styles.datePicker}
                    value={fecha3}
                    onChange={cambiarFecha3}
                    customStyles={{
                      dateInput: {
                        borderColor: '#d0d0d0',
                        borderRadius: 12,
                        backgroundColor: '#ffffff',
                        borderWidth: 1,
                      },
                    }}
                  />
                )}
                {texto3 !== "-- / -- / --" && (
                  <Button
                    style={styles.deleteButton}
                    type="clear"
                    icon={<Icon name="trash" size={25} color="red" />}
                    onPress={borrarFparto}
                  />
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>LACTANCIA:</Text>
              <TextInput
                style={styles.input}
                onChangeText={formAlta.handleChange('lactancia')}
                value={formAlta.values.lactancia}
                keyboardType="numeric"
              />
              {formAlta.errors.lactancia && <Text style={styles.error}>{formAlta.errors.lactancia}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ULTIMO CONTROL(LTS):</Text>
              <TextInput
                style={styles.input}
                onChangeText={formAlta.handleChange('uc')}
                value={formAlta.values.uc}
                keyboardType="numeric"
              />
              {formAlta.errors.uc && <Text style={styles.error}>{formAlta.errors.uc}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>RACION(KGS):</Text>
              <TextInput
                style={styles.input}
                onChangeText={formAlta.handleChange('racion')}
                value={formAlta.values.racion}
                keyboardType="numeric"
              />
              {formAlta.errors.racion && <Text style={styles.error}>{formAlta.errors.racion}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>OBSERVACIONES:</Text>
              <TextInput
                style={styles.input}
                onChangeText={formAlta.handleChange('observaciones')}
                value={formAlta.values.observaciones}
              />
            </View>

            <Text></Text>
            {Object.entries(formAlta.errors).length !== 0 && <Text style={styles.error}>REVISE LOS ERRORES</Text>}
            <Button
              style={styles.submitButton}
              title="ACEPTAR"
              icon={<Icon name="check-square" size={35} color="white" />}
              onPress={formAlta.handleSubmit}
            />
          </ScrollView>
        </View>
      )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7f9',
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
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingLeft: 10,
    height: 50,
  },
  calendar: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    padding: 10,
    width: wp('90%'),
    alignSelf: 'center',
    marginVertical: 10,
  },
  calendarText: {
    fontSize: 16,
    color: '#333',
  },
  datePicker: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  picker: {
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
  error: {
    fontSize: 12,
    color: 'red',
    marginTop: 5,
    textAlign: 'center',
  },
  warning: {
    fontSize: 12,
    color: '#0056b3',
    backgroundColor: '#e3f2fd',
    borderRadius: 5,
    padding: 10,
    textAlign: 'center',
  },
  deleteButton: {
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: '#1b829b',
    borderRadius: 8,
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
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


