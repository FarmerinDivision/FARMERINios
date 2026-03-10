import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { SearchBar } from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useRoute } from '@react-navigation/core';
import firebase from '../../database/firebase';

const photoUrlCache = new Map();

function isLikelyUri(value) {
  if (!value || typeof value !== 'string') return false;
  const v = value.toLowerCase();
  return v.startsWith('http://') || v.startsWith('https://') || v.startsWith('file://') || v.startsWith('content://');
}

async function resolveStoragePhotoUrl({ tipo, foto, tamboId }) {
  if (!foto || !tamboId) return null;
  if (isLikelyUri(foto)) return foto;

  const cacheKey = `${tamboId}:${tipo}:${foto}`;
  if (photoUrlCache.has(cacheKey)) return photoUrlCache.get(cacheKey);

  let path = null;
  if (tipo === 'Recepcion') path = `${tamboId}/recepciones/${foto}`;
  if (tipo === 'Parto') path = `${tamboId}/crias/${foto}`;
  if (!path) return null;

  try {
    const url = await firebase.almacenamiento.ref().child(path).getDownloadURL();
    photoUrlCache.set(cacheKey, url);
    return url;
  } catch (e) {
    return null;
  }
}

function EventPhoto({ tipo, foto, tamboId, style }) {
  const [uri, setUri] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!foto) {
        if (!cancelled) setUri(null);
        return;
      }
      if (isLikelyUri(foto)) {
        if (!cancelled) setUri(foto);
        return;
      }
      const url = await resolveStoragePhotoUrl({ tipo, foto, tamboId });
      if (!cancelled) setUri(url);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [tipo, foto, tamboId]);

  if (!uri) return null;
  return <Image source={{ uri }} style={style || styles.cardPhoto} resizeMode="cover" />;
}

