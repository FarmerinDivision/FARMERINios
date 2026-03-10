import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native'; // Agregar NavigationContainer
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Asegúrate de que esta importación sea correcta
import HomeScreen from '../screens/Home';
import SecadoScreen from '../screens/Secado/Secado';
import PartoScreen from '../screens/Parto/Parto';
import RegsitrarPartoScreen from '../screens/Parto/RegistrarParto';
import RegsitrarAbortoScreen from '../screens/Parto/RegistrarAborto';
import RechazoScreen from '../screens/Rechazo/Rechazo';
import RegsitrarRechazoScreen from '../screens/Rechazo/RegistrarRechazo';
import TactoScreen from '../screens/Tacto/Tacto';
import CeloScreen from '../screens/Celo/Celo';
import RegsitrarCeloScreen from '../screens/Celo/RegistrarCelo';
import ServicioScreen from '../screens/Servicio/Servicio';
import RegistrarServicioScreen from '../screens/Servicio/RegistrarServicio';
import BajaScreen from '../screens/Baja/Baja';
import RegsitrarBajaScreen from '../screens/Baja/RegistrarBaja';
import TratamientoScreen from '../screens/Tratamiento/Tratamiento';
import RegsitrarTratamientoScreen from '../screens/Tratamiento/RegistrarTratamiento';
import ProduccionScreen from '../screens/Produccion/Produccion';
import RegistrarProduccionScreen from '../screens/Produccion/RegistrarProduccion';
import RecepcionScreen from '../screens/Recepcion/Recepcion';
import RegistrarRecepcionScreen from '../screens/Recepcion/RegistrarRecepcion';
import AltaScreen from '../screens/Alta/Alta';
import VaquillonaScreen from '../screens/Vaquillona/Vaquillona';
import AltaVaquillonaScreen from '../screens/AltaVaquillona/AltaVaquillona';

const Stack = createNativeStackNavigator(); // Crear la instancia del stack

export default function NavEventos() {
    return (
        <Stack.Navigator
            initialRouteName="Inicio"
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#4db150',
                    shadowOffset: { width: 1, height: 1 },
                    elevation: 3,
                    borderBottomWidth: 1,
                    borderBottomColor: 'white'
                },
                headerTintColor: '#fff',
                headerBackTitle: 'Atrás',
                header: ({ navigation, route, options, back }) => {
                    const title = options.headerTitle !== undefined ? options.headerTitle : route.name;
                    return (
                        <SafeAreaView style={{ backgroundColor: '#4cb050' }}>
                            <View style={styles.tambo}>
                                <TouchableOpacity
                                    style={styles.botonVolver}
                                    onPress={() => navigation.goBack()}
                                >
                                    <Text style={styles.textBoton}>←</Text>
                                </TouchableOpacity>
                                <Text style={styles.textTambo}>{title}</Text>
                            </View>
                        </SafeAreaView>
                    );
                }
            }}
        >
            <Stack.Screen
                name="Inicio"
                component={HomeScreen}
                options={{ headerTitle: "EVENTOS", headerShown: false }}
            />
            <Stack.Screen
                name="Secado"
                component={SecadoScreen}
                options={{ headerTitle: "SECADO" }}
            />
            <Stack.Screen
                name="Parto"
                component={PartoScreen}
                options={{ headerTitle: "PARTO" }}
            />
            <Stack.Screen
                name="RegistrarParto"
                component={RegsitrarPartoScreen}
                options={{ headerTitle: "REGISTRAR PARTO" }}
            />
            <Stack.Screen
                name="RegistrarAborto"
                component={RegsitrarAbortoScreen}
                options={{ headerTitle: "REGISTRAR ABORTO" }}
            />
            <Stack.Screen
                name="Rechazo"
                component={RechazoScreen}
                options={{ headerTitle: "RECHAZO" }}
            />
            <Stack.Screen
                name="RegistrarRechazo"
                component={RegsitrarRechazoScreen}
                options={{ headerTitle: "REGISTRAR RECHAZO" }}
            />
            <Stack.Screen
                name="Tacto"
                component={TactoScreen}
                options={{ headerTitle: "TACTO" }}
            />
            <Stack.Screen
                name="Celo"
                component={CeloScreen}
                options={{ headerTitle: "CELO" }}
            />
            <Stack.Screen
                name="RegistrarCelo"
                component={RegsitrarCeloScreen}
                options={{ headerTitle: "REGISTRAR CELO" }}
            />
            <Stack.Screen
                name="Servicio"
                component={ServicioScreen}
                options={{ headerTitle: "SERVICIO" }}
            />
            <Stack.Screen
                name="RegistrarServicio"
                component={RegistrarServicioScreen}
                options={{ headerTitle: "REGISTRAR SERVICIO" }}
            />
            <Stack.Screen
                name="Baja"
                component={BajaScreen}
                options={{ headerTitle: "BAJA" }}
            />
            <Stack.Screen
                name="RegistrarBaja"
                component={RegsitrarBajaScreen}
                options={{ headerTitle: "REGISTRAR BAJA" }}
            />
            <Stack.Screen
                name="Tratamiento"
                component={TratamientoScreen}
                options={{ headerTitle: "TRATAMIENTO" }}
            />
            <Stack.Screen
                name="RegistrarTratamiento"
                component={RegsitrarTratamientoScreen}
                options={{ headerTitle: "REGISTRAR TRATAMIENTO" }}
            />
            <Stack.Screen
                name="Produccion"
                component={ProduccionScreen}
                options={{ headerTitle: "PRODUCCION" }}
            />
            <Stack.Screen
                name="RegistrarProduccion"
                component={RegistrarProduccionScreen}
                options={{ headerTitle: "REGISTRAR PRODUCCION" }}
            />
            <Stack.Screen
                name="Recepcion"
                component={RecepcionScreen}
                options={{ headerTitle: "RECEPCION" }}
            />
            <Stack.Screen
                name="RegistrarRecepcion"
                component={RegistrarRecepcionScreen}
                options={{ headerTitle: "REGISTRAR RECEPCION" }}
            />
            <Stack.Screen
                name="Alta"
                component={AltaScreen}
                options={{ headerTitle: "ALTA ANIMAL" }}
            />
            <Stack.Screen
                name="AltaVaquillona"
                component={AltaVaquillonaScreen}
                options={{ headerTitle: "ALTA VAQUILLONA" }}
            />
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
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