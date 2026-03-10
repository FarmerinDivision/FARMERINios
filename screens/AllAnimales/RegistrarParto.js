import React, { useState, useEffect, useContext, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, ScrollView, ActivityIndicator, Image, TouchableHighlight, TouchableOpacity, Alert } from 'react-native';
import { Button } from 'react-native-elements';
import { useFormik } from 'formik';
import InfoAnimal from '../InfoAnimal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
// import DropDownPicker from 'react-native-dropdown-picker';
import { Camera, CameraType, CameraView } from 'expo-camera';
import firebase from '../../database/firebase';
import Icon from 'react-native-vector-icons/FontAwesome';
import CriaItem from './CriaItem';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from 'react-native-modal';
import { Modal as NativeModal } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { MovieContext } from "../Contexto"
import { useRoute } from '@react-navigation/core';

export default ({ navigation }) => {
  const [fecha, setFecha] = useState(new Date());
  const { movies, setMovies, trata } = useContext(MovieContext);

  const route = useRoute();
  const { animal } = route.params;
  const { tambo } = route.params;
  const { usuario } = route.params;

  const [showfecha, setShowFecha] = useState(false);
  const [show, setShow] = useState(false);
  const [permisos, setPermisos] = useState(null);
  const [alerta, setAlerta] = useState({
    show: false,
    titulo: '',
    mensaje: '',
    color: '#DD6B55',
    vuelve: false
  });

  const [cria, setCria] = useState([]);
  const [iden, setIden] = useState(0);
  const [modal, setModal] = useState(false);
  const [tratamientoOptions, setTratamientoOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingParto, setLoadingParto] = useState(false);
  const [openTipo, setOpenTipo] = useState(false);
  const [openTrat, setOpenTrat] = useState(false);
  const camRef = useRef(null);
  const [foto, setFoto] = useState(null);
  const [openTipoParto, setOpenTipoParto] = useState(false);
  const [openTratParto, setOpenTratParto] = useState(false);

  const [options, setOptions] = useState([
    { value: 'Normal', label: 'NORMAL' },
    { value: 'Dif. Intensa', label: 'DIF. INTENSA' },
    { value: 'Dif. Leve', label: 'DIF. LEVE' },
    { value: 'Cesárea', label: 'CESAREA' },
    { value: 'No sabe', label: 'NO SABE' },
    { value: 'Mala Presentación', label: 'MALA PRESENTACION' },
    { value: 'Mellizos', label: 'MELLIZOS' }
  ]);
  const sexoOptions = [
    { value: 'Macho', label: 'MACHO' },
    { value: 'Hembra', label: 'HEMBRA' },
    { value: 'Macho Muerto', label: 'MACHO MUERTO' },
    { value: 'Hembra Muerta', label: 'HEMBRA MUERTA' },
  ];

  const calostroOptions = [
    { value: 'Calostro Madre', label: 'CALOSTRO MADRE' },
    { value: 'Calostro Congelado', label: 'CALOSTRO CONGELADO' }
  ];

  useEffect(() => {
    getPermisos();
    obtenerTratamientos();
  }, []);

  async function getPermisos() {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setPermisos(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se puede acceder a la cámara');
      }
    } catch (error) {
      console.log('❌ Error al pedir permisos de cámara:', error);
      setPermisos(false);
    }
  }


  function obtenerTratamientos() {
    const filtrado = trata.filter(e => e.tipo === 'tratamiento');
    const opciones = filtrado.map(doc => ({
      value: doc.descripcion,
      label: doc.descripcion
    }));
    setTratamientoOptions(opciones);
  }

  const formParto = useFormik({
    initialValues: {
      fecha: new Date(),
      tipo: 'Normal',
      tratamiento: '',
      obs: ''
    },
    onSubmit: datos => guardar(datos)
  });

  const validate = values => {
    const errors = {}
    if ((values.sexo != 'Macho' && values.sexo != 'Hembra') && !values.foto) {
      errors.foto = "DEBE TOMAR UNA FOTO"
    }
    if (values.peso && (values.peso < 1 || values.peso > 50)) {
      errors.peso = "REVISE EL PESO DE LA CRIA"
    }
    if (isNaN(values.peso)) {
      errors.peso = "REVISE EL PESO DE LA CRIA"
    }
    return errors
  }

  const formCria = useFormik({
    initialValues: {
      rp: '',
      sexo: 'Hembra',
      peso: '',
      tratamiento: 'Calostro Madre',
      foto: '',
      obs: ''
    },
    validate,
    onSubmit: datos => guardarCria(datos)
  });

  useEffect(() => {

    //busca los animales preñados
    obtenerTratamientos();
  }, []);

  function obtenerTratamientos() {
    const filtrado = trata.filter(e => e.tipo === 'tratamiento');
    const opciones = filtrado.map(doc => ({
      value: doc.descripcion,
      label: doc.descripcion
    }));
    setTratamientoOptions(opciones);
  }

  function cerrar() {
    formCria.setFieldValue('rp', '');
    formCria.setFieldValue('sexo', 'Hembra');
    setValueSexo('Hembra');
    formCria.setFieldValue('peso', '');
    formCria.setFieldValue('tratamiento', 'Calostro Madre');
    formCria.setFieldValue('foto', '');
    formCria.setFieldValue('obs', '');
    setModal(true);
  }

  async function getPermisos() {
    setPermisos(true);
  }


  function eliminarFoto() {
    formCria.setFieldValue('foto', '');
  }

  async function guardar(datos) {
    console.log('DEBUG guardar() - inicio', { datos, fechaState: fecha, criaState: cria });
    setLoadingParto(true);
    //Formatea fecha 
    const tipof = typeof datos.fecha;
    let fstring;
    let fdate;
    if (tipof == 'string') {
      let parts = datos.fecha.split('/');
      fstring = (parts[2]) + '-' + (parts[1]) + '-' + parts[0];
      let fs = fstring + 'T04:00:00';
      fdate = new Date(fs);
      console.log('DEBUG guardar() - fecha string', { datosFecha: datos.fecha, fstring, fdate });
    } else {
      fstring = format(fecha, 'yyyy-MM-dd');
      fdate = datos.fecha;
      console.log('DEBUG guardar() - fecha Date', { fechaState: fecha, fstring, fdate });
    }


    let detalle = datos.tipo + ' /Trat: ' + datos.tratamiento + ' /Obs.: ' + datos.obs + '\n';
    if (cria.length == 0) {
      console.log('DEBUG guardar() - validación falla: no hay crías');
      setAlerta({
        show: true,
        titulo: 'Error!',
        mensaje: 'Debe ingresar una cría',
        color: '#DD6B55'
      });
      setLoadingParto(false);

    } else {
      if (cria.length == 2 && datos.tipo != 'Mellizos') {
        console.log('DEBUG guardar() - validación falla: hay 2 crías pero tipo no es Mellizos', { tipo: datos.tipo, cantidadCrias: cria.length });
        setAlerta({
          show: true,
          titulo: 'Error!',
          mensaje: 'Debe ingresar sólo una cría',
          color: '#DD6B55'
        });
        setLoadingParto(false);
      } else if (cria.length != 2 && datos.tipo == 'Mellizos') {
        console.log('DEBUG guardar() - validación falla: tipo Mellizos pero cantidad != 2', { tipo: datos.tipo, cantidadCrias: cria.length });
        setAlerta({
          show: true,
          titulo: 'Error!',
          mensaje: 'Debe ingresar dos crías',
          color: '#DD6B55'
        });
        setLoadingParto(false);
      } else {
        let base;
        let fbaja = '';
        let mbaja = '';
        let an;
        let hayError = false;
        let crias = [];
        console.log('DEBUG guardar() - comenzando registro de crías', { crías: cria, tipoParto: datos.tipo });

        // CAMBIO: forEach -> for...of para soportar await correctamente
        for (const c of cria) {
          //seteo observaciones por cria
          let obs = '';
          if (c.obs) obs = c.obs;

          //if (c.sexo == 'Hembra' || c.sexo == 'Macho') {
          //Seteo la base de acuerdo al sexo
          if (c.sexo == 'Hembra' || c.sexo == 'Hembra Muerta') {
            base = 'animal';
            if (c.sexo == 'Hembra Muerta') {
              fbaja = fstring;
              mbaja = 'Muerto al nacer'
            }
            an = {
              ingreso: fstring,
              idtambo: tambo.id,
              rp: c.rp,
              erp: '',
              lactancia: 0,
              observaciones: obs,
              estpro: 'cria',
              estrep: 'vacia',
              fparto: '',
              fservicio: '',
              categoria: 'Vaquillona',
              racion: 0,
              fracion: '',
              nservicio: 0,
              uc: 0,
              fuc: '',
              ca: 0,
              anorm: '',
              fbaja: fbaja,
              mbaja: mbaja,
              rodeo: 0,
              grupo: animal.grupo || 0,
              sugerido: 0
            }
          } else {
            base = 'macho'
            if (c.sexo == 'Macho Muerto') {
              fbaja = fstring;
              mbaja = 'Muerto al nacer'
            }
            an = {
              ingreso: fstring,
              idtambo: tambo.id,
              cat: 'ternero',
              rp: c.rp,
              fbaja: fbaja,
              mbaja: mbaja,
              observaciones: obs,
            }
          }
          console.log('DEBUG guardar() - cría preparada', { base, an, cria: c });


          try {
            //guardo la foto en caso de que exista
            let nombreFoto = '';
            if (c.foto) {
              //obtiene el nombre del archivo
              const posicionUltimaBarra = c.foto.lastIndexOf("/");
              const rutaRelativa = c.foto.substring(posicionUltimaBarra + "/".length, c.foto.length);
              nombreFoto = rutaRelativa;
            }
            console.log('DEBUG guardar() - foto cría', { tieneFoto: !!c.foto, nombreFoto });

            crias.push({
              id: c.id,
              rp: c.rp,
              sexo: c.sexo,
              peso: c.peso,
              trat: c.tratamiento,
              foto: nombreFoto,
              obs: obs,
            });
            console.log('DEBUG guardar() - acumuladas crías para evento', { crias });

            //insertar cria en base de datos
            const addRes = await firebase.db.collection(base).add(an);
            console.log('DEBUG guardar() - cría insertada en BD', { base, docId: addRes && addRes.id });

            //Si tiene foto la almacena - Manejo de errores independiente
            if (c.foto) {
              try {
                //configura el lugar de almacenamiento
                const storageRef = firebase.almacenamiento.ref();
                const archivoRef = storageRef.child(tambo.id + '/crias/' + nombreFoto);
                //recupera el archivo en un blob
                const response = await fetch(c.foto);
                const blob = await response.blob();
                //sube el archivo
                await archivoRef.put(blob);
                console.log('DEBUG guardar() - foto subida a storage', { path: tambo.id + '/crias/' + nombreFoto });
              } catch (storageError) {
                console.warn('ADVERTENCIA: Error al subir foto a Storage (se ignora para no bloquear registro)', storageError);
                // No seteamos hayError = true para que el flujo continúe
              }
            }

          } catch (error) {
            hayError = true;
            console.error('ERROR guardar() - registrando cría (DB)', error);
            setAlerta({
              show: true,
              titulo: 'Error!',
              mensaje: 'Al regsitrar la cría',
              color: '#DD6B55'
            });
          }
        } // Fin del for...of

        if (!hayError) {
          //actualizar animal
          let cat;
          let lact = parseInt(animal.lactancia) + 1;
          if (lact > 1) {
            cat = 'Vaca'
          } else {
            cat = 'Vaquillona';
          }

          an = {
            lactancia: lact,
            estpro: 'En Ordeñe',
            estrep: 'vacia',
            fparto: fstring,
            fservicio: '',
            categoria: cat,
            nservicio: 0
          }
          console.log('DEBUG guardar() - actualizando animal y creando evento', { animalId: animal.id, update: an, detalle, criasEvento: crias });

          try {
            let objIndex = movies.findIndex((obj => obj.id == animal.id));
            const copia = [...movies]
            const obj = copia[objIndex]
            const nuevo = Object.assign({}, obj, an)
            copia[objIndex] = nuevo
            setMovies(copia)
            await firebase.db.collection('animal').doc(animal.id).update(an);
            console.log('DEBUG guardar() - animal actualizado en BD', { animalId: animal.id });
            const eventoRes = await firebase.db.collection('animal').doc(animal.id).collection('eventos').add({
              fecha: fecha,
              tipo: 'Parto',
              detalle: detalle,
              crias: crias,
              usuario: usuario,
              idtambo: tambo.id,
            })
            console.log('DEBUG guardar() - evento de parto creado', { eventoId: eventoRes && eventoRes.id });
            setAlerta({
              show: true,
              titulo: 'Atención!',
              mensaje: 'Parto registrado con éxito',
              color: '#3AD577',
              vuelve: true
            });
            setLoadingParto(false);

          } catch (error) {
            console.error('ERROR guardar() - actualizando animal o creando evento', error);
            setAlerta({
              show: true,
              titulo: 'Error!',
              mensaje: 'No se puederegistrar el parto',
              color: '#DD6B55'
            });
            setLoadingParto(false);
          }
        } else {
          // Hubo errores registrando alguna cría
          setLoadingParto(false);
        }
      }
    }
  }

  async function guardarCria(datos) {
    console.log('DEBUG guardarCria() - inicio', { datos });
    setLoading(true);
    let errores = false;
    let descerror = '';
    let base;
    setIden(iden + 1);
    const c = {
      id: iden.toString(),
      rp: datos.rp,
      peso: datos.peso,
      sexo: datos.sexo || 'Hembra',
      tratamiento: datos.tratamiento,
      foto: datos.foto,
      obs: datos.obs,
    }

    //if (c.sexo == 'Hembra' || c.sexo == 'Macho') {
    //Seteo la base de acuerdo al sexo
    if (c.sexo == 'Hembra' || c.sexo == 'Hembra Muerta') {
      base = 'animal'
    } else {
      base = 'macho'
    }
    movies.forEach((e) => {
      if (c.rp == e.rp && c.rp != "") {
        errores = true;
        descerror = 'El RP ' + c.rp + ' ya se encuentra asociado a un animal';
      }
    });
    //}
    if (errores) {
      console.log('DEBUG guardarCria() - validación RP duplicado', { descerror });
      setAlerta({
        show: true,
        titulo: 'Error!',
        mensaje: descerror,
        color: '#DD6B55'
      });
      setLoading(false);
    } else {
      setCria(cria => [...cria, c]);
      console.log('DEBUG guardarCria() - cría agregada a estado', { criaAgregada: c });
      setLoading(false);
      setModal(false);
    }
    //limpio el form
    formCria.setFieldValue('rp', '');
    formCria.setFieldValue('sexo', 'Hembra');
    setValueSexo('Hembra');
    formCria.setFieldValue('peso', '');
    formCria.setFieldValue('tratamiento', '');
    formCria.setFieldValue('foto', '');
    formCria.setFieldValue('obs', '');

  }
  function cambiarFecha(event, date) {
    console.log('DEBUG cambiarFecha()', { eventType: event && event.type, date });
    const currentDate = date;
    setShowFecha(false);
    setFecha(currentDate);
    formParto.handleChange('fecha')
  };
  const handlever = () => {
    setShowFecha(true);
  }
  let texto = format(fecha, 'yyyy-MM-dd');

  const containerStyle = { zIndex: 2000 };
  const containerStyle2 = { zIndex: 1000 };
  const containerCriaSexo = { zIndex: 2000 };
  const containerCriaCalostro = { zIndex: 1000 };

  const [openSexo, setOpenSexo] = useState(false);
  const [valueSexo, setValueSexo] = useState('Hembra');
  const [itemsSexo, setItemsSexo] = useState([
    { value: 'Hembra', label: 'HEMBRA' },
    { value: 'Macho', label: 'MACHO' },
    { value: 'Macho Muerto', label: 'MACHO MUERTO' },
    { value: 'Hembra Muerta', label: 'HEMBRA MUERTA' },
  ]);

  const [openCalostro, setOpenCalostro] = useState(false);
  const [valueCalostro, setValueCalostro] = useState(formCria.values.tratamiento);
  const [itemsCalostro, setItemsCalostro] = useState([
    { value: 'Calostro Madre', label: 'CALOSTRO MADRE' },
    { value: 'Calostro Congelado', label: 'CALOSTRO CONGELADO' },
  ]);
  const tomarFoto = async () => {
    console.log('📸 Intentando tomar foto...');
    if (camRef.current) {
      try {
        let photo;
        if (camRef.current.takePictureAsync) {
          photo = await camRef.current.takePictureAsync({ quality: 0.7 });
        } else if (camRef.current.takePhotoAsync) {
          photo = await camRef.current.takePhotoAsync({ quality: 0.7 });
        } else if (camRef.current.takePhoto) {
          photo = await camRef.current.takePhoto({ quality: 0.7 });
        } else {
          throw new Error('API de captura no disponible en camRef');
        }
        const uri = photo?.uri || photo?.path || null;
        if (uri) {
          setFoto(uri);
          formCria.setFieldValue('foto', uri);
        }
        setShow(false);
      } catch (error) {
        console.log('❌ Error al tomar la foto:', error);
        Alert.alert('Error', 'No se pudo tomar la foto.');
      }
    }
  };

  // 📸 Detectar cámara compatible como en RegistrarRecepcion
  const cameraBackType = (CameraType && CameraType.back)
    || (Camera && Camera.Constants && Camera.Constants.Type && Camera.Constants.Type.back)
    || 'back';

  const CameraComponent = CameraView || Camera;

  return (
    <View style={styles.container}>
      {loadingParto && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#1b829b" />
            <Text style={styles.loadingText}>Registrando parto...</Text>
            <Text style={styles.loadingSubText}>Por favor, no cierre la pantalla.</Text>
          </View>
        </View>
      )}
      <InfoAnimal animal={animal} />

      <View style={styles.form}>
        <ScrollView>
          <Text style={styles.texto}>FECHA:</Text>

          <TouchableHighlight style={styles.calendario} onPress={handlever}>
            <View>
              <Text style={styles.textocalendar}>{texto}</Text>
            </View>
          </TouchableHighlight>

          {showfecha && (
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
                },
              }}
            />
          )}

          <View style={containerStyle}>
            <Text style={styles.texto}>TIPO:</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setOpenTipoParto(true)}
            >
              <Text style={styles.selectorText}>
                {formParto.values.tipo || 'SELECCIONAR TIPO'}
              </Text>
              <Icon name="chevron-down" size={15} color="#555" />
            </TouchableOpacity>

            <Modal
              isVisible={openTipoParto}
              onBackdropPress={() => setOpenTipoParto(false)}
              style={styles.modalStyle}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>TIPO DE PARTO</Text>

                <ScrollView>
                  {options.map(item => (
                    <TouchableOpacity
                      key={item.value}
                      style={styles.optionItem}
                      onPress={() => {
                        formParto.setFieldValue('tipo', item.value);
                        setOpenTipoParto(false);
                      }}
                    >
                      <Text style={styles.optionText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </Modal>

          </View>

          <View style={containerStyle2}>
            <Text style={styles.texto}>TRATAMIENTO:</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setOpenTratParto(true)}
            >
              <Text style={styles.selectorText}>
                {formParto.values.tratamiento || 'SELECCIONAR TRATAMIENTO'}
              </Text>
              <Icon name="chevron-down" size={15} color="#555" />
            </TouchableOpacity>

            <Modal
              isVisible={openTratParto}
              onBackdropPress={() => setOpenTratParto(false)}
              style={styles.modalStyle}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>TRATAMIENTO</Text>

                <ScrollView>
                  {tratamientoOptions.map(item => (
                    <TouchableOpacity
                      key={item.value}
                      style={styles.optionItem}
                      onPress={() => {
                        formParto.setFieldValue('tratamiento', item.value);
                        setOpenTratParto(false);
                      }}
                    >
                      <Text style={styles.optionText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </Modal>

          </View>

          <View>
            <Text style={styles.texto}>OBSERVACIONES:</Text>
            <TextInput
              style={styles.entrada}
              onChangeText={(value) => formParto.setFieldValue('obs', value)}
              value={formParto.values.obs}
            />
          </View>

          <Text></Text>

          {cria.length < 2 && (
            <Button
              title="  AGREGAR CRIA"
              icon={<Icon name="plus-square" size={35} color="#3390FF" />}
              type="outline"
              onPress={() => cerrar()}
            />
          )}

          {cria.length != 0 && (
            <>
              <Text style={styles.texto}>CRIAS:</Text>
              {cria.map((item, index) => (
                <View key={item.id}>
                  <CriaItem data={item} cria={cria} setCria={setCria} />
                  {index < cria.length - 1 && <Separator />}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>

      <Button
        title="  ACEPTAR"
        icon={<Icon name="check-square" size={35} color="white" />}
        onPress={formParto.handleSubmit}
      />

      <Modal animationType="fade" transparent={true} visible={modal}>
        {loading ? (
          <ActivityIndicator size="large" color="#1b829b" />
        ) : (
          <View style={styles.center}>
            <View style={styles.content}>
              <ScrollView>
                <View>
                  <View style={styles.columnas}>
                    <View style={styles.colizq}>
                      <Text style={styles.header}>DATOS DE LA CRIA</Text>
                    </View>
                    <View style={styles.colder}>
                      <Button
                        onPress={() => setModal(false)}
                        type="clear"
                        icon={<Icon name="window-close" size={30} color="#3390FF" />}
                      />
                    </View>
                  </View>

                  <Text style={styles.texto}>SEXO:</Text>
                  <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={() => setOpenSexo(true)}
                  >
                    <Text style={styles.selectorText}>
                      {itemsSexo.find(i => i.value === valueSexo)?.label || 'SELECCIONAR SEXO'}
                    </Text>
                    <Icon name="chevron-down" size={15} color="#555" />
                  </TouchableOpacity>

                  <Modal
                    isVisible={openSexo}
                    onBackdropPress={() => setOpenSexo(false)}
                    style={styles.modalStyle}
                  >
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>SELECCIONAR SEXO</Text>
                      <ScrollView style={styles.listContainer}>
                        {itemsSexo.map((item) => (
                          <TouchableOpacity
                            key={item.value}
                            style={styles.optionItem}
                            onPress={() => {
                              setValueSexo(item.value);
                              formCria.setFieldValue('sexo', item.value);
                              setOpenSexo(false);
                            }}
                          >
                            <Text style={styles.optionText}>{item.label}</Text>
                            {valueSexo === item.value && (
                              <Icon name="check" size={20} color="#1b829b" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Button
                        title="CERRAR"
                        onPress={() => setOpenSexo(false)}
                        buttonStyle={styles.closeButton}
                        containerStyle={{ width: '100%', marginTop: 10 }}
                      />
                    </View>
                  </Modal>

                  <Text style={styles.texto}>RP:</Text>
                  <TextInput
                    style={styles.entrada}
                    onChangeText={formCria.handleChange('rp')}
                  />
                  {formCria.errors.rp ? (
                    <Text style={styles.error}>{formCria.errors.rp}</Text>
                  ) : null}

                  <Text style={styles.texto}>PESO:</Text>
                  <TextInput
                    style={styles.entrada}
                    onChangeText={formCria.handleChange('peso')}
                    keyboardType="numeric"
                  />
                  {formCria.errors.peso ? (
                    <Text style={styles.error}>{formCria.errors.peso}</Text>
                  ) : null}

                  <Text style={styles.texto}>CALOSTRO:</Text>
                  <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={() => setOpenCalostro(true)}
                  >
                    <Text style={styles.selectorText}>
                      {itemsCalostro.find(i => i.value === valueCalostro)?.label || 'SELECCIONAR CALOSTRO'}
                    </Text>
                    <Icon name="chevron-down" size={15} color="#555" />
                  </TouchableOpacity>

                  <Modal
                    isVisible={openCalostro}
                    onBackdropPress={() => setOpenCalostro(false)}
                    style={styles.modalStyle}
                  >
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>SELECCIONAR CALOSTRO</Text>
                      <ScrollView style={styles.listContainer}>
                        {itemsCalostro.map((item) => (
                          <TouchableOpacity
                            key={item.value}
                            style={styles.optionItem}
                            onPress={() => {
                              setValueCalostro(item.value);
                              formCria.setFieldValue('tratamiento', item.value);
                              setOpenCalostro(false);
                            }}
                          >
                            <Text style={styles.optionText}>{item.label}</Text>
                            {valueCalostro === item.value && (
                              <Icon name="check" size={20} color="#1b829b" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Button
                        title="CERRAR"
                        onPress={() => setOpenCalostro(false)}
                        buttonStyle={styles.closeButton}
                        containerStyle={{ width: '100%', marginTop: 10 }}
                      />
                    </View>
                  </Modal>
                </View>

                <View>
                  <Text style={styles.texto}>OBSERVACIONES:</Text>
                  <TextInput
                    style={styles.entrada}
                    onChangeText={formCria.handleChange('obs')}
                    value={formCria.values.obs}
                  />
                </View>

                <Text></Text>

                <View style={styles.foto}>
                  {!formCria.values.foto ? (
                    <Button
                      title="  TOMAR FOTO"
                      icon={<Icon name="camera" size={35} color="#3390FF" />}
                      type="outline"
                      onPress={() => setShow(true)}
                    />
                  ) : (
                    <>
                      <View style={styles.vistaMiniatura}>
                        <Image
                          style={styles.miniatura}
                          source={{ uri: formCria.values.foto }}
                        />
                      </View>
                      <Button
                        title="  ELIMINAR FOTO"
                        icon={<Icon name="trash" size={35} color="#3390FF" />}
                        type="outline"
                        onPress={() => eliminarFoto()}
                      />
                    </>
                  )}
                </View>

                {formCria.errors.foto ? (
                  <Text style={styles.error}>{formCria.errors.foto}</Text>
                ) : null}

                <Text></Text>
              </ScrollView>

              <Button
                title="  ACEPTAR"
                style={styles.boton}
                icon={<Icon name="check-square" size={35} color="white" />}
                onPress={formCria.handleSubmit}
              />

              <Text></Text>
            </View>
          </View>
        )}

        {/* Modal de Cámara */}
        <NativeModal visible={show} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShow(false)}>
          {!permisos ? (
            <View
              style={[styles.camara, { justifyContent: 'center', alignItems: 'center' }]}
            >
              <Text style={{ color: '#fff' }}>
                No hay permisos para usar la cámara
              </Text>
            </View>
          ) : CameraComponent ? (
            CameraView ? (
              <CameraView
                style={styles.camara}
                facing={cameraBackType}
                ref={camRef}
              />
            ) : (
              <Camera style={styles.camara} type={cameraBackType} ref={camRef} />
            )
          ) : (
            <View
              style={[styles.camara, { justifyContent: 'center', alignItems: 'center' }]}
            >
              <Text style={{ color: '#fff' }}>Cámara no disponible</Text>
            </View>
          )}

          <View style={styles.botoneraCamara}>
            <TouchableOpacity
              style={styles.botonCamara}
              onPress={() => {
                console.log('📸 Cierre manual del modal de cámara');
                setShow(false);
              }}
            >
              <Text style={styles.botonTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botonCamara} onPress={tomarFoto}>
              <Text style={styles.botonTexto}>Tomar Foto</Text>
            </TouchableOpacity>
          </View>


        </NativeModal>
      </Modal>
      {/* Modal de Alerta - estilo igual a RegistrarTratamiento */}
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
                if (alerta.vuelve) navigation.goBack();
              }}
              buttonStyle={{ backgroundColor: alerta.color, marginTop: 10 }}
            />
          </View>
        </Modal>
      )}

    </View>
  );

}

const Separator = () => <View style={{ flex: 1, height: 1, backgroundColor: '#399dad' }}></View>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',


  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
  },
  loadingCard: {
    width: '80%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  loadingSubText: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
    width: '100%',
    marginTop: 10,
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
    marginTop: 5,
    marginLeft: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2980B9'
  },
  error: {
    color: 'red',
    fontSize: 13,
    marginTop: 5,
    textAlign: 'center',

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
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#333',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,

  },
  boton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingTop: 5,
  },
  center: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  content: {
    backgroundColor: '#eee',
    flex: 1,
    margin: 20,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 15,

  },
  alertaModal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  columnas: {
    flex: 1,
    flexDirection: 'row'
  },
  colder: {
    flex: 1,
  },
  colizq: {
    marginTop: 2,
    flex: 3,
  },
  camara: {
    flex: 1
  },
  modalCamara: {
    flex: 1,
    backgroundColor: '#000',
  },
  botoneraCamara: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#111',
  },
  botonCamara: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  botonTexto: {
    fontWeight: 'bold',
  },
  miniatura: {
    width: 200,
    height: 200,
    borderColor: 'white',
    borderWidth: 1,


  },
  vistaMiniatura: {
    alignContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
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


    alertaContainer: {
      backgroundColor: '#fff',
      padding: 25,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 10,
      borderWidth: 1,
      borderColor: '#F3F4F6'
    },
    alertaContainerSuccess: {
      borderColor: '#A7F3D0',
      backgroundColor: '#ECFDF5'
    },
    alertaTitulo: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
      color: '#111827',
    },
    alertaTituloSuccess: {
      color: '#065F46'
    },
    alertaMensaje: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
      color: '#374151',
      paddingHorizontal: 8
    },
    alertaBoton: {
      backgroundColor: '#1b829b',
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: 10,
    },
    alertaBotonSuccess: {
      backgroundColor: '#10B981'
    },
    alertaBotonTexto: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    alertaIconWrapperSuccess: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#D1FAE5',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
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
