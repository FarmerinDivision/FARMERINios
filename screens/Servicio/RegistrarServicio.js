// Código actualizado con react-native-dropdown-picker
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-elements';
import { useFormik } from 'formik';
import InfoAnimal from '../InfoAnimal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import firebase from '../../database/firebase';
import Icon from 'react-native-vector-icons/FontAwesome';
import { format } from 'date-fns';
import Modal from 'react-native-modal';
import { MovieContext } from "../Contexto";
import { useRoute, useFocusEffect } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';

export default ({ navigation }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { movies, setMovies, trata: tratamientos, torosx: torosData } = useContext(MovieContext);
  const [isPregnant, setIsPregnant] = useState(false);
  const route = useRoute();
  const { animal, tambo, usuario } = route.params;

  const [tratamientoOptions, setTratamientoOptions] = useState([]);
  const [toros, setToros] = useState([]);
  const tipoOptions = [
    { label: 'CONVENCIONAL', value: 'Convencional' },
    { label: 'SEXADO', value: 'Sexado' },
  ];

  const [openTratamiento, setOpenTratamiento] = useState(false);
  const [openToro, setOpenToro] = useState(false);
  const [openTipo, setOpenTipo] = useState(false);

  const [alerta, setAlerta] = useState({
    show: false,
    titulo: '',
    mensaje: '',
    color: '#DD6B55',
    vuelve: false,
  });

  useFocusEffect(
    useCallback(() => {
      fetchTratamientos();
      fetchToros();
    }, [tratamientos]) // Dependencia agregada para recargar si cambian los tratamientos en contexto
  );

  const validate = values => {
    const errors = {};
    // Puedes agregar validaciones aquí si es necesario
    return errors;
  };

  const formik = useFormik({
    initialValues: {
      fecha: new Date(),
      tratamiento: '',
      toro: 'Robo',
      tipo: 'Convencional',
      obs: ''
    },
    validate,
    onSubmit: values => handleSave(values)
  });

  const fetchTratamientos = () => {
    const filteredTratamientos = tratamientos.filter(e => e.tipo === "servicio");

    const newOptions = filteredTratamientos.map(doc => ({
      key: doc.id,
      value: doc.descripcion,
      label: doc.descripcion
    }));

    setTratamientoOptions(newOptions);
  };

  const fetchToros = () => {
    try {
      firebase.db.collection('macho')
        .where('idtambo', '==', tambo.id)
        .get()
        .then(snapshot => {
          const uniqueHBAs = new Set();
          const newToros = [];

          console.log(`🐂 fetchToros: Encontrados ${snapshot.size} documentos para tambo ${tambo.id}`);

          snapshot.docs.forEach(doc => {
            const data = doc.data();
            const hbaRaw = data.hba;

            if (hbaRaw) {
              // Normalizar para evitar duplicados por espacios o mayúsculas
              const hbaNormalized = hbaRaw.toString().trim().toUpperCase();

              if (!uniqueHBAs.has(hbaNormalized)) {
                uniqueHBAs.add(hbaNormalized);
                newToros.push({
                  key: doc.id,
                  value: hbaRaw.trim(), // Usar valor limpio pero original (o normalizado si se prefiere)
                  label: hbaRaw.trim()
                });
              } else {
                console.log(`🐂 Duplicado ignorado: "${hbaRaw}" (Normalizado: "${hbaNormalized}")`);
              }
            } else {
              console.log(`⚠️ Documento ${doc.id} sin campo HBA`);
            }
          });

          // Ordenar alfabéticamente para facilitar la búsqueda
          newToros.sort((a, b) => a.label.localeCompare(b.label));

          console.log(`🐂 Lista final de toros (${newToros.length}):`, newToros.map(t => t.label));
          setToros(newToros);
        });
    } catch (error) {
      showAlert('¡ ERROR !', 'NO SE PUEDEN OBTENER LOS TOROS');
    }
  };

  const handleSave = (datos) => {
    const formattedDate = formatDate(datos.fecha);

    const detalle = `Toro: ${datos.toro} / Tipo: ${datos.tipo} / Tratamiento: ${datos.tratamiento} / Obs: ${datos.obs}`;
    const serv = animal.nservicio;
    const estadoRepro = isPregnant ? "preñada" : "vacia";

    const animalUpdate = {
      fservicio: formattedDate,
      nservicio: serv + 1,
      celo: false,
      estrep: estadoRepro
    };

    try {
      const objIndex = movies.findIndex(obj => obj.id === animal.id);
      const updatedMovies = [...movies];
      updatedMovies[objIndex] = { ...updatedMovies[objIndex], ...animalUpdate };

      setMovies(updatedMovies);
      firebase.db.collection('animal').doc(animal.id).update(animalUpdate);
      firebase.db.collection('animal').doc(animal.id).collection('eventos').add({
        fecha: selectedDate,
        tipo: 'Servicio',
        detalle: detalle,
        usuario: usuario,
        idtambo: tambo.id,
      });
      showAlert('¡ ATENCIÓN !', 'SERVICIO REGISTRADO CON ÉXITO', '#3AD577', true);

    } catch (error) {
      showAlert('¡ ERROR !', 'NO SE PUEDE REGISTRAR EL SERVICIO');
    }
  };

  const formatDate = (date) => {
    if (typeof date === 'string') {
      const parts = date.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}T04:00:00`;
    }
    return format(selectedDate, 'yyyy-MM-dd');
  };

  const showAlert = (title, message, color = '#DD6B55', goBack = false) => {
    setAlerta({
      show: true,
      titulo: title,
      mensaje: message,
      color: color,
      vuelve: goBack,
    });
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      formik.setFieldValue('fecha', date);
    }
  };

  const handleDatePress = () => {
    setShowDatePicker(true);
  };

  return (
    <View style={styles.container}>
      <InfoAnimal animal={animal} datos='servicio' />
      <View style={styles.formContainer}>
        <ScrollView>
          <Text style={styles.label}>FECHA:</Text>
          <TouchableOpacity style={styles.calendario} onPress={handleDatePress}>
            <Text style={styles.textoCalendar}>{format(selectedDate, 'yyyy-MM-dd')}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              dateFormat="DD/MM/YYYY"
              maximumDate={new Date()}
              androidMode="spinner"
              style={styles.fecha}
              value={selectedDate}
              onChange={handleDateChange}
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
          <Text style={styles.label}>TRATAMIENTO:</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setOpenTratamiento(true)}
          >
            <Text style={styles.selectorText}>
              {formik.values.tratamiento || 'SELECCIONAR TRATAMIENTO'}
            </Text>
            <Icon name="chevron-down" size={15} color="#555" />
          </TouchableOpacity>

          <Modal
            isVisible={openTratamiento}
            onBackdropPress={() => setOpenTratamiento(false)}
            onBackButtonPress={() => setOpenTratamiento(false)}
            style={styles.modalStyle}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>SELECCIONAR TRATAMIENTO</Text>

              {tratamientoOptions.length === 0 ? (
                <Text style={styles.emptyText}>No hay tratamientos disponibles</Text>
              ) : (
                <ScrollView style={styles.listContainer}>
                  {tratamientoOptions.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={styles.optionItem}
                      onPress={() => {
                        formik.setFieldValue('tratamiento', item.value);
                        setOpenTratamiento(false);
                      }}
                    >
                      <Text style={styles.optionText}>{item.label}</Text>
                      {formik.values.tratamiento === item.value && (
                        <Icon name="check" size={20} color="#1b829b" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <Button
                title="CERRAR"
                onPress={() => setOpenTratamiento(false)}
                buttonStyle={styles.closeButton}
                containerStyle={{ width: '100%', marginTop: 10 }}
              />
            </View>
          </Modal>
          <Text style={styles.label}>TORO:</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setOpenToro(true)}
          >
            <Text style={styles.selectorText}>
              {formik.values.toro && formik.values.toro !== 'Robo'
                ? formik.values.toro
                : 'SELECCIONAR TORO'}
            </Text>
            <Icon name="chevron-down" size={15} color="#555" />
          </TouchableOpacity>

          <Modal
            isVisible={openToro}
            onBackdropPress={() => setOpenToro(false)}
            onBackButtonPress={() => setOpenToro(false)}
            style={styles.modalStyle}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>SELECCIONAR TORO</Text>

              {toros.length === 0 ? (
                <Text style={styles.emptyText}>No hay toros disponibles</Text>
              ) : (
                <ScrollView style={styles.listContainer}>
                  {toros.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={styles.optionItem}
                      onPress={() => {
                        formik.setFieldValue('toro', item.value);
                        setOpenToro(false);
                      }}
                    >
                      <Text style={styles.optionText}>{item.label}</Text>
                      {formik.values.toro === item.value && (
                        <Icon name="check" size={20} color="#1b829b" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <Button
                title="CERRAR"
                onPress={() => setOpenToro(false)}
                buttonStyle={styles.closeButton}
                containerStyle={{ width: '100%', marginTop: 10 }}
              />
            </View>
          </Modal>

          <Text style={styles.label}>TIPO SEMEN:</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setOpenTipo(true)}
          >
            <Text style={styles.selectorText}>
              {formik.values.tipo || 'SELECCIONAR TIPO'}
            </Text>
            <Icon name="chevron-down" size={15} color="#555" />
          </TouchableOpacity>

          <Modal
            isVisible={openTipo}
            onBackdropPress={() => setOpenTipo(false)}
            onBackButtonPress={() => setOpenTipo(false)}
            style={styles.modalStyle}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>SELECCIONAR TIPO</Text>

              <ScrollView style={styles.listContainer}>
                {tipoOptions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.optionItem}
                    onPress={() => {
                      formik.setFieldValue('tipo', item.value);
                      setOpenTipo(false);
                    }}
                  >
                    <Text style={styles.optionText}>{item.label}</Text>
                    {formik.values.tipo === item.value && (
                      <Icon name="check" size={20} color="#1b829b" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Button
                title="CERRAR"
                onPress={() => setOpenTipo(false)}
                buttonStyle={styles.closeButton}
                containerStyle={{ width: '100%', marginTop: 10 }}
              />
            </View>
          </Modal>

          <Text style={styles.label}>OBSERVACIONES:</Text>
          <TextInput
            style={styles.entrada}
            onChangeText={formik.handleChange('obs')}
            value={formik.values.obs}
            multiline
          />
        </ScrollView>
      </View>
      <Button
        title="  ACEPTAR"
        icon={<Icon name="check-square" size={35} color="white" />}
        buttonStyle={styles.button}
        onPress={formik.handleSubmit}
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

const PickerField = ({ label, items, formik, fieldName }) => (
  <View>
    <Text style={styles.label}>{label}</Text>
    <RNPickerSelect
      items={items}
      onValueChange={formik.handleChange(fieldName)}
      value={formik.values[fieldName]}
      placeholder={{
        label: `SELECCIONAR ${label}`,
        value: null,
        color: '#9EA0A4',
      }}
      style={styles.pickerSelectStyles}
    />
  </View>
);

const TextField = ({ label, formik, fieldName }) => (
  <View>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.entrada}
      onChangeText={formik.handleChange(fieldName)}
      value={formik.values[fieldName]}
      multiline
    />
  </View>
);

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
  pickerSelectStyles: {
    inputIOS: {
      color: '#000',
      padding: 10,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      marginBottom: 15,
    },
    inputAndroid: {
      color: '#000',
      padding: 10,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      marginBottom: 15,
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

