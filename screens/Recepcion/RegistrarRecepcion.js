import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Modal,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { Camera, CameraType, CameraView, useCameraPermissions, requestCameraPermissionsAsync } from 'expo-camera';
import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import firebase from '../../database/firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { es as localeEs } from 'date-fns/locale';

export default function RegistrarRecepcion() {
  const route = useRoute();
  const navigation = useNavigation();
  const { usuario } = route.params;
  const { tambo } = route.params;

  const [permisos, setPermisos] = useState(null);
  const [show, setShow] = useState(false);
  const [foto, setFoto] = useState(null);
  const camRef = useRef(null);
  const [alerta, setAlerta] = useState({
    show: false,
    titulo: '',
    mensaje: '',
    color: '#DD6B55',
    vuelve: false,
  });

  // Usuario autenticado (si existe)
  const [authUser, setAuthUser] = useState(null);

  const [tipo, setTipo] = useState('Racion');
  const [openTipo, setOpenTipo] = useState(false);
  const [itemsTipo, setItemsTipo] = useState([
    { label: 'RACION', value: 'Racion' },
    { label: 'ART. LIMPIEZA', value: 'Art. Limpieza' },
    { label: 'ART. VETERINARIA', value: 'Art. Veterinaria' },
    { label: 'SEMEN', value: 'Semen' },
  ]);

  const [detalle, setDetalle] = useState('');

  // Fecha remito (UI)
  const [showFecha, setShowFecha] = useState(false);
  const [fechaRemito, setFechaRemito] = useState(new Date());
  const [fechaTemporal, setFechaTemporal] = useState(new Date());
  const [textoFecha, setTextoFecha] = useState(
    format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: localeEs })
  );

  const handleVer = () => {
    setFechaTemporal(fechaRemito);
    setShowFecha(true);
  };
  const cambiarFecha = (_, selectedDate) => {
    const nextDate = selectedDate || fechaTemporal;
    setFechaTemporal(nextDate);
  };
  const confirmarFecha = () => {
    setFechaRemito(fechaTemporal);
    try {
      setTextoFecha(
        format(fechaTemporal, "dd 'de' MMMM 'de' yyyy", { locale: localeEs })
      );
    } catch { }
    setShowFecha(false);
  };
  const cancelarFecha = () => {
    setShowFecha(false);
  };

  // Debug para verificar si llegan los datos
  console.log('📦 route.params:', route.params);
  console.log('🐄 tambo:', tambo);
  console.log('👤 usuario:', usuario);

  // Verificación de datos obligatorios
  if (!tambo || !usuario) {
    return (
      <View style={styles.centeredView}>
        <Text style={{ color: 'red', fontSize: 16, textAlign: 'center' }}>
          ❌ FALTAN DATOS DE USUARIO O TAMBO
        </Text>
      </View>
    );
  }

  useEffect(() => {
    (async () => {
      try {
        console.log('📸 Solicitando permisos de cámara...');
        const ask = requestCameraPermissionsAsync || (Camera && Camera.requestCameraPermissionsAsync);
        if (!ask) {
          console.log('⚠️ API de permisos no disponible en esta versión de expo-camera');
          setPermisos(false);
          return;
        }
        const { status } = await ask();
        const granted = status === 'granted';
        console.log('📸 Permisos de cámara:', status);
        setPermisos(granted);
      } catch (e) {
        console.log('❌ Error solicitando permisos de cámara:', e);
        setPermisos(false);
      }
    })();
    // Suscribirse al estado de autenticación
    const unsubscribe = firebase.autenticacion.onAuthStateChanged((user) => {
      setAuthUser(user || null);
      console.log('👤 Auth state cambiado. UID:', user?.uid || null);
    });
    return () => {
      unsubscribe && unsubscribe();
    };
  }, []);

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
        console.log('📸 Foto tomada:', uri, photo);
        if (uri) setFoto(uri);
        setShow(false);
        console.log('📸 Modal de cámara cerrado tras tomar foto');
      } catch (error) {
        console.log('❌ Error al tomar la foto:', error);
        Alert.alert('Error', 'No se pudo tomar la foto.');
      }
    } else {
      console.log('⚠️ camRef no está disponible');
    }
  };

  // Determinar tipo de cámara compatible con la versión instalada
  const cameraBackType = (CameraType && CameraType.back)
    || (Camera && Camera.Constants && Camera.Constants.Type && Camera.Constants.Type.back)
    || 'back';
  console.log('📸 Tipos disponibles => CameraType.back:', CameraType?.back, ' | Camera.Constants.Type.back:', Camera?.Constants?.Type?.back, ' | usado:', cameraBackType);

  const CameraComponent = CameraView || Camera;
  const guardar = async () => {
    if (!detalle.trim()) {
      setAlerta({
        show: true,
        titulo: '¡ATENCIÓN!',
        mensaje: 'Debe completar el detalle.',
        color: '#DD6B55',
        vuelve: false,
      });
      return;
    }

    const fecha = new Date();
    const fdate = fechaRemito; // fecha del remito seleccionada
    const nuevaRecepcion = {
      fecha: fecha,
      fechaRemito: fdate,
      tipo: tipo,
      obs: detalle,
      visto: false,
      usuario: usuario,
    };

    try {
      const docRef = await firebase.db
        .collection('tambo')
        .doc(tambo.id)
        .collection('recepcion')
        .add(nuevaRecepcion);

      let avisoFoto = null;

      if (foto) {
        const nombreFoto = `${docRef.id}.jpg`;
        const response = await fetch(foto);
        const blob = await response.blob();
        const ref = firebase.almacenamiento
          .ref()
          .child(`${tambo.id}/recepciones/${nombreFoto}`);

        const uid = authUser?.uid || firebase.autenticacion?.currentUser?.uid || null;

        if (!uid) {
          avisoFoto = 'No tienes sesión iniciada. La foto quedó guardada solo en el dispositivo.';
          await docRef.update({ fotoLocalUri: foto, fotoStatus: 'local' });
        } else {
          try {
            await ref.put(blob, { contentType: 'image/jpeg' });
            await docRef.update({ foto: nombreFoto, fotoStatus: 'uploaded' });
          } catch (e) {
            avisoFoto = 'No se pudo subir la foto por permisos. Se guardó localmente.';
            await docRef.update({ fotoLocalUri: foto, fotoStatus: 'local' });
          }
        }
      }

      const mensaje = avisoFoto
        ? `Recepción registrada. ${avisoFoto}`
        : 'Recepción registrada con éxito.';

      setAlerta({
        show: true,
        titulo: '¡ÉXITO!',
        mensaje: mensaje,
        color: '#3AD577',
        vuelve: true,
      });

    } catch (error) {
      console.log("Error al guardar recepción:", error);
      setAlerta({
        show: true,
        titulo: '¡ERROR!',
        mensaje: 'No se pudo guardar la recepción.',
        color: '#DD6B55',
        vuelve: false,
      });
    }
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.form}>
        <Text style={styles.texto}>FECHA REMITO:</Text>
        <TouchableOpacity style={styles.dateField} onPress={handleVer} activeOpacity={0.8}>
          <Icon name="calendar" size={18} color="#6c757d" style={styles.dateIcon} />
          <Text style={styles.dateText}>{textoFecha}</Text>
          <Icon name="chevron-down" size={16} color="#6c757d" style={styles.dateChevron} />
        </TouchableOpacity>

        <Modal visible={showFecha} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Seleccionar fecha</Text>
              <DateTimePicker
                maximumDate={new Date()}
                mode="date"
                display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                themeVariant={Platform.OS === 'ios' ? 'light' : undefined}
                locale={Platform.OS === 'ios' ? 'es-ES' : undefined}
                value={fechaTemporal}
                onChange={cambiarFecha}
                style={styles.picker}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={cancelarFecha}>
                  <Text style={styles.actionTextCancel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.okBtn]} onPress={confirmarFecha}>
                  <Text style={styles.actionTextOk}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      <Text style={styles.label}>TIPO:</Text>
      <DropDownPicker
        open={openTipo}
        value={tipo}
        items={itemsTipo}
        setOpen={setOpenTipo}
        setValue={setTipo}
        setItems={setItemsTipo}
        placeholder="Seleccionar tipo"
        style={styles.dropdown}
        dropDownDirection="BOTTOM"
        dropDownContainerStyle={{ zIndex: 1000 }}
      />

      <Text style={styles.label}>DETALLE:</Text>
      <TextInput
        style={styles.input}
        placeholder="Escriba el detalle"
        value={detalle}
        onChangeText={setDetalle}
        multiline
      />

      <Text style={styles.label}>FOTO:</Text>
      {foto ? (
        <View style={{ alignItems: 'center' }}>
          <Image source={{ uri: foto }} style={styles.foto} />
          <Button
            title="ELIMINAR FOTO"
            icon={<Icon name="trash" size={18} color="#fff" style={{ marginRight: 8 }} />}
            buttonStyle={styles.btnDeletePhoto}
            titleStyle={{ fontWeight: "bold" }}
            onPress={() => setFoto(null)}
            iconPosition="left"
          />

        </View>
      ) : (
        <Text style={styles.placeholder}>No se ha tomado una foto</Text>
      )}


      <Button
        title="TOMAR FOTO"
        icon={<Icon name="camera" size={25} color="#fff" />}
        buttonStyle={styles.boton}
        onPress={() => {
          if (permisos) {
            console.log('📸 Abriendo modal de cámara');
            setShow(true);
          } else {
            Alert.alert("Permiso denegado", "No se puede acceder a la cámara.");
          }
        }}
      />

      <Button
        title="GUARDAR RECEPCIÓN"
        icon={<Icon name="save" size={25} color="#fff" />}
        buttonStyle={[styles.boton, { backgroundColor: '#28a745' }]}
        onPress={guardar}
      />

      {/* Modal de Cámara */}
      <Modal visible={show} animationType="slide">
        <View style={styles.modalCamara}>
          {CameraComponent ? (
            CameraView ? (
              <CameraView style={styles.camara} facing={cameraBackType} ref={camRef} />
            ) : (
              <Camera style={styles.camara} type={cameraBackType} ref={camRef} />
            )
          ) : (
            <View style={[styles.camara, { justifyContent: 'center', alignItems: 'center' }]}>
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
        </View>
      </Modal>
      {alerta.show && (
        <Modal
          transparent
          animationType="fade"
          visible={alerta.show}
          onRequestClose={() => setAlerta({ ...alerta, show: false })}
        >
          <View style={styles.alertOverlay}>
            <View style={styles.alertBox}>

              <Icon name={alerta.vuelve ? "check-circle" : "times-circle"} size={50} color={alerta.color} />

              <Text style={[styles.alertTitle, { color: alerta.color }]}>
                {alerta.titulo}
              </Text>

              <Text style={styles.alertMessage}>
                {alerta.mensaje}
              </Text>

              <TouchableOpacity
                style={[styles.alertButton, { backgroundColor: alerta.color }]}
                onPress={() => {
                  setAlerta({ ...alerta, show: false });
                  if (alerta.vuelve) navigation.goBack();
                }}
              >
                <Text style={styles.alertButtonText}>ACEPTAR</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  form: {
    marginBottom: 15,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  texto: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dateIcon: {
    marginRight: 10,
  },
  dateText: {
    flex: 1,
    color: '#212529',
    fontSize: 16,
  },
  dateChevron: {
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 6,
    textAlign: 'center',
  },
  picker: {
    alignSelf: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtn: {
    backgroundColor: '#f1f3f5',
  },
  okBtn: {
    backgroundColor: '#0d6efd',
  },
  actionTextCancel: {
    color: '#343a40',
    fontWeight: '600',
  },
  actionTextOk: {
    color: '#fff',
    fontWeight: '600',
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginTop: 5,
    minHeight: 60,
  },
  foto: {
    width: '100%',
    height: 250,
    marginVertical: 10,
    borderRadius: 6,
  },
  placeholder: {
    fontStyle: 'italic',
    color: '#888',
    marginVertical: 10,
  },
  boton: {
    backgroundColor: '#007bff',
    marginTop: 15,
    borderRadius: 6,
    paddingVertical: 12,
  },
  modalCamara: {
    flex: 1,
    backgroundColor: '#000',
  },
  camara: {
    flex: 1,
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
  dropdown: {
    marginTop: 5,
    marginBottom: 15,
    borderColor: '#ccc',
  },
  btnDeletePhoto: {
    backgroundColor: "#dc3545",
    marginTop: 10,
    borderRadius: 6,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    elevation: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  alertMessage: {
    fontSize: 14,
    textAlign: "center",
    marginVertical: 10,
    color: "#333",
  },
  alertButton: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  alertButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },


});
