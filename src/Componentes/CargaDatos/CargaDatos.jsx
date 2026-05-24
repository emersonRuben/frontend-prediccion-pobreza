import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { coreApi } from '../../api/services';

// ─── Sub-componente: tarjeta de resultado por registro ─────────────────────────
const ResultadoItem = ({ index, prediccion, probabilidad }) => {
  const esPobre = prediccion === 1 || prediccion === true;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.7rem 1rem',
        borderRadius: '10px',
        background: esPobre ? 'rgba(255,59,48,0.08)' : 'rgba(50,215,75,0.08)',
        border: `1px solid ${esPobre ? 'rgba(255,59,48,0.2)' : 'rgba(50,215,75,0.2)'}`,
      }}
    >
      <span style={{ fontWeight: 500 }}>Registro #{index + 1}</span>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {probabilidad != null && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            P={Number(probabilidad).toFixed(3)}
          </span>
        )}
        <span
          style={{
            fontWeight: 700,
            color: esPobre ? '#FF3B30' : '#32D74B',
            fontSize: '0.9rem',
          }}
        >
          {esPobre ? '⚠ En pobreza' : '✓ No en pobreza'}
        </span>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
const CargaDatos = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null); // respuesta exitosa del backend
  const [error, setError] = useState(null);         // mensaje de error

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setResultado(null);
      setError(null);
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResultado(null);
      setError(null);
    }
  };

  /**
   * Envía el archivo .parquet al endpoint POST /predict/parquet del backend.
   * Si el archivo es .csv u otro formato, usa el mismo endpoint (el backend decide).
   */
  const procesarDatos = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      // Usamos predict/parquet para .parquet; el backend rechazará formatos inválidos
      const data = await coreApi.predictParquet(file);
      setResultado(data);
    } catch (err) {
      setError(err.message ?? 'Error al procesar el archivo. Verifica que sea un .parquet válido.');
    } finally {
      setLoading(false);
    }
  };

  const reiniciar = () => {
    setFile(null);
    setResultado(null);
    setError(null);
  };

  // ── Extrae predicciones y probabilidades de la respuesta del backend ─────────
  const predicciones = resultado?.predictions ?? resultado?.predicciones ?? [];
  const probabilidades = resultado?.probabilities ?? resultado?.probabilidades ?? [];
  const nRegistros = resultado?.n_records ?? resultado?.n_registros ?? predicciones.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div>
        <h1 className="gradient-text">Carga de Datos e Inferencia</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Sube un panel ENAHO en formato <strong>.parquet</strong> para correr el modelo{' '}
          <code>modelo_notasv1</code> sobre todos los registros.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1 }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', padding: '2.5rem 2rem' }}>

          {/* ── Estado: éxito ─────────────────────────────────────────────── */}
          {resultado && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <CheckCircle size={56} strokeWidth={1.2} color="var(--success-color)" style={{ marginBottom: '1rem' }} />
                <h2 style={{ marginBottom: '0.5rem' }}>¡Inferencia Completada!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {nRegistros} registro{nRegistros !== 1 ? 's' : ''} procesado{nRegistros !== 1 ? 's' : ''} por el modelo.
                </p>
              </div>

              {/* Lista de resultados (máximo 50 para no colapsar la UI) */}
              {predicciones.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
                  {predicciones.slice(0, 50).map((pred, i) => (
                    <ResultadoItem
                      key={i}
                      index={i}
                      prediccion={pred}
                      probabilidad={probabilidades[i]}
                    />
                  ))}
                  {predicciones.length > 50 && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>
                      … y {predicciones.length - 50} registros más.
                    </p>
                  )}
                </div>
              )}

              <button className="btn-glass" onClick={reiniciar} style={{ width: '100%', padding: '0.9rem' }}>
                Cargar otro archivo
              </button>
            </div>
          )}

          {/* ── Estado: formulario de carga ────────────────────────────────── */}
          {!resultado && (
            <>
              {/* Zona de drop */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${error ? 'rgba(255,59,48,0.5)' : 'var(--glass-border)'}`,
                  borderRadius: '16px',
                  padding: '3rem 1rem',
                  background: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  marginBottom: '1.5rem',
                  transition: 'var(--transition-smooth)',
                  textAlign: 'center',
                }}
              >
                <UploadCloud size={56} strokeWidth={1} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
                <h3>Arrastra tu archivo aquí</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>o</p>
                <label className="btn-glass" style={{ display: 'inline-block', cursor: 'pointer' }}>
                  Seleccionar archivo
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    accept=".parquet"
                    onChange={handleFileSelect}
                  />
                </label>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.8rem' }}>
                  Formato soportado: <code>.parquet</code>
                </p>
              </div>

              {/* Archivo seleccionado */}
              {file && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.4)',
                    padding: '1rem',
                    borderRadius: '16px',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="ios-icon-box">
                      <FileText size={20} strokeWidth={1.5} color="var(--accent-color)" />
                    </div>
                    <div>
                      <span style={{ fontWeight: 500, display: 'block' }}>{file.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {(file.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={reiniciar}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    title="Quitar archivo"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.7rem',
                    padding: '1rem',
                    borderRadius: '12px',
                    background: 'rgba(255,59,48,0.08)',
                    border: '1px solid rgba(255,59,48,0.25)',
                    color: '#FF3B30',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Botón de acción */}
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                disabled={!file || loading}
                onClick={procesarDatos}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="spin" />
                    Procesando con el modelo…
                  </>
                ) : (
                  'Generar Predicciones'
                )}
              </button>


            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default CargaDatos;
