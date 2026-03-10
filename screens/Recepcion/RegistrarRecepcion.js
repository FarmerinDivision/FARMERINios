import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Modal as NativeModal,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraType, CameraView, useCameraPermissions, requestCameraPermissionsAsync } from 'expo-camera';
import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import firebase from '../../database/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { es as localeEs } from 'date-fns/locale';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { safeStorageUpload } from '../../database/firebaseAuthHelper';


export default function RegistrarRecepcion() {
  const route = useRoute();
  const navigation = useNavigation();
  const { usuario, tambo, usuarioUid: usuarioUidParam } = route.params || {};

  const [permisos, setPermisos] = useState(null);
  const [show, setShow] = useState(false);
  const [hba, setHba] = useState('');
  const [foto, setFoto] = useState(null);
  const camRef = useRef(null);
  const [feedbackModal, setFeedbackModal] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null,
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Usuario autenticado (si existe)
  const [authUser, setAuthUser] = useState(() => firebase.autenticacion?.currentUser || null);
  const [storedUid, setStoredUid] = useState(null);

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

  const usuarioNombre = typeof usuario === 'string' ? usuario : usuario?.nombre || '';
  const getActiveUid = () =>
    authUser?.uid ||
    usuarioUidParam ||
    firebase.autenticacion?.currentUser?.uid ||
    storedUid ||
    null;

  // Verificación de datos obligatorios
  if (!tambo || (!usuarioNombre && !usuarioUidParam)) {
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
        const ask = requestCameraPermissionsAsync || (Camera && Camera.requestCameraPermissionsAsync);
        if (!ask) {
          setPermisos(false);
          return;
        }
        const { status } = await ask();
        setPermisos(status === 'granted');
      } catch (e) {
        setPermisos(false);
      }
    })();

    // Escuchar cambios de autenticación de Firebase
    const unsubscribe = firebase.autenticacion.onAuthStateChanged((user) => {
      setAuthUser(user || null);
    });

    // Cargar UID guardado en AsyncStorage (sesión recordada)
    AsyncStorage.getItem('usuario')
      .then((uid) => {
        if (uid) {
          console.log('💾 UID desde AsyncStorage (RegistrarRecepcion):', uid);
          setStoredUid(uid);
        }
      })
      .catch((err) => {
        console.log('⚠️ Error leyendo UID de AsyncStorage en RegistrarRecepcion:', err);
      });

    return () => {
      unsubscribe && unsubscribe();
    };
  }, []);

  const tomarFoto = async () => {
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
        if (uri) setFoto(uri);
        setShow(false);
      } catch (error) {
        Alert.alert('Error', 'No se pudo tomar la foto.');
      }
    }
  };

  // Determinar tipo de cámara compatible con la versión instalada
  const cameraBackType = (CameraType && CameraType.back)
    || (Camera && Camera.Constants && Camera.Constants.Type && Camera.Constants.Type.back)
    || 'back';

  const CameraComponent = CameraView || Camera;
  const openFeedbackModal = ({ type, title, message, onConfirm }) => {
    setFeedbackModal({
      visible: true,
      type,
      title,
      message,
      onConfirm: onConfirm || null,
    });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal((prev) => {
      const callback = prev.onConfirm;
      if (typeof callback === 'function') {
        setTimeout(callback, 0);
      }
      return { ...prev, visible: false, onConfirm: null };
    });
  };


  async function registrarToro(hba) {
    try {
      const snap = await firebase.db
        .collection('macho')
        .where('idtambo', '==', tambo.id)
        .where('hba', '==', hba)
        .get();

      if (snap.empty) {
        await firebase.db.collection('macho').add({
          idtambo: tambo.id,
          cat: 'toro',
          hba: hba,
        });
      }
    } catch (error) {
      console.log('❌ Error registrando toro:', error);
    }
  }

  const guardar = async () => {
    if (!detalle.trim()) {
      Alert.alert("Campo obligatorio", "Debe completar el detalle.");
      return;
    }

    if (tipo === 'Semen' && (!hba || hba.trim() === '')) {
      Alert.alert(
        'Campo obligatorio',
        'Debe ingresar el HBA cuando el tipo es Semen.'
      );
      return;
    }

    const fecha = new Date();
    const fdate = fechaRemito; // fecha de evento seleccionada en el datepicker
    let obsFinal = detalle;
    if (tipo === 'Semen') {
      registrarToro(hba);
      obsFinal = `${detalle} - HBA: ${hba}`;
    }

    const nuevaRecepcion = {
      fecha: fecha,
      fechaRemito: fdate,
      tipo: tipo,
      obs: obsFinal,
      visto: false,
      usuario: usuarioNombre,
      idtambo: tambo.id,
    };

    try {
      const docRef = await firebase.db
        .collection('tambo')
        .doc(tambo.id)
        .collection('recepcion')
        .add(nuevaRecepcion);

      let avisoFoto = null;
      if (foto) {
        setUploadingPhoto(true);
        const nombreFoto = `${docRef.id}.jpg`;
        try {
          const response = await fetch(foto);
          const blob = await response.blob();
          const ref = firebase.almacenamiento
            .ref()
            .child(`${tambo.id}/recepciones/${nombreFoto}`);
          const uid = getActiveUid();

          if (!uid) {
            avisoFoto = 'No tienes sesión iniciada. La foto quedó guardada solo en el dispositivo.';
            await docRef.update({ fotoLocalUri: foto, fotoStatus: 'local' });
          } else {
            try {
              await safeStorageUpload(ref, blob, { contentType: 'image/jpeg' });
              await docRef.update({ foto: nombreFoto, fotoStatus: 'uploaded' });
            } catch (e) {
              console.log('Error final al subir foto (safeStorageUpload):', e.message);
              avisoFoto = 'No se pudo subir la foto por permisos o conexión. Se guardó localmente.';
              await docRef.update({ fotoLocalUri: foto, fotoStatus: 'local' });
            }
          }
        } finally {
          setUploadingPhoto(false);
        }
      }

      const mensaje = avisoFoto ? `Recepción registrada. ${avisoFoto}` : 'Recepción registrada con éxito.';
      openFeedbackModal({
        type: 'success',
        title: 'Recepción registrada',
        message: mensaje,
        onConfirm: () => navigation.goBack(),
      });
    } catch (error) {
      openFeedbackModal({
        type: 'error',
        title: 'Error al guardar',
        message: 'No se pudo guardar la recepción.',
      });
    }
  };

  const handleRetomarFoto = () => {
    setFoto(null);
    if (permisos) {
      setShow(true);
    } else {
      Alert.alert("Permiso denegado", "No se puede acceder a la cámara.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>FECHA REMITO:</Text>
          <TouchableOpacity style={styles.dateField} onPress={handleVer} activeOpacity={0.8}>
            <Icon name="calendar" size={18} color="#6c757d" style={styles.dateIcon} />
            <Text style={styles.dateText}>{textoFecha}</Text>
            <Icon name="chevron-down" size={16} color="#6c757d" style={styles.dateChevron} />
          </TouchableOpacity>

          <NativeModal visible={showFecha} transparent animationType="fade">
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
          </NativeModal>

          <Text style={styles.label}>TIPO:</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setOpenTipo(true)}
          >
            <Text style={styles.selectorText}>
              {itemsTipo.find(i => i.value === tipo)?.label || 'SELECCIONAR TIPO'}
            </Text>
            <Icon name="chevron-down" size={15} color="#555" />
          </TouchableOpacity>

          <Modal
            isVisible={openTipo}
            onBackdropPress={() => setOpenTipo(false)}
            style={styles.modalStyle}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>SELECCIONAR TIPO</Text>
              <ScrollView style={styles.listContainer}>
                {itemsTipo.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={styles.optionItem}
                    onPress={() => {
                      setTipo(item.value);
                      setOpenTipo(false);
                    }}
                  >
                    <Text style={styles.optionText}>{item.label}</Text>
                    {tipo === item.value && (
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

          {tipo === 'Semen' && (
            <>
              <Text style={styles.label}>HBA:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingrese HBA"
                value={hba}
                onChangeText={setHba}
              />
            </>
          )}

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
            <>
              <Image source={{ uri: foto }} style={styles.foto} />
              <Button
                title="ELIMINAR Y TOMAR OTRA"
                icon={<Icon name="trash" size={22} color="#fff" />}
                buttonStyle={[styles.boton, styles.botonEliminar]}
                onPress={handleRetomarFoto}
              />
            </>
          ) : (
            <Text style={styles.placeholder}>No se ha tomado una foto</Text>
          )}

          {!foto && (
            <Button
              title="TOMAR FOTO"
              icon={<Icon name="camera" size={25} color="#fff" />}
              buttonStyle={styles.boton}
              onPress={() => {
                if (permisos) {
                  setShow(true);
                } else {
                  Alert.alert("Permiso denegado", "No se puede acceder a la cámara.");
                }
              }}
            />
          )}
        </ScrollView>
      </View>

      <Button
        title="  GUARDAR RECEPCIÓN"
        icon={<Icon name="save" size={25} color="#fff" />}
        buttonStyle={[styles.boton, { backgroundColor: '#28a745', marginTop: 15 }]}
        onPress={guardar}
      />

      {/* Modal de Cámara */}
      <NativeModal visible={show} animationType="slide">
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
      </NativeModal>

      {/* Modal de carga de foto */}
      <NativeModal visible={uploadingPhoto} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadCard}>
            <ActivityIndicator size="large" color="#0d6efd" />
            <Text style={styles.uploadText}>Subiendo foto...</Text>
          </View>
        </View>
      </NativeModal>

      <NativeModal
        visible={feedbackModal.visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.feedbackOverlay}>
          <View
            style={[
              styles.feedbackCard,
              feedbackModal.type === 'success'
                ? styles.feedbackSuccess
                : styles.feedbackError,
            ]}
          >
            <View style={styles.feedbackIconWrap}>
              <Icon
                name={feedbackModal.type === 'success' ? 'check-circle' : 'exclamation-circle'}
                size={48}
                color={feedbackModal.type === 'success' ? '#28a745' : '#dc3545'}
              />
            </View>
            <Text style={styles.feedbackTitle}>{feedbackModal.title}</Text>
            <Text style={styles.feedbackMessage}>{feedbackModal.message}</Text>
            <TouchableOpacity style={styles.feedbackButton} onPress={closeFeedbackModal}>
              <Text style={styles.feedbackButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </NativeModal>
    </View>
  );
}

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
    margin: 15,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 15
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
    fontSize: 16,
    color: '#444',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    minHeight: 50,
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
    borderRadius: 8,
    paddingVertical: 15,
  },
  botonEliminar: {
    backgroundColor: '#dc3545',
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
  uploadOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  uploadCard: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  uploadText: {
    marginTop: 12,
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
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
  feedbackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  feedbackCard: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  feedbackSuccess: {
    borderTopWidth: 4,
    borderTopColor: '#28a745',
  },
  feedbackError: {
    borderTopWidth: 4,
    borderTopColor: '#dc3545',
  },
  feedbackIconWrap: {
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  feedbackMessage: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 24,
  },
  feedbackButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  feedbackButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
