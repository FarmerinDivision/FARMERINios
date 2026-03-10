import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity, Keyboard } from 'react-native';
import { Button } from 'react-native-elements';
import { useFormik } from 'formik';
import InfoAnimal from '../InfoAnimal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import firebase from '../../database/firebase';
import Icon from 'react-native-vector-icons/FontAwesome';
import { format } from 'date-fns';
import Modal from 'react-native-modal';
import { useRoute } from '@react-navigation/core';

export default ({ navigation }) => {
  const [show, setShow] = useState(false);
  const [fecha, setFecha] = useState(new Date());

  const routeTratam = useRoute();
  const { animal, usuario, tratam } = routeTratam.params;

  const [itemsTrat, setItemsTrat] = useState([]);
  const [itemsEnf, setItemsEnf] = useState([]);
  const [openTrat, setOpenTrat] = useState(false);
  const [openEnf, setOpenEnf] = useState(false);

  const [alerta, setAlerta] = useState({
    show: false,
    titulo: '',
    mensaje: '',
    color: '#DD6B55',
    vuelve: false
  });

  useEffect(() => {
    const enf = [];
    const trat = [];
    tratam.map(doc => {
      let item = { label: doc.descripcion, value: doc.descripcion };
      if (doc.tipo === 'tratamiento') {
        trat.push(item);
      } else if (doc.tipo === 'enfermedad') {
        enf.push(item);
      }
    });
    setItemsTrat(trat);
    setItemsEnf(enf);
  }, []);

  const validate = values => {
    const errors = {};
    if (!values.tratamiento) {
      errors.tratamiento = "DEBE SELECCIONAR UN TRATAMIENTO";
    }
    if (!values.enfermedad) {
      errors.enfermedad = "DEBE SELECCIONAR UNA ENFERMEDAD";
    }
    return errors;
  };

  const formTratamiento = useFormik({
    initialValues: {
      fecha: fecha,
      enfermedad: '',
      tratamiento: '',
      obs: ''
    },
    validate,
    onSubmit: datos => guardar(datos)
  });

  function guardar(datos) {
    let fdate = fecha;
    let detalle = 'Enfermedad: ' + datos.enfermedad + ' /Tratamiento: ' + datos.tratamiento + ' /Obs: ' + datos.obs;
    try {
      firebase.db.collection('animal').doc(animal.id).collection('eventos').add({
        fecha: fdate,
        tipo: 'Tratamiento',
        detalle: detalle,
        usuario: usuario,
        idtambo: animal.idtambo,
      });
      setAlerta({
        show: true,
        titulo: '¡ATENCION!',
        mensaje: 'TRATAMIENTO REGISTRADO CON ÉXITO',
        color: '#3AD577',
        vuelve: true
      });
    } catch (error) {
      setAlerta({
        show: true,
        titulo: '¡ ERROR !',
        mensaje: 'NO SE PUEDE REGISTRAR EL TRATAMIENTO',
        color: '#DD6B55'
      });
    }
  }

  function cambiarFecha(event, date) {
    const currentDate = date;
    setShow(false);
    if (currentDate) {
      setFecha(currentDate);
      formTratamiento.setFieldValue('fecha', currentDate);
    }
  }

  const handlever = () => setShow(true);

  let texto = format(fecha, 'yyyy-MM-dd');

  return (
    <View style={styles.container}>
      <InfoAnimal animal={animal} />

      <View style={styles.formContainer}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>FECHA:</Text>
          <TouchableOpacity style={styles.calendario} onPress={handlever}>
            <Text style={styles.textoCalendar}>{texto}</Text>
          </TouchableOpacity>
          {show && (
            <DateTimePicker
              value={fecha}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={cambiarFecha}
              style={styles.fecha}
              customStyles={{
                dateInput: {
                  borderColor: '#1b829b',
                  borderWidth: 1,
                  borderRadius: 10,
                  backgroundColor: '#ffffff'
                }
              }}
            />
          )}

          <Text style={styles.label}>ENFERMEDAD:</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setOpenEnf(true)}
          >
            <Text style={styles.selectorText}>
              {itemsEnf.find(i => i.value === formTratamiento.values.enfermedad)?.label || 'SELECCIONAR ENFERMEDAD'}
            </Text>
            <Icon name="chevron-down" size={15} color="#555" />
          </TouchableOpacity>

          <Modal
            isVisible={openEnf}
            onBackdropPress={() => setOpenEnf(false)}
            onBackButtonPress={() => setOpenEnf(false)}
            style={styles.modalStyle}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>SELECCIONAR ENFERMEDAD</Text>

              {itemsEnf.length === 0 ? (
                <Text style={styles.emptyText}>No hay enfermedades disponibles</Text>
              ) : (
                <ScrollView style={styles.listContainer}>
                  {itemsEnf.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={styles.optionItem}
                      onPress={() => {
                        formTratamiento.setFieldValue('enfermedad', item.value);
                        setOpenEnf(false);
                      }}
                    >
                      <Text style={styles.optionText}>{item.label}</Text>
                      {formTratamiento.values.enfermedad === item.value && (
                        <Icon name="check" size={20} color="#1b829b" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <Button
                title="CERRAR"
                onPress={() => setOpenEnf(false)}
                buttonStyle={styles.closeButton}
                containerStyle={{ width: '100%', marginTop: 10 }}
              />
            </View>
          </Modal>
          {formTratamiento.errors.enfermedad ? <Text style={styles.error}>{formTratamiento.errors.enfermedad}</Text> : null}

          <Text style={styles.label}>TRATAMIENTO:</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setOpenTrat(true)}
          >
            <Text style={styles.selectorText}>
              {itemsTrat.find(i => i.value === formTratamiento.values.tratamiento)?.label || 'SELECCIONAR TRATAMIENTO'}
            </Text>
            <Icon name="chevron-down" size={15} color="#555" />
          </TouchableOpacity>

          <Modal
            isVisible={openTrat}
            onBackdropPress={() => setOpenTrat(false)}
            onBackButtonPress={() => setOpenTrat(false)}
            style={styles.modalStyle}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>SELECCIONAR TRATAMIENTO</Text>

              {itemsTrat.length === 0 ? (
                <Text style={styles.emptyText}>No hay tratamientos disponibles</Text>
              ) : (
                <ScrollView style={styles.listContainer}>
                  {itemsTrat.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={styles.optionItem}
                      onPress={() => {
                        formTratamiento.setFieldValue('tratamiento', item.value);
                        setOpenTrat(false);
                      }}
                    >
                      <Text style={styles.optionText}>{item.label}</Text>
                      {formTratamiento.values.tratamiento === item.value && (
                        <Icon name="check" size={20} color="#1b829b" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <Button
                title="CERRAR"
                onPress={() => setOpenTrat(false)}
                buttonStyle={styles.closeButton}
                containerStyle={{ width: '100%', marginTop: 10 }}
              />
            </View>
          </Modal>
          {formTratamiento.errors.tratamiento ? <Text style={styles.error}>{formTratamiento.errors.tratamiento}</Text> : null}

          <Text style={styles.label}>OBSERVACIONES:</Text>
          <TextInput
            style={styles.entrada}
            onChangeText={formTratamiento.handleChange('obs')}
            value={formTratamiento.values.obs}
            multiline
          />
        </ScrollView>
      </View>

      <Button
        title="  ACEPTAR"
        icon={<Icon name="check-square" size={35} color="white" />}
        buttonStyle={styles.button}
        onPress={formTratamiento.handleSubmit}
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
                if (alerta.vuelve) navigation.popToTop();
              }}
              buttonStyle={{ backgroundColor: alerta.color, marginTop: 10 }}
            />
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e1e8ee',
  },
  formContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    color: '#444',
    marginBottom: 5,
  },
  calendario: {
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1b829b',
    marginBottom: 15,
  },
  textoCalendar: {
    fontSize: 16,
    color: '#444',
    textAlign: "center"
  },
  fecha: {
    width: wp('100%'),
    padding: 5,
    height: 50
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
    borderColor: 'red',
    marginBottom: 10
  },
  entrada: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    height: 80,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#1b829b',
    borderRadius: 8,
    marginTop: 15,
    paddingVertical: 15,
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
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: '#777',
  },
  closeButton: {
    backgroundColor: '#999',
    borderRadius: 8,
    paddingVertical: 12,
  },
});