const EventHistoryScreen = () => {
  const route = useRoute();
  const { tipoEvento, tituloEvento, tambo } = route.params || {};

  const [eventos, setEventos] = useState([]);
  const [eventosFiltrados, setEventosFiltrados] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  const [modoFiltro, setModoFiltro] = useState('TODOS');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handlePressStartDate = () => {
    setShowEndPicker(false);
    setShowStartPicker((prev) => !prev);
  };

  const handlePressEndDate = () => {
    setShowStartPicker(false);
    setShowEndPicker((prev) => !prev);
  };

  const handleStartDateChange = (event, date) => {
    // En Android el picker dispara 'dismissed' y 'set'
    if (Platform.OS !== 'ios') {
      if (event?.type === 'dismissed') {
        setShowStartPicker(false);
        return;
      }
      if (event?.type === 'set') {
        setShowStartPicker(false);
      }
    }

    if (!date) {
      setShowStartPicker(false);
      return;
    }

    setStartDate(date);
    // Mantener rango consistente
    if (endDate && date > endDate) {
      setEndDate(null);
    }
    // Cerrar el calendario una vez seleccionada la fecha (iOS y Android)
    setShowStartPicker(false);
  };

  const handleEndDateChange = (event, date) => {
    if (Platform.OS !== 'ios') {
      if (event?.type === 'dismissed') {
        setShowEndPicker(false);
        return;
      }
      if (event?.type === 'set') {
        setShowEndPicker(false);
      }
    }

    if (!date) {
      setShowEndPicker(false);
      return;
    }

    setEndDate(date);
    if (startDate && date < startDate) {
      setStartDate(date);
    }
    // Cerrar el calendario una vez seleccionada la fecha (iOS y Android)
    setShowEndPicker(false);
  };

  const [showFicha, setShowFicha] = useState(false);
  const [fichaAnimalId, setFichaAnimalId] = useState(null);
  const [fichaAnimal, setFichaAnimal] = useState(null);
  const [loadingFicha, setLoadingFicha] = useState(false);
  const [errorFicha, setErrorFicha] = useState('');
  const animalCacheRef = useRef(new Map());
  const [fichaEvento, setFichaEvento] = useState(null);

  const [fullImage, setFullImage] = useState(null); // { tipo, foto, tamboId }

  const formatFieldValue = (value) => {
    if (value === 0) return '0';
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const formatDateField = (value) => {
    if (!value) return '';

    let date = value;
    if (value?.toDate) {
      date = value.toDate();
    } else if (!(value instanceof Date)) {
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) {
        return String(value);
      }
      date = parsed;
    }

    return format(date, 'yyyy-MM-dd');
  };

  useEffect(() => {
    aplicarFiltroBusqueda(searchText, eventos);
  }, [eventos]);

  useEffect(() => {
    let cancelled = false;

    async function cargarFicha() {
      if (!showFicha || !fichaAnimalId) return;

      setLoadingFicha(true);
      setErrorFicha('');
      try {
        const doc = await firebase.db.collection('animal').doc(fichaAnimalId).get();
        if (!doc.exists) {
          if (!cancelled) {
            setFichaAnimal(null);
            setErrorFicha('Animal no encontrado.');
          }
          return;
        }
        const data = { id: doc.id, ...(doc.data() || {}) };
        if (!cancelled) {
          setFichaAnimal(data);
          setErrorFicha('');
        }
      } catch (e) {
        if (!cancelled) {
          setFichaAnimal(null);
          setErrorFicha('No se pudo cargar la ficha.');
        }
      } finally {
        if (!cancelled) setLoadingFicha(false);
      }
    }

    cargarFicha();
    return () => {
      cancelled = true;
    };
  }, [showFicha, fichaAnimalId]);

  const obtenerEventos = async (modo) => {
    if (!tipoEvento || !tambo?.id) return;

    setLoading(true);
    try {
      // Producción sigue leyendo desde tambo/{id}/produccion
      if (tipoEvento === 'Produccion') {
        let prodQuery = firebase.db
          .collection('tambo')
          .doc(tambo.id)
          .collection('produccion');

        if (modo === 'HOY') {
          const today = new Date();
          const start = new Date(today);
          start.setHours(0, 0, 0, 0);

          const end = new Date(today);
          end.setHours(23, 59, 59, 999);

          prodQuery = prodQuery.where('fecha', '>=', start).where('fecha', '<=', end);
        }

        if (modo === 'MES') {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1);

          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          end.setHours(23, 59, 59, 999);

          prodQuery = prodQuery.where('fecha', '>=', start).where('fecha', '<=', end);
        }

        if (modo === 'RANGO' && startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);

          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);

          prodQuery = prodQuery.where('fecha', '>=', start).where('fecha', '<=', end);
        }

        // Para vistas rápidas en HOY y MES, limitar cantidad de registros
        if (modo === 'HOY' || modo === 'MES') {
          prodQuery = prodQuery.limit(200);
        }

        const prodSnapshot = await prodQuery.get();
        const prodEventos = prodSnapshot.docs.map((doc) => {
          const data = doc.data() || {};
          const fecha = data.fecha?.toDate?.() || null;

          return {
            id: `produccion_${doc.id}`,
            animalId: null,
            rp: '',
            erp: '',
            ...data,
            tipo: 'Produccion',
            fecha,
          };
        });

        prodEventos.sort((a, b) => {
          if (!a.fecha || !b.fecha) return 0;
          return b.fecha - a.fecha;
        });

        setEventos(prodEventos);
        setEventosFiltrados(prodEventos);
        return;
      }

      const tiposConsulta =
        tipoEvento === 'Aborto'
          ? ['Aborto', 'Aborto inicia lactancia']
          : [tipoEvento];

      let eventosAcumulados = [];

      // Consulta optimizada con collectionGroup('eventos') usando el índice por idtambo+tipo+fecha
      let query = firebase.db
        .collectionGroup('eventos')
        .where('idtambo', '==', tambo.id);

      if (tiposConsulta.length === 1) {
        query = query.where('tipo', '==', tiposConsulta[0]);
      } else {
        query = query.where('tipo', 'in', tiposConsulta);
      }

      if (modo === 'HOY') {
        const today = new Date();
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);

        const end = new Date(today);
        end.setHours(23, 59, 59, 999);

        query = query.where('fecha', '>=', start).where('fecha', '<=', end);
      }

      if (modo === 'MES') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);

        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);

        query = query.where('fecha', '>=', start).where('fecha', '<=', end);
      }

      if (modo === 'RANGO' && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        query = query.where('fecha', '>=', start).where('fecha', '<=', end);
      }

      // Para vistas rápidas en HOY y MES, limitar cantidad de registros
      if (modo === 'HOY' || modo === 'MES') {
        query = query.limit(200);
      }

      const snapshot = await query.get();

      eventosAcumulados = snapshot.docs.map((doc) => {
        const data = doc.data() || {};
        const fecha = data.fecha?.toDate?.() || null;
        const parentAnimalId = doc.ref?.parent?.parent?.id || null;
        const animalId = data.animalId || data.idanimal || data.idAnimal || parentAnimalId || null;
        const rp = data.rp || '';
        const erp = data.erp || '';

        return {
          id: doc.id,
          animalId,
          rp,
          erp,
          ...data,
          fecha,
        };
      });

      // Completar RP y eRP desde la ficha del animal cuando no estén en el evento
      const animalIds = [
        ...new Set(
          eventosAcumulados
            .map((e) => e.animalId)
            .filter((id) => !!id)
        ),
      ];

      if (animalIds.length > 0) {
        const animalDataMap = {};

        for (const animalId of animalIds) {
          try {
            const doc = await firebase.db.collection('animal').doc(animalId).get();
            if (doc.exists) {
              const data = doc.data() || {};
              animalDataMap[animalId] = {
                rp: data.rp || '',
                erp: data.erp || '',
              };
            }
          } catch (e) {
            // Si falla algún animal, lo ignoramos silenciosamente
          }
        }

        eventosAcumulados = eventosAcumulados.map((ev) => {
          const extra = ev.animalId && animalDataMap[ev.animalId] ? animalDataMap[ev.animalId] : {};
          return {
            ...ev,
            rp: ev.rp || extra.rp || '',
            erp: ev.erp || extra.erp || '',
          };
        });
      }

      // Agregar recepciones desde la colección de tambo cuando corresponde
      if (tipoEvento === 'Recepcion') {
        try {
          let recepQuery = firebase.db
            .collection('tambo')
            .doc(tambo.id)
            .collection('recepcion');

          if (modo === 'HOY') {
            const today = new Date();
            const start = new Date(today);
            start.setHours(0, 0, 0, 0);

            const end = new Date(today);
            end.setHours(23, 59, 59, 999);

            recepQuery = recepQuery.where('fecha', '>=', start).where('fecha', '<=', end);
          }

          if (modo === 'MES') {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);

            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);

            recepQuery = recepQuery.where('fecha', '>=', start).where('fecha', '<=', end);
          }

          if (modo === 'RANGO' && startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            recepQuery = recepQuery.where('fecha', '>=', start).where('fecha', '<=', end);
          }

          // Para vistas rápidas en HOY y MES, limitar cantidad de registros
          if (modo === 'HOY' || modo === 'MES') {
            recepQuery = recepQuery.limit(200);
          }

          const recepSnapshot = await recepQuery.get();
          const recepEventos = recepSnapshot.docs.map((doc) => {
            const data = doc.data() || {};
            const fecha = data.fecha?.toDate?.() || null;

            return {
              id: `recepcion_${doc.id}`,
              animalId: null,
              rp: '',
              erp: '',
              ...data,
              tipo: 'Recepcion',
              tipoRecepcion: data.tipo || '',
              fecha,
            };
          });

          eventosAcumulados = eventosAcumulados.concat(recepEventos);
        } catch (e) {
          console.log('Error obteniendo recepciones:', e);
        }
      }

      eventosAcumulados.sort((a, b) => {
        if (!a.fecha || !b.fecha) return 0;
        return b.fecha - a.fecha;
      });

      setEventos(eventosAcumulados);
      setEventosFiltrados(eventosAcumulados);
    } catch (error) {
      console.log('Error obteniendo eventos: ', error);
      setEventos([]);
      setEventosFiltrados([]);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltroBusqueda = (texto, listaBase) => {
    const value = texto || '';
    const cond = value.toLowerCase();

    if (!cond) {
      setEventosFiltrados(listaBase);
      setSearchText(value);
      return;
    }

    const filtrados = (listaBase || []).filter((evento) => {
      const rp = (evento.rp || '').toString().toLowerCase();
      const detalle = (evento.detalle || '').toString().toLowerCase();
      const tipo = (evento.tipo || '').toString().toLowerCase();
      return rp.includes(cond) || detalle.includes(cond) || tipo.includes(cond);
    });

    setEventosFiltrados(filtrados);
    setSearchText(value);
  };

  const abrirFicha = useCallback((item) => {
    if (!item || !item.animalId) return;
    setFichaEvento(item);
    setFichaAnimalId(item.animalId);
    setShowFicha(true);
  }, []);

  const cerrarFicha = useCallback(() => {
    setShowFicha(false);
    setFichaEvento(null);
  }, []);

  const getRemitoText = (item) => {
    if (!item) return '';
    if (item.remito) return item.remito;
    const fr = item.fechaRemito?.toDate?.() || item.fechaRemito;
    if (fr instanceof Date && !isNaN(fr.getTime())) {
      return format(fr, 'yyyy-MM-dd');
    }
    return '';
  };

  const getFotoValue = (item) => {
    if (!item) return null;
    if (item.tipo === 'Recepcion') return item.foto || item.fotoLocalUri || null;
    if (item.tipo === 'Parto') {
      if (item.foto) return item.foto;
      const crias = Array.isArray(item.crias) ? item.crias : [];
      const fotoCria = crias.find((c) => c && c.foto)?.foto;
      return fotoCria || null;
    }
    return null;
  };

  const renderItem = useCallback(
    ({ item }) => {
      const isRecepcion = item.tipo === 'Recepcion';
      const isProduccion = item.tipo === 'Produccion';
      const showFoto = (item.tipo === 'Recepcion' || item.tipo === 'Parto') && !!getFotoValue(item);
      const remitoText = isRecepcion ? getRemitoText(item) : '';
      const fotoValue = showFoto ? getFotoValue(item) : null;

      return (
        <View style={styles.card}>
          {isRecepcion ? (
            <>
              <View style={styles.cardHeaderRecepcion}>
                {item.fecha && (
                  <Text style={styles.cardDatePrimary}>
                    {format(item.fecha, 'yyyy-MM-dd')}
                  </Text>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.tipo}</Text>
                  {item.tipoRecepcion ? (
                    <Text style={styles.cardMetaHighlight}>{item.tipoRecepcion}</Text>
                  ) : null}
                </View>
              </View>

              {remitoText ? (
                <View style={styles.cardSection}>
                  <Text style={styles.cardLabel}>Remito</Text>
                  <Text style={styles.cardValue}>{remitoText}</Text>
                </View>
              ) : null}

              {item.obs ? (
                <View style={styles.cardSection}>
                  <Text style={styles.cardLabel}>Observación</Text>
                  <Text style={styles.cardDetail}>{item.obs}</Text>
                </View>
              ) : null}

              {item.usuario ? (
                <View style={styles.cardFooterRow}>
                  <Text style={styles.cardMeta}>Usuario: {item.usuario}</Text>
                </View>
              ) : null}

              {fotoValue ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setFullImage({ tipo: item.tipo, foto: fotoValue, tamboId: tambo?.id })}
                >
                  <View style={styles.cardPhotoWrapper}>
                    <EventPhoto tipo={item.tipo} foto={fotoValue} tamboId={tambo?.id} />
                  </View>
                </TouchableOpacity>
              ) : null}
            </>
          ) : isProduccion ? (
            <>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{tituloEvento || 'Producción'}</Text>
                </View>
                {item.fecha && (
                  <Text style={styles.cardDate}>
                    {format(item.fecha, 'yyyy-MM-dd')}
                  </Text>
                )}
              </View>

              <View style={styles.cardSection}>
                <Text style={styles.cardLabel}>Litros producidos</Text>
                <Text style={styles.cardValue}>
                  {formatFieldValue(item.produccion)} Lts.
                </Text>
              </View>
              <View style={styles.cardSection}>
                <Text style={styles.cardLabel}>Litros entregados</Text>
                <Text style={styles.cardValue}>
                  {formatFieldValue(item.entregados)} Lts.
                </Text>
              </View>
              <View style={styles.cardSection}>
                <Text style={styles.cardLabel}>Litros guachera</Text>
                <Text style={styles.cardValue}>
                  {formatFieldValue(item.guachera)} Lts.
                </Text>
              </View>
              <View style={styles.cardSection}>
                <Text style={styles.cardLabel}>Litros descarte</Text>
                <Text style={styles.cardValue}>
                  {formatFieldValue(item.descarte)} Lts.
                </Text>
              </View>
              <View style={styles.cardSection}>
                <Text style={styles.cardLabel}>Animales en ordeñe</Text>
                <Text style={styles.cardValue}>{formatFieldValue(item.animalesEnOrd)}</Text>
              </View>

              <View style={styles.cardSection}>
                <Text style={styles.cardLabel}>Detalle por turno</Text>
                <Text style={styles.cardMeta}>
                  Prod. Mañana: {formatFieldValue(item.prodM)} Lts.
                </Text>
                <Text style={styles.cardMeta}>
                  Prod. Tarde: {formatFieldValue(item.prodT)} Lts.
                </Text>
                <Text style={styles.cardMeta}>
                  Desc. Mañana: {formatFieldValue(item.desM)} Lts.
                </Text>
                <Text style={styles.cardMeta}>
                  Desc. Tarde: {formatFieldValue(item.desT)} Lts.
                </Text>
                <Text style={styles.cardMeta}>
                  Guachera Mañana: {formatFieldValue(item.guaM)} Lts.
                </Text>
                <Text style={styles.cardMeta}>
                  Guachera Tarde: {formatFieldValue(item.guaT)} Lts.
                </Text>
                <Text style={styles.cardMeta}>
                  Fábrica: {formatFieldValue(item.fabrica)}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.tipo}</Text>
                  {item.rp ? (
                    <Text style={styles.cardMetaHighlight}>RP: {item.rp}</Text>
                  ) : null}
                  <Text style={styles.cardMetaHighlight}>
                    eRP: {item.erp && String(item.erp).trim() !== '' ? item.erp : ' - '}
                  </Text>
                </View>
                {item.fecha && (
                  <Text style={styles.cardDate}>
                    {format(item.fecha, 'yyyy-MM-dd')}
                  </Text>
                )}
              </View>

              {item.detalle ? (
                <View style={styles.cardSection}>
                  <Text style={styles.cardLabel}>Detalle</Text>
                  <Text style={styles.cardDetail}>{item.detalle}</Text>
                </View>
              ) : null}

              {item.usuario ? (
                <View style={styles.cardFooterRow}>
                  <Text style={styles.cardMeta}>Usuario: {item.usuario}</Text>
                </View>
              ) : null}

              {fotoValue ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setFullImage({ tipo: item.tipo, foto: fotoValue, tamboId: tambo?.id })}
                >
                  <View style={styles.cardPhotoWrapper}>
                    <EventPhoto tipo={item.tipo} foto={fotoValue} tamboId={tambo?.id} />
                  </View>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          {!isRecepcion && !isProduccion && (
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.fichaButton} onPress={() => abrirFicha(item)}>
                <Text style={styles.fichaButtonText}>Ver Ficha</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    },
    [abrirFicha, tambo?.id],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>
        {tituloEvento ? `Historial de ${tituloEvento}` : 'Historial de Eventos'}
      </Text>

      {/* BOTONES */}
      <View style={styles.botonesFiltro}>
        <TouchableOpacity
          style={[styles.botonFiltro, modoFiltro === 'HOY' && styles.botonActivo]}
          onPress={() => {
            setStartDate(null);
            setEndDate(null);
            setModoFiltro('HOY');
            obtenerEventos('HOY');
          }}
        >
          <Text style={styles.textoBoton}>Hoy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botonFiltro, modoFiltro === 'MES' && styles.botonActivo]}
          onPress={() => {
            setStartDate(null);
            setEndDate(null);
            setModoFiltro('MES');
            obtenerEventos('MES');
          }}
        >
          <Text style={styles.textoBoton}>Mes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.botonFiltro,
            (modoFiltro === 'RANGO' || modoFiltro === 'RANGO_RESULTADOS') && styles.botonActivo,
          ]}
          onPress={() => {
            setStartDate(null);
            setEndDate(null);
            setModoFiltro('RANGO');
          }}
        >
          <Text style={styles.textoBoton}>Rango</Text>
        </TouchableOpacity>
      </View>

      {/* RANGO */}
      {modoFiltro === 'RANGO' && (
        <View style={{ paddingHorizontal: 5, marginBottom: 8 }}>
          <TouchableOpacity
            style={styles.calendario}
            onPress={handlePressStartDate}
          >
            <Text style={styles.textoCalendar}>
              {startDate
                ? `Desde: ${format(startDate, 'yyyy-MM-dd')}`
                : 'Seleccionar fecha desde'}
            </Text>
          </TouchableOpacity>

          {showStartPicker && (
            <View style={styles.inlineDatePickerWrap}>
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant={Platform.OS === 'ios' ? 'dark' : undefined}
                maximumDate={new Date()}
                onChange={handleStartDateChange}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.calendario, { margin: 1 }]}
            onPress={handlePressEndDate}
          >
            <Text style={styles.textoCalendar}>
              {endDate
                ? `Hasta: ${format(endDate, 'yyyy-MM-dd')}`
                : 'Seleccionar fecha hasta'}
            </Text>
          </TouchableOpacity>

          {showEndPicker && (
            <View style={styles.inlineDatePickerWrap}>
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant={Platform.OS === 'ios' ? 'dark' : undefined}
                maximumDate={new Date()}
                onChange={handleEndDateChange}
              />
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.botonBuscarRango,
              (!startDate || !endDate) && styles.botonBuscarRangoDisabled,
            ]}
            activeOpacity={0.85}
            onPress={() => {
              if (!startDate || !endDate) return;
              obtenerEventos('RANGO');
              setShowStartPicker(false);
              setShowEndPicker(false);
              // Ocultamos los controles de rango y mostramos sólo la lista
              setModoFiltro('RANGO_RESULTADOS');
            }}
          >
            <Text style={styles.textoBotonBuscar}>Buscar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LISTA */}
      <View style={styles.listado}>
        {loading ? (
          <ActivityIndicator size="large" color="#1b829b" />
        ) : eventosFiltrados.length === 0 ? (
          <Text style={styles.alerta}>
            Seleccione un filtro para ver eventos
          </Text>
        ) : (
          <FlatList
            data={eventosFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        )}
      </View>

      {/* MODAL FICHA */}
      <Modal
        visible={showFicha}
        transparent
        animationType="fade"
        onRequestClose={cerrarFicha}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {fichaEvento?.tipo
                ? `${fichaEvento.tipo} - `
                : ''}
              RP: {formatFieldValue(fichaAnimal?.rp)}  eRP:{' '}
              {formatFieldValue(fichaEvento?.erp ?? fichaAnimal?.erp) || ' - '}
            </Text>

            {loadingFicha ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#1b829b" />
                <Text style={styles.modalMessage}>CARGANDO...</Text>
              </View>
            ) : errorFicha ? (
              <Text style={styles.modalMessage}>{errorFicha}</Text>
            ) : fichaAnimal ? (
              <ScrollView
                style={{ alignSelf: 'stretch' }}
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {/* Identificación */}
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>RP:</Text>
                  <Text style={styles.modalValue}>{formatFieldValue(fichaAnimal.rp)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>eRP:</Text>
                  <Text style={styles.modalValue}>
                    {formatFieldValue(fichaEvento?.erp ?? fichaAnimal.erp) || ' - '}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Grupo:</Text>
                  <Text style={styles.modalValue}>{formatFieldValue(fichaAnimal.grupo)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Rodeo:</Text>
                  <Text style={styles.modalValue}>{formatFieldValue(fichaAnimal.rodeo)}</Text>
                </View>

                {/* Estado productivo / reproductivo */}
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Categoría:</Text>
                  <Text style={styles.modalValue}>{formatFieldValue(fichaAnimal.categoria)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Estado Prod.:</Text>
                  <Text style={styles.modalValue}>{formatFieldValue(fichaAnimal.estpro)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Estado Rep.:</Text>
                  <Text style={styles.modalValue}>{formatFieldValue(fichaAnimal.estrep)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Lactancia:</Text>
                  <Text style={styles.modalValue}>{formatFieldValue(fichaAnimal.lactancia)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Ración:</Text>
                  <Text style={styles.modalValue}>{formatFieldValue(fichaAnimal.racion)}</Text>
                </View>

                {/* Servicios y fechas */}
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>N° Servicios:</Text>
                  <Text style={styles.modalValue}>
                    {formatFieldValue(
                      fichaAnimal.nservicios ?? fichaAnimal.nroservicio ?? fichaAnimal.nservicio,
                    )}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Ult. Servicio:</Text>
                  <Text style={styles.modalValue}>
                    {fichaAnimal.fservicio ? String(fichaAnimal.fservicio) : ''}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Ult. Parto:</Text>
                  <Text style={styles.modalValue}>
                    {fichaAnimal.fparto ? String(fichaAnimal.fparto) : ''}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Ult. Control:</Text>
                  <Text style={styles.modalValue}>
                    {formatDateField(fichaAnimal.fuc)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Ingreso:</Text>
                  <Text style={styles.modalValue}>
                    {fichaAnimal.ingreso ? String(fichaAnimal.ingreso) : ''}
                  </Text>
                </View>

                {/* Otros datos sanitarios */}
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>UC:</Text>
                  <Text style={styles.modalValue}>{formatFieldValue(fichaAnimal.uc)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>CA:</Text>
                  <Text style={styles.modalValue}>{formatFieldValue(fichaAnimal.ca)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Anorm.:</Text>
                  <Text style={styles.modalValue}>{formatFieldValue(fichaAnimal.anorm)}</Text>
                </View>

                {/* Observaciones */}
                <View style={styles.modalBlock}>
                  <Text style={styles.modalLabel}>Observaciones:</Text>
                  <Text style={styles.modalValue}>{formatFieldValue(fichaAnimal.observaciones)}</Text>
                </View>
              </ScrollView>
            ) : (
              <Text style={styles.modalMessage}>Sin datos.</Text>
            )}

            <TouchableOpacity style={styles.modalButton} onPress={cerrarFicha}>
              <Text style={styles.modalButtonText}>CERRAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL FOTO COMPLETA */}
      <Modal
        visible={!!fullImage}
        transparent
        animationType="fade"
        onRequestClose={() => setFullImage(null)}
      >
        <View style={styles.fullImageOverlay}>
          <TouchableOpacity
            style={styles.fullImageOverlay}
            activeOpacity={1}
            onPress={() => setFullImage(null)}
          >
            <ScrollView
              style={styles.fullImageScroll}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              maximumZoomScale={3}
              minimumZoomScale={1}
              centerContent
            >
              {fullImage && (
                <EventPhoto
                  tipo={fullImage.tipo}
                  foto={fullImage.foto}
                  tamboId={fullImage.tamboId}
                  style={styles.fullImage}
                />
              )}
            </ScrollView>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default EventHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef3f7',
    paddingHorizontal: 8,
    paddingTop: 0,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    color: '#1b829b',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 0,
  },
  filterContainer: {
    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 5,
  },
  label: {
    fontSize: 16,
    color: '#444',
    marginBottom: 5,
  },
  fechaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendario: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1b829b',
    marginBottom: 10,
    minHeight: 52,
    justifyContent: 'center',
  },
  textoCalendar: {
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '600',
  },
  clearButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#e1e8ee',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#444',
    fontWeight: 'bold',
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    paddingTop: 5,
    paddingHorizontal: 10,
  },
  colbarra: {
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
    paddingTop: 50,
    borderRadius: 22,
    paddingHorizontal: 20,

    marginTop: 0,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardHeaderRecepcion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 19,
    color: '#1b829b',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 15,
    color: '#555555',
    marginLeft: 8,
  },
  cardDatePrimary: {
    fontSize: 16,
    color: '#1b829b',
    fontWeight: '600',
    marginRight: 10,
  },
  cardMeta: {
    fontSize: 15,
    color: '#555555',
    marginTop: 2,
  },
  cardMetaHighlight: {
    fontSize: 16,
    color: '#222222',
    fontWeight: '600',
    marginTop: 2,
  },
  cardSection: {
    marginTop: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#edf1f5',
  },
  cardLabel: {
    fontSize: 14,
    color: '#7a7a7a',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 16,
    color: '#111111',
  },
  cardDetail: {
    fontSize: 16,
    color: '#111111',
  },
  cardFooterRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPhotoWrapper: {
    marginTop: 12,
    alignItems: 'center',
  },
  cardPhoto: {
    width: '100%',
    height: 260,
    borderRadius: 14,
    backgroundColor: '#00000010',
  },
  cardActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eef2f5',
    paddingTop: 8,
  },
  fichaButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#1b829b',
    borderRadius: 10,
  },
  fichaButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  alerta: {
    textAlign: 'center',
    backgroundColor: '#fce4ec',
    fontSize: 16,
    color: '#e91e63',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    marginVertical: 10,
  },
  separator: {
    height: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonesFiltro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingHorizontal: 4,
  },

  botonFiltro: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: '#e1e8ee',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#0A0A0A',
  },

  botonActivo: {
    backgroundColor: '#1b829b',
    borderColor: '#1b829b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },

  textoBoton: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  inputFecha: {
    marginHorizontal: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f3f6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 20,
    maxHeight: '80%',
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b829b',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalLoading: {
    alignItems: 'center',
    marginBottom: 10,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f5',
  },
  modalBlock: {
    marginTop: 8,
    marginBottom: 8,
  },
  modalLabel: {
    fontWeight: '500',
    color: '#777777',
    marginRight: 10,
  },
  modalValue: {
    color: '#111111',
    fontSize: 16,
    flexShrink: 1,
    textAlign: 'right',
  },
  modalButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1b829b',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
  botonBuscarRango: {
    marginTop: 12,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#287fb9',
  },
  botonBuscarRangoDisabled: {
    backgroundColor: '#9fb8c6',
  },
  textoBotonBuscar: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  inlineDatePickerWrap: {
    backgroundColor: '#000000',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 8,
    marginBottom: 6,
    overflow: 'hidden',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerContainer: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 10,
    width: '90%',
    maxWidth: 420,
    elevation: 6,
  },
  datePickerCloseButton: {
    marginTop: 10,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff22',
  },
  datePickerCloseText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  fullImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  fullImageScroll: {
    flex: 1,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
