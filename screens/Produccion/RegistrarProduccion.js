import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableHighlight } from 'react-native';
import { Button } from 'react-native-elements';
import { useFormik } from 'formik';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
//import 'expo-firestore-offline-persistence';


import { AsyncStorage } from '@react-native-async-storage/async-storage';
import firebase from '../../database/firebase';
import Icon from 'react-native-vector-icons/FontAwesome';
import { format } from 'date-fns';
import Modal from 'react-native-modal';
import RNPickerSelect from 'react-native-picker-select';
import { useRoute } from '@react-navigation/core';


export default ({ navigation }) => {
  const [fecha, setFecha] = useState(new Date());
  const [animalesEnOrdeñe, setAnimalesEnOrdeñe] = useState("");

  const pickerStyle = {
    inputIOS: {
      color: 'white',
      paddingTop: 13,
      paddingHorizontal: 10,
      paddingBottom: 12,
    },
    inputAndroid: {
      color: 'white',
    },
    placeholderColor: 'white',
    underline: { borderTopWidth: 0 },
    icon: {
      position: 'absolute',
      backgroundColor: 'transparent',
      borderTopWidth: 5,
      borderTopColor: '#00000099',
      borderRightWidth: 5,
      borderRightColor: 'transparent',
      borderLeftWidth: 5,
      borderLeftColor: 'transparent',
      width: 0,
      height: 0,
      top: 20,
      right: 15,
    },
  };

  const route = useRoute();
  const { tambo } = route.params;

  const [ent, setEnt] = useState({
    man: 0,
    tar: 0,
    tot: 0
  });
  const [show, setShow] = useState(false);

  const [alerta, setAlerta] = useState({
    show: false,
    titulo: '',
    mensaje: '',
    color: '#DD6B55',
    vuelve: false
  });

  const options = [
    { value: 'Fabrica 1', label: 'FABRICA 1' },
    { value: 'Fabrica 2', label: 'FABRICA 2' },
    { value: 'Fabrica 3', label: 'FABRICA 3' }
  ];

  const validate = values => {
    const errors = {}

    if (isNaN(values.entM) || values.entM < 0) {
      errors.entregados = "REVISE LOS DATOS INGRESADOS" // entregados tarde 
    }
    if (isNaN(values.entT) || values.entT < 0) {
      errors.entregados = "REVISE LOS DATOS INGRESADOS" // entregados tarde 
    }


    if (isNaN(values.desM) || values.desM < 0) {
      errors.descarte = "REVISE LOS DATOS INGRESADOS" // descarte mañana 
    }

    if (isNaN(values.desT) || values.desT < 0) {
      errors.descarte = "REVISE LOS DATOS INGRESADOS" // descarte tarde 
    }

    if (isNaN(values.guaM) || values.guaM < 0) {
      errors.guachera = "REVISE LOS DATOS INGRESADOS" // guachera mañana 
    }
    if (isNaN(values.guaT) || values.guaT < 0) {
      errors.guachera = "REVISE LOS DATOS INGRESADOS" // guachera tarde
    }
    if (isNaN(values.guaT) || values.guaT < 0) {
      errors.guachera = "REVISE LOS DATOS INGRESADOS" /// Animales en ordeñe 
    }
    if (values.produccion == 0 || !values.produccion) {
      errors.produccion = "INGRESE PRODUCCION"
    } else {

      if (parseFloat(values.produccion) < (parseFloat(values.descarte) + parseFloat(values.guachera))) {
        errors.entregados = "REVISE LOS DATOS INGRESADOS"
      }
    }

    return errors
  }

  //La funcion validate debe estar declarada antes del form sino no funciona
  const formProduccion = useFormik({
    initialValues: {
      fecha: new Date(),
      prodM: "",
      prodT: "",
      produccion: "",
      descarte: "",
      desM: "",
      desT: "",
      guachera: "",
      guaM: "",
      guaT: "",
      entM: "",
      entT: "",
      ent: "",
      fabrica: 'Fabrica 1',

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

    try {
      firebase.db.collection('tambo').doc(tambo.id).collection('produccion').add({
        fecha: fecha,
        prodM: datos.prodM,
        prodT: datos.prodT,
        produccion: datos.produccion,
        guaM: datos.guaM,
        guaT: datos.guaT,
        guachera: datos.guachera,
        desM: datos.desM,
        desT: datos.desT,
        descarte: datos.descarte,
        fabrica: datos.fabrica,
        entregados: datos.ent,
        animalesEnOrd: animalesEnOrdeñe, // Guardar el valor separado

      });
      setAlerta({
        show: true,
        titulo: '¡ATENCION!',
        mensaje: 'PRODUCCIÓN REGISTRADA CON ÉXITO',
        color: '#3AD577',
        vuelve: true
      });

    } catch (error) {
      setAlerta({
        show: true,
        titulo: '¡ ERROR !',
        mensaje: 'AL REGISTRAR LA PRODUCCIÓN',
        color: '#DD6B55'
      });
    }

  }
  /////// Animales En Ordeñe 
  function changeAnEnOrd(val) {
    let anEnOrd = val;
    if (isNaN(parseFloat(anEnOrd))) {
      anEnOrd = "0";
    }
    setAnimalesEnOrdeñe(anEnOrd); // Solo actualiza este estado, sin afectar litros entregados
  }


  function producidos(campo, valor) {
    //Controlo que el valor sea numerico
    //entregados
    let entM;
    if (campo == 'entM') {
      entM = valor;
    } else {
      entM = formProduccion.values.entM;
      if (isNaN(parseFloat(entM))) {
        entM = "0";
      }
    }

    let entT;
    if (campo == 'entT') {
      entT = valor;
    } else {
      entT = formProduccion.values.entT;
      if (isNaN(parseFloat(entT))) {
        entT = "0";
      }
    }
    //Descarte
    let desM;
    if (campo == 'desM') {
      desM = valor;
    } else {
      desM = formProduccion.values.desM;
      if (isNaN(parseFloat(desM))) {
        desM = "0";
      }
    }

    let desT;
    if (campo == 'desT') {
      desT = valor;
    } else {
      desT = formProduccion.values.desT;
      if (isNaN(parseFloat(desT))) {
        desT = "0";
      }
    }


    //Guachera
    let guaM;
    if (campo == 'guaM') {
      guaM = valor;
    } else {
      guaM = formProduccion.values.guaM;
      if (isNaN(parseFloat(guaM))) {
        guaM = "0";
      }
    }

    let guaT;
    if (campo == 'guaT') {
      guaT = valor;
    } else {
      guaT = formProduccion.values.guaT;
      if (isNaN(parseFloat(guaT))) {
        guaT = "0";
      }
    }

    // ANIMALES EN ORDEÑE
    let anEnOrd;
    if (campo == 'anEnOrd') {
      anEnOrd = valor;
    } else {
      anEnOrd = formProduccion.values.anEnOrd;
      if (isNaN(parseFloat(anEnOrd))) {
        anEnOrd = "0";
      }
    }


    //calculo producidos
    const man = parseFloat(entM) + parseFloat(desM) + parseFloat(guaM);
    const tar = parseFloat(entT) + parseFloat(desT) + parseFloat(guaT);
    const tot = man + tar;
    formProduccion.setFieldValue('prodM', man.toString());
    formProduccion.setFieldValue('prodT', tar.toString());
    formProduccion.setFieldValue('produccion', tot.toString());
  }

  function changeEntM(val) {
    let entM = val;
    if (isNaN(parseFloat(entM))) {
      entM = "0";
    }
    formProduccion.setFieldValue('entM', entM);

    let entT = formProduccion.values.entT;
    if (isNaN(parseFloat(entT))) {
      entT = "0";
    }

    const tot = parseFloat(entT) + parseFloat(entM);
    formProduccion.setFieldValue('ent', tot.toString());

    producidos('entM', entM); // No afecta Animales en Ordeñe
  }

  function changeEntT(val) {
    let entT = val;
    if (isNaN(parseFloat(entT))) {
      entT = "0";
    }
    formProduccion.setFieldValue('entT', entT);

    let entM = formProduccion.values.entM;
    if (isNaN(parseFloat(entM))) {
      entM = "0";
    }

    const tot = parseFloat(entT) + parseFloat(entM);
    formProduccion.setFieldValue('ent', tot.toString());

    producidos('entT', entT); // No afecta Animales en Ordeñe
  }


  function changeDesM(val) {
    //Controlo que el valor sea numerico
    let desM = val;
    if (isNaN(parseFloat(desM))) {
      desM = "0";
    }
    formProduccion.setFieldValue('desM', desM);

    let desT = formProduccion.values.desT;
    if (isNaN(parseFloat(desT))) {
      desT = "0";
    }

    const tot = parseFloat(desT) + parseFloat(desM);
    formProduccion.setFieldValue('descarte', tot.toString());
    producidos('desM', desM);

  }

  function changeDesT(val) {
    //Controlo que el valor sea numerico
    let desT = val;
    if (isNaN(parseFloat(desT))) {
      desT = "0";
    }
    formProduccion.setFieldValue('desT', desT);

    let desM = formProduccion.values.desM;
    if (isNaN(parseFloat(desM))) {
      desM = "0";
    }

    const tot = parseFloat(desT) + parseFloat(desM);
    formProduccion.setFieldValue('descarte', tot.toString());
    producidos('desT', desT);

  }

  function changeGuaM(val) {
    //Controlo que el valor sea numerico
    let guaM = val;
    if (isNaN(parseFloat(guaM))) {
      guaM = "0";
    }
    formProduccion.setFieldValue('guaM', guaM);

    let guaT = formProduccion.values.guaT;
    if (isNaN(parseFloat(guaT))) {
      guaT = "0";
    }

    const tot = parseFloat(guaT) + parseFloat(guaM);
    formProduccion.setFieldValue('guachera', tot.toString());
    producidos('guaM', guaM);

  }

  function changeGuaT(val) {
    //Controlo que el valor sea numerico
    let guaT = val;
    if (isNaN(parseFloat(guaT))) {
      guaT = "0";
    }
    formProduccion.setFieldValue('guaT', guaT);

    let guaM = formProduccion.values.guaM;
    if (isNaN(parseFloat(guaM))) {
      guaM = "0";
    }


    const tot = parseFloat(guaT) + parseFloat(guaM);
    formProduccion.setFieldValue('guachera', tot.toString());
    producidos('guaT', guaT);

  }
  function cambiarFecha(event, date) {
    const currentDate = date;
    setShow(false);
    setFecha(currentDate);
    formProduccion.handleChange('fecha')
  };
  const handlever = () => {
    setShow(true);
  }
  let texto = format(fecha, 'yyyy-MM-dd');

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <ScrollView>
          <View style={styles.columnas}>

            <View style={styles.col}>
              <Text style={styles.texto2}>FECHA:</Text>
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
                      borderColor: 'white',
                      borderRadius: 10,
                      backgroundColor: 'white',
                      borderColor: 'grey',
                      borderWidth: 1,
                    }
                  }}
                />)}
            </View>
          </View>

          <Text style={styles.texto2}>LITROS ENTREGADOS:</Text>
          <View style={styles.columnas}>

            <View style={styles.col}>
              <Text style={styles.texto}>MAÑANA</Text>

              <TextInput
                style={styles.entrada}
                onChangeText={val => changeEntM(val)}
                keyboardType="numeric"
                value={formProduccion.values.entM.toString()} // CONVIERTE LA CADENA DE STRING 
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.texto}>TARDE</Text>
              <TextInput
                style={styles.entrada}
                onChangeText={val => changeEntT(val)}
                keyboardType="numeric"
                value={formProduccion.values.entT.toString()} // CONVIERTE LA CADENA DE STRING 
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.texto}>TOTAL</Text>
              <TextInput
                style={styles.entradaRead}
                editable={false}
                value={formProduccion.values.ent}
              />
            </View>

          </View>
          {formProduccion.errors.entregados ? <Text style={styles.error}>{formProduccion.errors.entregados}</Text> : null}
          <Text style={styles.texto2}>FABRICA:</Text>
          <View style={styles.columnas}>

            <View style={styles.col}>

              <RNPickerSelect
                items={options}
                onValueChange={formProduccion.handleChange('fabrica')}
                value={formProduccion.values.fabrica}

                placeholder={{
                  label: 'SELECCIONAR FABRICA',
                  value: null,
                  color: '#9EA0A4',
                }}
                style={{
                  inputIOS: styles.pickerStyle,
                  inputAndroid: styles.pickerStyle,
                  placeholder: {
                    color: '#9EA0A4',
                  },
                }}
                pickerContainerStyle={{
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#ccc',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  marginBottom: 10,
                }}
              />

            </View>
          </View>

          <Text></Text>
          <Text style={styles.texto2}>LITROS DESCARTE:</Text>
          <View style={styles.columnas}>

            <View style={styles.col}>
              <Text style={styles.texto}>MAÑANA</Text>
              <TextInput
                style={styles.entrada}
                onChangeText={val => changeDesM(val)}
                keyboardType="numeric"
                value={formProduccion.values.desM.toString()} // CONVIERTE LA CADENA DE STRING 
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.texto}>TARDE</Text>
              <TextInput
                style={styles.entrada}
                onChangeText={val => changeDesT(val)}
                keyboardType="numeric"
                value={formProduccion.values.desT.toString()} // CONVIERTE LA CADENA DE STRING 
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.texto}>TOTAL</Text>
              <TextInput
                style={styles.entradaRead}
                editable={false}
                value={formProduccion.values.descarte}
              />
            </View>

          </View>
          {formProduccion.errors.descarte ? <Text style={styles.error}>{formProduccion.errors.descarte}</Text> : null}
          <Text></Text>
          <Text style={styles.texto2}>LITROS GUACHERA:</Text>
          <View style={styles.columnas}>
            <View style={styles.col}>
              <Text style={styles.texto}>MAÑANA</Text>
              <TextInput
                style={styles.entrada}
                onChangeText={val => changeGuaM(val)}
                keyboardType="numeric"
                value={formProduccion.values.guaM.toString()} // CONVIERTE LA CADENA DE STRING 
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.texto}>TARDE</Text>
              <TextInput
                style={styles.entrada}
                onChangeText={val => changeGuaT(val)}
                keyboardType="numeric"
                value={formProduccion.values.guaT.toString()} // CONVIERTE LA CADENA DE STRING 
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.texto}>TOTAL</Text>
              <TextInput
                style={styles.entradaRead}
                editable={false}
                value={formProduccion.values.guachera}
              />
            </View>

          </View>
          {formProduccion.errors.guachera ? <Text style={styles.error}>{formProduccion.errors.guachera}</Text> : null}
          <Text></Text>
          <Text style={styles.texto2}>LITROS PRODUCIDOS:</Text>
          <View style={styles.columnas}>

            <View style={styles.col}>
              <Text style={styles.texto}>MAÑANA</Text>
              <TextInput
                style={styles.entradaRead}
                editable={false}
                value={formProduccion.values.prodM}
              />

            </View>
            <View style={styles.col}>
              <Text style={styles.texto}>TARDE</Text>
              <TextInput
                style={styles.entradaRead}
                editable={false}
                value={formProduccion.values.prodT}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.texto}>TOTAL</Text>
              <TextInput
                style={styles.entradaRead}
                editable={false}
                value={formProduccion.values.produccion}
              />
            </View>

          </View>
          {formProduccion.errors.produccion ? <Text style={styles.error}>{formProduccion.errors.produccion}</Text> : null}
          <Text></Text>
          <Text style={styles.texto2}>VACAS EN ORDEÑE</Text>
          <View style={styles.columnas}>

            <View style={styles.col}>
              <Text style={styles.texto}>COLOCAR EL TOTAL DE VACAS EN ORDEÑE</Text>

              <TextInput
                style={styles.entrada}
                onChangeText={val => changeAnEnOrd(val)}
                keyboardType="numeric"
                value={animalesEnOrdeñe}
              />
            </View>
          </View>
          <Text></Text>
          <Button
            title="  ACEPTAR"
            style={styles.boton}
            icon={
              <Icon
                name="check-square"
                size={35}
                color="white"
              />
            }
            onPress={formProduccion.handleSubmit}
          />

        </ScrollView>

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
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fecha: {
    width: '100%',
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
  },
  columnas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  col: {
    flex: 1,
    marginRight: 10,
  },
  texto: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  texto2: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  textocalendar: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  calendario: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    padding: 10,
    width: wp('80%'),
    alignSelf: 'center',
    marginVertical: 10,
  },
  error: {
    fontSize: 14,
    color: '#721c24',
    backgroundColor: '#f8d7da',
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
  },
  entrada: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    fontSize: 16,
  },
  entradaRead: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#ced4da',
    fontSize: 16,
  },
  boton: {
    marginTop: 20,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
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
});