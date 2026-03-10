import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, TouchableOpacity, View, ImageBackground, Text, Image, ActivityIndicator, Button } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import SelectTambo from './SelectTambo';
import { selectTambo } from '../src/reducers/tambo';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from 'react-native-modal';
import firebase from '../database/firebase';
import { MovieContext } from './Contexto'


// MOVIES = animales

const Home = ({ navigation, tambo, selectTambo }) => {
  const [loading, setLoading] = useState(false);
  const [trataLocal, setTrataLocal] = useState([]);
  // no eliminar movies, trata y motivos... bug
  const { movies, setMovies, trata, setTrata, motivosx, setMotivos } = useContext(MovieContext)
  const [animales, guardarAnimales] = useState([]);
  const [showTambos, setShowTambos] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [usuarioID, setUsuarioID] = useState('');

  const [alerta, setAlerta] = useState({
    show: false,
    titulo: '',
    mensaje: '',
    color: '#DD6B55'
  });
  useEffect(() => {

    if (!usuario || usuario == '') {
      buscarUsuario();

    }

    if (!tambo || tambo.id == '0') {
      setShowTambos(true);
    }
  }, []);


  useEffect(() => {
    if (tambo || tambo.id != '0') {
      console.log(tambo)
      obtenerAnim()
      obtenerTratamientos()
      obtenerToros()
      obtenerMotivos()
      obtenerProduccion()
      obtenerRecepcion()
    }
  }, [tambo]);

  useEffect(() => {
    setMovies(animales)
  }, [animales])

  function obtenerAnim() {
    console.log("animales")

    setLoading(true);
    try {
      firebase.db.collection('animal').where('idtambo', '==', tambo.id).where('fbaja', '==', '').get().then(snapshotAnimal)
    } catch (error) {
      setAlerta({
        show: true,
        titulo: '¡ERROR!',
        mensaje: 'NO SE PUEDEN OBTENER LOS ANIMALES',
        color: '#DD6B55'
      });
    }
  }


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

  function obtenerTratamientos() {
    console.log("trata")

    setLoading(true);
    try {
      firebase.db.collection('listado').where('idtambo', '==', tambo.id).get().then(snapshotTratamiento)
    } catch (error) {
      setAlerta({
        show: true,
        titulo: '¡ERROR!',
        mensaje: 'NO SE PUEDEN OBTENER LOS TRATAMIENTOS',
        color: '#DD6B55'
      });
    }
  }
  function snapshotTratamiento(snapshot) {
    const tra = snapshot.docs.map(doc => {
      return {
        ...doc.data()
      }
    })
    setTrata(tra)
    setTrataLocal(tra)
    setLoading(false);

  };
  function obtenerToros() {
    console.log("toros")

    setLoading(true);
    try {
      firebase.db.collection('macho').where('idtambo', '==', tambo.id).where('cat', '==', 'toro').get().then(snaptoro)
    }
    catch (error) {
      setAlerta({
        show: true,
        titulo: '¡ERROR!',
        mensaje: 'NO SE PUEDEN OBTENER LOS TOROS',
        color: '#DD6B55'
      });
    }
  }
  function snaptoro() {
    setLoading(false)
  }
  function obtenerProduccion() {
    console.log("produ")

    setLoading(true);
    try {
      firebase.db.collection('tambo').doc(tambo.id).collection('produccion').orderBy('fecha', 'desc').limit(30).get().then(snapprodu)
    } catch (error) {
      setAlerta({
        show: true,
        titulo: '¡ERROR!',
        mensaje: 'NO SE PUEDE OBTENER LA PRODUCCIÓN',
        color: '#DD6B55'
      });
    }
  }

  function snapprodu() {
    setLoading(false)
  }

  function obtenerRecepcion() {
    console.log("recep")

    setLoading(true);
    try {
      firebase.db.collection('tambo').doc(tambo.id).collection('recepcion').orderBy('fecha', 'desc').limit(30).get().then(snaprecep)
    } catch (error) {
      setAlerta({
        show: true,
        titulo: '¡ERROR!',
        mensaje: 'NO SE PUEDEN OBTENER LAS RECEPCIONES',
        color: '#DD6B55'
      });
    }
  }

  function snaprecep() {
    setLoading(false)
  }

  function obtenerMotivos() {
    console.log("motivos")

    setLoading(true);

    try {
      firebase.db.collection('listado').where('tipo', '==', 'baja').where('idtambo', '==', tambo.id).orderBy('descripcion').get().then(snapshotMotivo)
    } catch (error) {
      setAlerta({
        show: true,
        titulo: '¡ERROR!',
        mensaje: 'NO SE PUEDEN OBTENER LOS MOTIVOS DE BAJA',
        color: '#DD6B55'
      });
    }
  }

  function snapshotMotivo(snapshot) {
    const motivoss = snapshot.docs.map(doc => {
      return {
        ...doc.data()
      }
    })
    setMotivos(motivoss)
    setLoading(false);

  }


  async function buscarUsuario() {

    try {
      AsyncStorage.getItem('nombre').then((keyValue) => {
        setUsuario(keyValue);
      });
    } catch (error) {

      setAlerta({
        show: true,
        titulo: '¡ERROR!',
        mensaje: 'NO SE PUEDE OBTENER EL USUARIO',
        color: '#DD6B55'
      });
      setShowTambos(false);
    }
    try {
      AsyncStorage.getItem('usuario').then((keyValue) => {
        setUsuarioID(keyValue);
      }).then(Sesion);
    } catch (error) {

      console.log(error)
    }
  }


  const Sesion = () => {
    let map = {}
    let num = 0

    tambo.sesiones.map((e) => {
      if (e.id == usuarioID) {
        map = tambo.sesiones.filter((e) => e.id == usuarioID)
        num = Number(e.logueos)
      }
    })

    const obj = {
      id: usuarioID,
      nombre: usuario,
      logueos: num + 1
    }

    function upsert(array, element) { // (1)
      const i = array.findIndex(_element => _element.id === element.id);
      if (i > -1) array[i] = element; // (2)
      else array.push(element);
    }
    const copia = [...tambo.sesiones]
    upsert(copia, obj)
    const objeto = {
      sesiones: copia
    }
    try {
      firebase.db.collection('tambo').doc(tambo.id).update(objeto)
    } catch (e) { console.log(e) }
  }



  return (
    <>
      <ImageBackground
        source={require('../assets/menu3.jpeg')}
        style={styles.imagenfondo}
      >

        <View style={styles.tambo}>
          <TouchableOpacity onLongPress={() => {
            obtenerAnim()
          }}>
            <Text style={styles.textTambo}>{tambo.nombre}</Text>
          </TouchableOpacity>

        </View>
        <View style={styles.container}>
          {loading ?

            <Modal
              animationType='fade'
              transparent={true}
              visible={loading}

            >

              <View style={styles.centerModal}>

                <View style={styles.contentModal}>

                  <>

                    <Text style={styles.text2Modal}>CARGANDO ANIMALES...</Text>

                    <ActivityIndicator size="large" color='#1b829b' />
                  </>

                </View>
              </View>

            </Modal>
            :
            <>

              <View style={styles.containerizq}>

                <TouchableOpacity style={styles.boton} onPress={() => { navigation.push('Servicio', { usuario: usuario, tambo: tambo, estado: ['En Ordeñe', 'seca', 'Vq.p/servicio'] }) }}>
                  <Text style={styles.text1}> SR</Text>
                  <Text style={styles.text}> SERVICIO</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.boton} onPress={() => { navigation.push('Tacto', { usuario: usuario, tambo: tambo, estado: ['En Ordeñe', 'seca', 'Vq.p/servicio'] }) }}>
                  <Text style={styles.text1}> TA</Text>
                  <Text style={styles.text}> TACTO</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.boton} onPress={() => {
                  navigation.navigate('Alta', { usuario: usuario, tambo: tambo })
                }}>
                  <Text style={styles.text1}> AL</Text>
                  <Text style={styles.text}> ALTA</Text>
                </TouchableOpacity>


                <TouchableOpacity style={styles.boton} onPress={() => { navigation.push('Tratamiento', { usuario: usuario, tambo: tambo, tratam: trataLocal }) }}>
                  <Text style={styles.text1}> TR</Text>
                  <Text style={styles.text}> TRAT.</Text>
                </TouchableOpacity>

              </View>


              <View style={styles.containermed} >
                <TouchableOpacity style={styles.boton} onPress={() => { navigation.push('Parto', { usuario: usuario, tambo: tambo, estado: ['En Ordeñe', 'seca', 'Vq.p/servicio'] }) }}>
                  <Text style={styles.text1}> PA</Text>
                  <Text style={styles.text}> PARTO</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.boton} onPress={() => { navigation.push('Celo', { usuario: usuario, tambo: tambo }) }}>
                  <Text style={styles.text1}> CE</Text>
                  <Text style={styles.text}> CELO</Text>
                </TouchableOpacity>


                <TouchableOpacity style={styles.boton} onPress={() => { navigation.push('Baja', { usuario: usuario, tambo: tambo, estado: ['En Ordeñe', 'seca', 'rechazo'] }) }}>
                  <Text style={styles.text1}> BA</Text>
                  <Text style={styles.text}> BAJA</Text>
                </TouchableOpacity>



                <TouchableOpacity style={styles.boton} onPress={() => { navigation.push('Recepcion', { usuario: usuario, tambo: tambo }) }}>
                  <Text style={styles.text1}> RC</Text>
                  <Text style={styles.text}> RECEP.</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.containerder} >

                <TouchableOpacity style={styles.boton} onPress={() => { navigation.push('Secado', { usuario: usuario, tambo: tambo }) }}>
                  <Text style={styles.text1}> SC</Text>
                  <Text style={styles.text}> SECADO</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.boton} onPress={() => { navigation.push('AltaVaquillona', { usuario: usuario, tambo: tambo }) }}>
                  <Text style={styles.text1}> AV</Text>
                  <Text style={styles.text}> ALTA VQ.</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.boton} onPress={() => { navigation.push('Rechazo', { usuario: usuario, tambo: tambo, estado: ['En Ordeñe', 'seca'] }) }}>
                  <Text style={styles.text1}> RE</Text>
                  <Text style={styles.text}> RECHAZO</Text>
                </TouchableOpacity>



                <TouchableOpacity style={styles.boton} onPress={() => { navigation.push('Produccion', { usuario: usuario, tambo: tambo }) }}>
                  <Text style={styles.text1}> PR</Text>
                  <Text style={styles.text}> PROD.</Text>
                </TouchableOpacity>

              </View>
            </>
          }
        </View>
        <View>
          <Text style={styles.textVersion} > Version 4.2.0</Text>
          <Text style={styles.textVersion} > Farmerin Division S.A. - &copy; 2020 </Text>
          <Text style={styles.textVersion}>Developed by Facundo Peralta & Farmerin Team</Text>
        </View>


        {showTambos && <SelectTambo setShowTambos={setShowTambos} showTambos={showTambos} selectTambo={selectTambo} />}
      </ImageBackground>
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
              onPress={() => setAlerta({ ...alerta, show: false })}
              buttonStyle={{ backgroundColor: alerta.color, marginTop: 10 }}
            />
          </View>
        </Modal>
      )}

    </>
  );
}

