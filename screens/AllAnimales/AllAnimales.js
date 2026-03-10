import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
//import 'expo-firestore-offline-persistence';


import firebase from '../../database/firebase';
import ListItem from './ListItem';
import { SearchBar } from 'react-native-elements';
import differenceInDays from 'date-fns/differenceInDays';
import VerInfo from "./VerInfo";
import { MovieContext } from "../Contexto";
import { useRoute } from '@react-navigation/core';

export default ({ navigation }) => {
  const { movies } = useContext(MovieContext)
  const [showTambos, setShowTambos] = useState(false);
  const [seleccionado, setSeleccionado] = useState({});
  const [animales, guardarAnimales] = useState([]);
  const [animalesFilter, guardarAnimalesFilter] = useState([]);
  const [rp, guardarRP] = useState('');
  //const [estado, setEstado] = useState('En Ordeñe');

  const routeAni = useRoute();
  const { animal } = routeAni.params;
  const { tambo } = routeAni.params;
  const { usuario } = routeAni.params;

  //const animalesHome = navigation.getParam('animales');
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const [alerta, setAlerta] = useState({
    show: false,
    titulo: '',
    mensaje: '',
    color: '#DD6B55'
  });

  useEffect(() => {

    //busca los animales que no sean rechazados
    obtenerAnim();
  }, []);

  useEffect(() => {
    guardarAnimalesFilter(animales);
  }, [animales])

  function updateSearch(rp) {
    if (rp) {
      const cond = rp.toLowerCase();
      const filtro = animales.filter(animal => {
        return (
          animal.rp.toString().toLowerCase().includes(cond)
        )
      });
      guardarAnimalesFilter(filtro);
      guardarRP(rp);
    } else {
      // Inserted text is blank
      // Update FilteredDataSource with masterDataSource
      guardarAnimalesFilter(animales);
      guardarRP(rp);
    }

  };

  function obtenerAnim() {
    setLoading(true);
    //Filtro los animales con el estado requerido
    const anProd = movies
    //calculo dias de servicio y lactancia
    const an = anProd.map(a => {

      let d = 0;
      let dl = 0;
      if (a.estrep == "vacia") {

        try {
          d = differenceInDays(Date.now(), new Date(a.fservicio));
          if (isNaN(d)) d = 0;
        } catch (error) {
          d = 0;
        }

      }
      if (a.estpro == "En Ordeñe") {

        try {
          dl = differenceInDays(Date.now(), new Date(a.fparto));
          if (isNaN(dl)) dl = 0;
        } catch (error) {
          d = 0;
        }

      }
      return {
        id: a.id,
        diasServicio: d,
        diasLact: dl,
        ...a
      }

    })
    guardarAnimales(an);
    setLoading(false);
  };

  /* esto es por si vienen los animales en el Redux
  function obtenerAnim() {
    setLoading(true);
    //Filtro los animales con el estado requerido
    const anProd = animales.filter(animal => {
      return (
        animal && (estado.indexOf(animal.estpro) > -1)
      )
    });
    //calculo dias de servicio y lactancia
    const an = anProd.map(a => {

      let d = 0;
      let dl = 0;
      if (a.estrep == "vacia") {

        try {
          d = differenceInDays(Date.now(), new Date(a.fservicio));
          if (isNaN(d)) d = 0;
        } catch (error) {
          d = 0;
        }

      }
      if (a.estpro == "En Ordeñe") {

        try {
          dl = differenceInDays(Date.now(), new Date(a.fparto));
          if (isNaN(dl)) dl = 0;
        } catch (error) {
          d = 0;
        }

      }
      return {
        id: a.id,
        diasServicio: d,
        diasLact: dl,
        ...a
      }

    })
    guardarAnimales(an);
    setLoading(false);
  };
 */
  return (
    <View style={styles.container}>
      <View style={styles.tambo}>

        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.textBoton}>←</Text>
        </TouchableOpacity>

        <Text style={styles.textTambo}>ANIMALES</Text>

      </View>
      <View style={styles.barra}>
        <View style={styles.colbarra}>
          <SearchBar
            placeholder="Buscar por RP"
            onChangeText={updateSearch}
            value={rp}
            lightTheme
            containerStyle={styles.searchContainer}
            inputContainerStyle={styles.searchInput}
          />
        </View>
      </View>
      <View style={styles.listado}>
        {loading || animalesFilter.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#1b829b" />
          </View>
        ) : animalesFilter.length === 0 && !animales.length ? (
          <Text style={styles.alerta}>NO SE ENCONTRARON ANIMALES</Text>
        ) : (
          <FlatList
            data={animalesFilter}
            keyExtractor={(item) => item.id}
            initialNumToRender={100}
            renderItem={({ item }) => (
              <ListItem
                data={item}
                info={() => {
                  setShowTambos(true);
                  setSeleccionado(item);
                }}
              />
            )}
            ItemSeparatorComponent={Separator}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {showTambos && (
        <VerInfo setShowTambos={setShowTambos} showTambos={showTambos} data={seleccionado} />
      )}
    </View>
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 3,
    paddingVertical: 3,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    paddingTop: 5,
  },
  colbarra: {
    flex: 2,
    marginRight: 15,
  },
  colbarra2: {
    flex: 1,
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 10,
    elevation: 5,
    borderWidth: 0,
  },
  searchInput: {
    backgroundColor: '#f1f3f6',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  listado: {
    flex: 1,
    paddingTop: 10,
    borderRadius: 20,
  },
  loadingIndicator: {
    marginTop: 20,
  },
  alerta: {
    backgroundColor: '#FFBF5A',
    fontSize: 16,
    color: '#444',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 10,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  separator: {
    height: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1b829b',
  },
  tambo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4cb050',
    paddingHorizontal: 10,
    height: 55,
    borderRadius: 10
  },

  botonVolver: {
    backgroundColor: '#4cb050',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 10,
  },

  textBoton: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20
  },

  textTambo: {
    flex: 1,
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});