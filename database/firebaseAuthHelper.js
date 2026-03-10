// Ruta sugerida: src/utils/firebaseAuthHelper.js o database/firebaseAuthHelper.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from './firebase'; // Ajusta esta ruta a tu firebase.js

/**
 * 5. Cómo forzar refresh del token:
 * Fuerza el refresh del token JWT comunicándose con el servidor de Firebase.
 * Retorna true si fue exitoso, false si falló o la sesión expiró remotamente.
 */
export const refreshFirebaseToken = async () => {
    const currentUser = firebase.autenticacion.currentUser;
    if (currentUser) {
        try {
            console.log('🔄 Autenticación: Forzando refresh del token...');
            // El "true" obliga al SDK a ignorar la caché y pedir un token nuevo a los servidores
            await currentUser.getIdToken(true);
            console.log('✅ Autenticación: Token refrescado con éxito');
            return true;
        } catch (error) {
            console.log('❌ Autenticación: Error al refrescar token:', error.message);
            return false;
        }
    }
    return false;
};

/**
 * 6. Cómo manejar cuando el usuario no tiene sesión:
 * Intenta un inicio de sesión silencioso usando las credenciales guardadas.
 */
export const reauthenticateIfNeeded = async () => {
    try {
        // En tu app, AsyncStorage.getItem("usuario") guarda el UID, no el email.
        // Por suerte, el objeto currentUser retiene el email asociado incluso si el token expiró.
        const currentUser = firebase.autenticacion.currentUser;
        let email = currentUser?.email;

        // Por si acaso, intentamos ver si guardó un email en AsyncStorage
        if (!email) {
            const storedCorreo = await AsyncStorage.getItem("correo");
            if (storedCorreo && storedCorreo.includes('@')) {
                email = storedCorreo;
            } else {
                // Retrocompatibilidad por si se guardó en `usuario` alguna vez
                const storedUsuario = await AsyncStorage.getItem("usuario");
                if (storedUsuario && storedUsuario.includes('@')) {
                    email = storedUsuario;
                }
            }
        }

        const clave = await AsyncStorage.getItem("clave");

        if (email && clave) {
            console.log(`🔐 Autenticación: Re-autenticando silenciosamente con email ${email}...`);
            await firebase.autenticacion.signInWithEmailAndPassword(email, clave);
            console.log("✅ Autenticación: Re-autenticación exitosa");
            return true;
        } else {
            console.log("⚠️ Autenticación: No se pudo obtener el email o clave válida.");
            return false;
        }
    } catch (error) {
        console.log("❌ Autenticación: Error en re-autenticación profunda:", error.message);
        return false;
    }
};

/**
 * Asegura que el usuario tenga una sesión válida y un token fresco en memoria.
 */
export const ensureFirebaseAuth = async () => {
    const currentUser = firebase.autenticacion.currentUser;

    // Si hay usuario, intentamos refrescar el token
    if (currentUser) {
        const isTokenFresh = await refreshFirebaseToken();
        if (isTokenFresh) return true;
    }

    // Si no hay usuario o el refresh falló/fue rechazado, hacemos login desde cero
    return await reauthenticateIfNeeded();
};

/**
 * Empaqueta la lógica de Storage para detectar errores, reautenticar y reintentar.
 * 
 * @param {firebase.storage.Reference} ref - Referencia de Storage (ej. firebase.almacenamiento.ref().child('...'))
 * @param {Blob} blob - El archivo convertido a Blob
 * @param {Object} metadata - (Opcional) Metadatos del archivo (ej. { contentType: 'image/jpeg' })
 * @returns {Promise<firebase.storage.UploadTaskSnapshot>}
 */
export const safeStorageUpload = async (ref, blob, metadata = {}) => {
    // 1. Aseguramos tener un estado limpio antes de intentar subir
    await ensureFirebaseAuth();

    try {
        console.log('⬆️ Storage: Intentando subir archivo a la nube...');
        const snapshot = await ref.put(blob, metadata);
        console.log('✅ Storage: Subida original exitosa');
        return snapshot;
    } catch (error) {
        console.log('⚠️ Storage: Falló la subida inicial:', error.code || error.message);

        // 4. Cómo detectar error `storage/unauthorized`
        const isPermissionError =
            error.code === 'storage/unauthorized' ||
            error.message.includes('permission denied') ||
            error.message.includes('User does not have permission');

        if (isPermissionError) {
            console.log('🔄 Error de permisos (' + error.code + ') detectado al subir. Forzando re-autenticación profunda...');

            // El token definitivamente expiró o es inválido para Storage. 
            // Forzamos la reautenticación completa saltándonos el refresh.
            const reauthSuccess = await reauthenticateIfNeeded();

            if (reauthSuccess) {
                console.log('⬆️ Storage: Reintentando subida tras la re-autenticación profunda...');
                // Llamamos nuevamente al put. Retornará el snapshot para que tu código fluya normal.
                return await ref.put(blob, metadata);
            } else {
                throw new Error('No se pudo reautenticar al usuario para subir el archivo de Storage.');
            }
        }

        // Si es un error distinto (ej. no hay internet real o Storage cancelado), permitimos que tu catch original lo procese.
        throw error;
    }
};