const Separator = () => <View style={{ flex: 1, height: 1, backgroundColor: '#399dad' }}></View>

const styles = StyleSheet.create({

  imagenfondo: {
    flex: 1,

  },
  container: {
    flex: 8,
    flexDirection: 'row',

  },
  tambo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4cb050',
    paddingHorizontal: 10,
    height: 35,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  textTambo: {
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: "uppercase"

  },

  containerizq: {
    flex: 1,
    alignItems: 'center'
  },
  containermed: {
    flex: 1,
    alignItems: 'center'
  },
  containerder: {
    flex: 1,
    alignItems: 'center'
  },
  boton: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 15,
    padding: 5,
    marginTop: 20,
    width: 80,
    height: 80,
    backgroundColor: '#2980B9',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5,
    //elevation: 3,
    //zIndex: 3

  },
  abajo: {
    flex: 2,
    alignItems: 'center',

  },


  text: {
    color: '#e1e8ee',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold'
  },
  text1: {
    color: '#e1e8ee',
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: -5
  },
  text2: {
    color: '#2980B9',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10

  },

  center: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',

  },
  content: {
    backgroundColor: '#e1e8ee',
    borderWidth: 1,
    borderColor: 'white',
    margin: 20,
    marginTop: 90,
    padding: 5,
    borderRadius: 15,
    height: hp('35%'),
  },
  logo: {
    marginTop: 20,
    marginBottom: 0,
    height: hp('10%'),
    width: wp('80%'),

  },
  text2Modal: {
    color: '#2980B9',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 17

  },

  centerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  contentModal: {
    backgroundColor: '#e1e8ee',
    borderWidth: 1,
    borderColor: 'white',
    margin: 20,
    marginTop: hp('30%'),
    borderRadius: 15,
    height: hp('15%'),


  },
  textVersion: {
    fontSize: 12,
    textAlign: 'center',
    textTransform: "uppercase",
    fontWeight: "bold",
    color: '#F2FDFF',

  },
});

const mapStateToProps = state => {
  return {
    tambo: state.tambo,
  }
}

const mapDispatchToProps = dispatch => ({
  selectTambo: (tambo) => dispatch(selectTambo(tambo)),
})
export default connect(mapStateToProps, mapDispatchToProps)(Home);
