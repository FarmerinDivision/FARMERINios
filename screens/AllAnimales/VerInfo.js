import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, View, Text, FlatList, Modal, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';


export default function ({ setShowTambos, showTambos, data }) {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();


  return (
    <>
      <Modal
        animationType='fade'
        transparent={true}
        visible={showTambos}
      >
        <TouchableWithoutFeedback onPress={() => {
          setShowTambos(false)
        }}>
          <View style={styles.center}>

            <View style={styles.content}>

              {loading ?
                <>
                  <View style={styles.header}>
                    <Text style={styles.text2}>CARGANDO...</Text>
                  </View>
                  <ActivityIndicator size="large" color='#1b829b' />
                </>
                :
                <>
                  <View style={styles.header}>
                    <Text style={styles.text2}>RP: {data.rp} - ERP: {data.erp} </Text>
                  </View>

                  <View style={styles.info}>
                    <Text style={styles.textoinfo}> ESTADO PRODUCTIVO: {data.estpro} </Text>
                    <Text style={styles.textoinfo}> ESTADO REPRODUCTIVO: {data.estrep} </Text>
                    <Text style={styles.textoinfo}> ULT. SERVICIO: {data.fservicio} </Text>
                    <Text style={styles.textoinfo}> ULT. PARTO: {data.fparto} </Text>
                    <Text style={styles.textoinfo}> INGRESO: {data.ingreso} </Text>
                    <Text style={styles.textoinfo}> SERVICIOS REALIZADOS: {data.nservicio} </Text>
                    <View style={styles.textoinfo2}>
                      <Text style={styles.textoinfo}> RACION: {data.racion} </Text>
                      <Text style={styles.textoinfo}> RODEO: {data.rodeo} </Text>
                      <Text style={styles.textoinfo}> GRUPO: {data.grupo} </Text>
                    </View>
                  </View>
                </>
              }
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>

  );
}



const styles = StyleSheet.create({

  center: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '85%',
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    backgroundColor: '#2980B9',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  text2: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  info: {
    marginTop: 20,
  },
  textoinfo: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  textoinfo2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginVertical: 8,
  },
  backButton: {
    backgroundColor: '#2980B9',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },

});
