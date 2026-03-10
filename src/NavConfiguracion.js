import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Asegúrate de que esta importación sea correcta
import ConfigScreen from '../screens/Config';
import ErpScreen from '../screens/Erp/Erp';
import CambiarErpScreen from '../screens/Erp/CambiarErp';
import TolvaScreen from '../screens/Tolvas/Tolva';
import LadoTolvaScreen from '../screens/Tolvas/LadoTolva';
import Grafico from '../screens/GraficoIngreso/IngresoControl';
import CalibracionScreen from '../screens/Calibracion/Calibracion';
import ControlScreen from '../screens/Control/Control';
import ListarControlesScreen from '../screens/Control/ListarControles';
import AllAnimales from '../screens/AllAnimales/AllAnimales';
import Ayuda from "../screens/Ayuda/Ayuda";
import Monitor from '../screens/Monitor';
import Preferencias from '../screens/Preferencias/Preferencias';
import Logueos from '../screens/Preferencias/Logueos';
import Notificaciones from '../screens/Preferencias/Notificaciones';

const Stack = createNativeStackNavigator(); // Crear la instancia del stack

export default function NavConfiguracion() {
    return (
        <Stack.Navigator
            initialRouteName="Configuracion"
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#4db150',
                    shadowOffset: { width: 1, height: 1 },
                    elevation: 3,
                    borderBottomWidth: 1,
                    borderBottomColor: 'white'
                },
                headerTintColor: '#fff',
                headerBackTitle: 'Atrás'
            }}
        >
            <Stack.Screen
                name="Configuracion"
                component={ConfigScreen}
                options={{ headerTitle: "CONFIGURACION", headerShown: false }}
            />
            <Stack.Screen
                name="CambiarBotonElec"
                component={ErpScreen}
                options={{ headerTitle: "CAMBIAR BOTON (eRP)", headerTitleAlign: 'center' }}
            />
            <Stack.Screen
                name="CambiarBoton"
                component={CambiarErpScreen}
                options={{ headerTitle: "CAMBIO DE BOTON (eRP)", headerTitleAlign: 'center' }}
            />
            <Stack.Screen
                name="MantdeComederos"
                component={TolvaScreen}
                options={{ headerTitle: "MANT. DE COMEDEROS", headerTitleAlign: 'center' }}
            />
            <Stack.Screen
                name="Preferencias"
                component={Preferencias}
                options={{ headerTitle: "PREFERENCIAS", headerTitleAlign: 'center' }}
            />
            <Stack.Screen
                name="LadoTolva"
                component={LadoTolvaScreen}
                options={{ headerTitle: "COMEDEROS", headerTitleAlign: 'center' }}
            />
            <Stack.Screen
                name="ControlDeIngreso"
                component={Grafico}
                options={{ headerTitle: "CONTROL DE INGRESO", headerTitleAlign: 'center' }}
            />
            <Stack.Screen
                name="Calibracion"
                component={CalibracionScreen}
                options={{ headerTitle: "CALIBRACION DE COMEDEROS", headerTitleAlign: 'center' }}
            />
            <Stack.Screen
                name="ControlLechero"
                component={ControlScreen}
                options={{ headerTitle: "CONTROL LECHERO", headerTitleAlign: 'center' }}
            />
            <Stack.Screen
                name="Animales"
                component={AllAnimales}
                options={{ headerTitle: "ANIMALES", headerTitleAlign: 'center' }}
            />
            <Stack.Screen
                name="Ayuda"
                component={Ayuda}
                options={{ headerTitle: "AYUDA", headerTitleAlign: 'center' }}
            />
            <Stack.Screen
                name="MonitorIngreso"
                component={Monitor}
                options={{ headerTitle: "MONITOR DE INGRESO", headerTitleAlign: 'center' }}
            />
            <Stack.Screen
                name="Logueos"
                component={Logueos}
                options={{ headerTitle: "Logueos", headerTitleAlign: 'center' }}
            />
            <Stack.Screen
                name="Notificaciones"
                component={Notificaciones}
                options={{ headerTitle: "Notificaciones", headerTitleAlign: 'center' }}
            />
            <Stack.Screen
                name="ControlLecheros"
                component={ListarControlesScreen}
                options={{ headerTitle: "CONTROL LECHERO", headerTitleAlign: 'center' }}
            />
        </Stack.Navigator>
    );
}