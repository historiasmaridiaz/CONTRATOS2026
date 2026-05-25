import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface IPrestamo {
  id: string;
  fechaSolicitud: string;
  tipoDoc: string;
  contratoId: string;
  contrato: string;
  solicitante: string;
  tipoUsuario: string;
  dependencia: string;
  cedula: string;
  telefono: string;
  quienPresta: string;
  fechaPrestamo: string;
  fechaDevolver: string;
  estado: string;
  fechaDevuelto: string;
  firmaDevuelve: string;
  atiende: string;
  observaciones: string;
}

interface IContrato {
  id: string;
  contrato: string;
  representante: string;
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxaOH0BwNLOVUPe8HGm2eiD2VI2zApRM-qQFKZEPWicySVWmC4GxC5oVuSdiP83F9ehGg/exec';
const API_KEY = 'AIzaSyDmnlKUIQXcKDghVXxl8urYX57uj6kPvO0';
const SHEET_ID = '12bK87flqbGDaF4QSPdeJBUrZD2GdNkOapfdwwmhITnc';
const PAGE_SIZE = 12;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (str: string) => {
  if (!str) return '—';
  try { return new Date(str).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return str; }
};
const fmtCorta = (str: string) => {
  if (!str) return '—';
  try { return new Date(str + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return str; }
};
const now = () => new Date().toLocaleString('es-CO');

// ─── BADGE ───────────────────────────────────────────────────────────────────
const Badge = ({ estado }: { estado: string }) => {
  const styles: Record<string, React.CSSProperties> = {
    PENDIENTE: { background: '#fef3cd', color: '#856404', border: '1px solid #fde68a' },
    DEVUELTO:  { background: '#d1f5e0', color: '#155724', border: '1px solid #a7f3c1' },
    VENCIDO:   { background: '#fde8e8', color: '#7f1d1d', border: '1px solid #fca5a5' },
  };
  const labels: Record<string, string> = { PENDIENTE: '⏳ Pendiente', DEVUELTO: '✅ Devuelto', VENCIDO: '⚠️ Vencido' };
  return (
    <span style={{ ...styles[estado] || styles.PENDIENTE, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.4 }}>
      {labels[estado] || estado}
    </span>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
export default function Prestamos() {
  const [vista, setVista] = useState<'tabla' | 'informe'>('tabla');
  const [prestamos, setPrestamos] = useState<IPrestamo[]>([]);
  const [contratos, setContratos] = useState<IContrato[]>([]);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: string } | null>(null);

  // Modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalDev, setModalDev] = useState(false);
  const [devId, setDevId] = useState<string | null>(null);

  // Formulario nuevo préstamo
  const [fTipoDoc, setFTipoDoc] = useState('');
  const [fTipoUsuario, setFTipoUsuario] = useState<'INTERNO' | 'EXTERNO'>('INTERNO');
  const [fTelefono, setFTelefono] = useState('');
  const [fDependencia, setFDependencia] = useState('');
  const [fSolicitante, setFSolicitante] = useState('');
  const [fCedula, setFCedula] = useState('');
  const [fContratoBuscar, setFContratoBuscar] = useState('');
  const [fContratoId, setFContratoId] = useState('');
  const [fQuienPresta, setFQuienPresta] = useState('');
  const [fFechaDevolver, setFFechaDevolver] = useState('');
  const [fFechaSolicitud, setFFechaSolicitud] = useState('');
  const [suggestions, setSuggestions] = useState<IContrato[]>([]);

  // Formulario devolución
  const [devFirma, setDevFirma] = useState('');
  const [devAtiende, setDevAtiende] = useState('');
  const [devObs, setDevObs] = useState('');

  // Informe
  const [informeMes, setInformeMes] = useState(new Date().getMonth());
  const [informeAnio, setInformeAnio] = useState(new Date().getFullYear());

  const showToast = (msg: string, tipo = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3200);
  };

  // ── FETCH ──────────────────────────────────────────────────────────────────
  const fetchPrestamos = useCallback(async () => {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/PRESTAMOS?key=${API_KEY}`;
      const res = await axios.get(url);
      const rows: string[][] = res.data.values || [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const mapped: IPrestamo[] = rows.slice(1).map(r => {
        let estado = r[13] || 'PENDIENTE';
        if (estado === 'PENDIENTE' && r[12]) {
          const d = new Date(r[12] + 'T12:00:00');
          if (d < today) estado = 'VENCIDO';
        }
        return {
          id: r[0] || '', fechaSolicitud: r[1] || '', tipoDoc: r[2] || '',
          contratoId: r[3] || '', contrato: r[4] || '', solicitante: r[5] || '',
          tipoUsuario: r[6] || '', dependencia: r[7] || '', cedula: r[8] || '',
          telefono: r[9] || '', quienPresta: r[10] || '', fechaPrestamo: r[11] || '',
          fechaDevolver: r[12] || '', estado,
          fechaDevuelto: r[14] || '', firmaDevuelve: r[15] || '',
          atiende: r[16] || '', observaciones: r[17] || '',
        };
      });
      setPrestamos(mapped);
    } catch (e: any) { showToast('Error cargando préstamos: ' + e.message, 'error'); }
  }, []);

  const fetchContratos = useCallback(async () => {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/CONTRATOS?key=${API_KEY}`;
      const res = await axios.get(url);
      const rows: string[][] = res.data.values || [];
      setContratos(rows.slice(1).map(r => ({ id: r[0] || '', contrato: r[4] || '', representante: r[6] || '' })));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchPrestamos(); fetchContratos(); }, [fetchPrestamos, fetchContratos]);

  // ── STATS ──────────────────────────────────────────────────────────────────
  const stats = {
    total: prestamos.length,
    pendiente: prestamos.filter(p => p.estado === 'PENDIENTE').length,
    devuelto: prestamos.filter(p => p.estado === 'DEVUELTO').length,
    vencido: prestamos.filter(p => p.estado === 'VENCIDO').length,
    mes: prestamos.filter(p => {
      if (!p.fechaSolicitud) return false;
      const d = new Date(p.fechaSolicitud);
      const n = new Date();
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    }).length,
  };

  // ── FILTRADO ───────────────────────────────────────────────────────────────
  const filtrados = prestamos.filter(p => {
    const matchF = filtro === 'todos' || p.estado === filtro;
    const q = busqueda.toLowerCase();
    const matchQ = !q || p.contrato.toLowerCase().includes(q) || p.solicitante.toLowerCase().includes(q) || p.dependencia.toLowerCase().includes(q) || p.contratoId.includes(q);
    return matchF && matchQ;
  });
  const totalPags = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const slice = filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  // ── BUSCAR CONTRATO ────────────────────────────────────────────────────────
  const buscarContrato = (q: string) => {
    setFContratoBuscar(q);
    setFContratoId('');
    if (q.length < 2) { setSuggestions([]); return; }
    setSuggestions(contratos.filter(c => c.contrato.toLowerCase().includes(q.toLowerCase()) || c.id.includes(q)).slice(0, 8));
  };

  const selContr = (c: IContrato) => {
    setFContratoBuscar(c.contrato);
    setFContratoId(c.id);
    setSuggestions([]);
  };

  // ── GUARDAR PRÉSTAMO ───────────────────────────────────────────────────────
  const guardarPrestamo = async () => {
    if (!fTipoDoc || !fSolicitante || !fDependencia || !fFechaDevolver) {
      showToast('Completa los campos obligatorios (*)', 'error'); return;
    }
    setLoading(true);
    const params = new URLSearchParams({
      action: 'addPrestamo',
      fechaSolicitud: fFechaSolicitud,
      tipoDoc: fTipoDoc, contratoId: fContratoId,
      contrato: fContratoBuscar, solicitante: fSolicitante,
      tipoUsuario: fTipoUsuario, dependencia: fDependencia,
      cedula: fCedula, telefono: fTelefono,
      quienPresta: fQuienPresta, fechaPrestamo: fFechaSolicitud,
      fechaDevolver: fFechaDevolver, estado: 'PENDIENTE',
    });
    try {
      const res = await axios.get(`${GAS_URL}?${params}`);
      if (res.data.success) {
        setModalNuevo(false); resetForm();
        await fetchPrestamos();
        showToast('✅ Préstamo registrado correctamente');
      } else showToast('Error: ' + res.data.error, 'error');
    } catch (e: any) { showToast('Error: ' + e.message, 'error'); }
    setLoading(false);
  };

  const resetForm = () => {
    setFTipoDoc(''); setFTipoUsuario('INTERNO'); setFTelefono('');
    setFDependencia(''); setFSolicitante(''); setFCedula('');
    setFContratoBuscar(''); setFContratoId(''); setFQuienPresta('');
    setFFechaDevolver(''); setSuggestions([]);
  };

  const abrirModalNuevo = () => {
    resetForm(); setFFechaSolicitud(now()); setModalNuevo(true);
  };

  // ── DEVOLUCIÓN ─────────────────────────────────────────────────────────────
  const abrirDevolucion = (id: string) => {
    setDevId(id); setDevFirma(''); setDevAtiende(''); setDevObs('');
    setModalDev(true);
  };

  const confirmarDevolucion = async () => {
    if (!devFirma || !devAtiende) { showToast('Completa firma y quien atiende', 'error'); return; }
    setLoading(true);
    const params = new URLSearchParams({
      action: 'devolver', id: devId!,
      fechaDevuelto: now(), firmaDevuelve: devFirma,
      atiende: devAtiende, observaciones: devObs,
    });
    try {
      const res = await axios.get(`${GAS_URL}?${params}`);
      if (res.data.success) {
        setModalDev(false); await fetchPrestamos();
        showToast('✅ Devolución registrada');
      } else showToast('Error: ' + res.data.error, 'error');
    } catch (e: any) { showToast('Error: ' + e.message, 'error'); }
    setLoading(false);
  };

  // ── ELIMINAR ───────────────────────────────────────────────────────────────
  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este préstamo?')) return;
    try {
      const res = await axios.get(`${GAS_URL}?action=deletePrestamo&id=${id}`);
      if (res.data.success) { await fetchPrestamos(); showToast('Préstamo eliminado'); }
      else showToast('Error: ' + res.data.error, 'error');
    } catch (e: any) { showToast('Error: ' + e.message, 'error'); }
  };

  // ── PDF ────────────────────────────────────────────────────────────────────
  const generarPDF = (p: IPrestamo) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Préstamo ${p.id}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; color: #000; }
        .header { display: flex; justify-content: space-between; align-items: center; border: 1px solid #000; margin-bottom: 0; }
        .header-logo { padding: 8px 12px; border-right: 1px solid #000; font-size: 13px; }
        .header-title { flex:1; text-align: center; font-size: 13px; font-weight: bold; padding: 8px; border-right: 1px solid #000; }
        .header-meta { padding: 6px 10px; font-size: 10px; line-height: 1.6; }
        .header-copy { border-top: 1px solid #000; text-align: right; padding: 3px 8px; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #000; padding: 5px 8px; }
        .section-header { background: #ddd; font-weight: bold; text-align: center; font-size: 11px; }
        .label { font-weight: bold; width: 140px; }
        .field { height: 20px; }
        .big-field { height: 60px; vertical-align: top; }
        @media print { button { display: none; } }
      </style>
      </head><body>
      <div class="header">
        <div class="header-logo">🏥 Proinssalud</div>
        <div class="header-title">PRÉSTAMO DE DOCUMENTOS DE ARCHIVO</div>
        <div class="header-meta">
          CÓDIGO: FAGED-09<br>FECHA ÚLTIMA REVISIÓN: 25/02/2026<br>VERSIÓN: 04<br>HOJA: 1 DE: 1
        </div>
      </div>
      <div class="header-copy" style="border:1px solid #000;border-top:none">COPIA CONTROLADA</div>

      <table style="margin-top:8px">
        <tr><td colspan="3" class="section-header">I. SOLICITUD DEL DOCUMENTO</td></tr>
        <tr><td colspan="3" class="label">Tipo de documento:</td></tr>
        <tr><td colspan="3" class="big-field">${p.tipoDoc}</td></tr>
        <tr>
          <td><span class="label">Tipo de usuario:</span> ${p.tipoUsuario}</td>
          <td><span class="label">Dependencia o Entidad que solicita:</span> ${p.dependencia}</td>
          <td><span class="label">Extensión /Teléfono:</span> ${p.telefono}</td>
        </tr>
        <tr>
          <td colspan="2"><span class="label">Nombre de quien solicita el servicio:</span> ${p.solicitante}</td>
          <td><span class="label">Firma y cédula del solicitante:</span> ${p.cedula}</td>
        </tr>
        <tr><td colspan="3"><span class="label">Fecha y hora de solicitud:</span> ${p.fechaSolicitud}</td></tr>

        <tr><td colspan="3" class="section-header">II. REGISTRO DEL PRÉSTAMO DE DOCUMENTO</td></tr>
        <tr><td colspan="3"><span class="label">Tipo de documento / Contrato:</span> ${p.contrato || p.tipoDoc}</td></tr>
        <tr>
          <td><span class="label">Nombre de quien presta:</span> ${p.quienPresta}</td>
          <td><span class="label">Fecha y hora de préstamo:</span> ${p.fechaPrestamo}</td>
          <td><span class="label">Para devolver el día:</span> ${fmtCorta(p.fechaDevolver)}</td>
        </tr>

        <tr><td colspan="3" class="section-header">III. DEVOLUCIÓN DEL DOCUMENTO</td></tr>
        <tr>
          <td><span class="label">Devuelto el día:</span> ${p.fechaDevuelto || ''}</td>
          <td><span class="label">Firma de quien devuelve:</span> ${p.firmaDevuelve || ''}</td>
          <td><span class="label">Nombre de quien atiende la devolución:</span> ${p.atiende || ''}</td>
        </tr>
      </table>
      <br>
      <button onclick="window.print()" style="padding:8px 20px;background:#1a1a2e;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">🖨️ Imprimir</button>
      </body></html>
    `);
    win.document.close();
  };

  // ── INFORME ────────────────────────────────────────────────────────────────
  const filtradosInforme = prestamos.filter(p => {
    if (!p.fechaSolicitud) return false;
    const d = new Date(p.fechaSolicitud);
    return d.getMonth() === informeMes && d.getFullYear() === informeAnio;
  });

  const semanas = [0, 0, 0, 0, 0];
  filtradosInforme.forEach(p => {
    const dia = new Date(p.fechaSolicitud).getDate();
    semanas[Math.min(Math.floor((dia - 1) / 7), 4)]++;
  });
  const maxSem = Math.max(...semanas, 1);
  const interno = filtradosInforme.filter(p => p.tipoUsuario === 'INTERNO').length;
  const externo = filtradosInforme.filter(p => p.tipoUsuario === 'EXTERNO').length;

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  const s: Record<string, React.CSSProperties> = {
    // Layout
    wrap:    { fontFamily: "'DM Sans', sans-serif", background: '#f5f0e8', minHeight: '100vh', padding: '24px' },
    page:    { maxWidth: 1300, margin: '0 auto' },
    // Encabezado
    topBar:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, paddingBottom: 20, borderBottom: '2px solid #ede8df' },
    h1:      { fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#16213e', lineHeight: 1.1 },
    h1gold:  { color: '#c9a84c' },
    // Stats
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 },
    statCard:  { background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 4px 16px rgba(26,26,46,0.08)', borderLeft: '4px solid #c9a84c' },
    statLabel: { fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1.5, color: '#7a7a8a', fontWeight: 600 },
    statVal:   { fontSize: 28, fontWeight: 700, color: '#1a1a2e', lineHeight: 1, marginTop: 4 },
    statSub:   { fontSize: 11, color: '#7a7a8a', marginTop: 2 },
    // Toolbar
    toolbar:   { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const, marginBottom: 16 },
    searchBox: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #ede8df', borderRadius: 8, padding: '7px 14px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' },
    // Tabla
    tableWrap: { background: '#fff', borderRadius: 12, boxShadow: '0 4px 16px rgba(26,26,46,0.08)', overflow: 'hidden' },
    th:        { padding: '11px 14px', textAlign: 'left' as const, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1.5, color: 'rgba(255,255,255,0.8)', background: '#16213e', whiteSpace: 'nowrap' as const },
    td:        { padding: '11px 14px', fontSize: 13, color: '#1a1a2e', borderBottom: '1px solid #f0ede8', verticalAlign: 'middle' as const },
    // Modal
    overlay:   { position: 'fixed' as const, inset: 0, background: 'rgba(26,26,46,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
    modal:     { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: '0 24px 64px rgba(0,0,0,0.3)' },
    modalHdr:  { padding: '20px 28px 16px', borderBottom: '2px solid #f0ede8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle:{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#16213e' },
    modalBody: { padding: '20px 28px' },
    modalFoot: { padding: '12px 28px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #f0ede8' },
    // Sección form
    fSection:  { background: '#f8f5f0', borderRadius: 10, padding: '14px 16px', marginBottom: 14 },
    fSecTitle: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 2, color: '#7a7a8a', marginBottom: 12 },
    fRow:      { display: 'grid', gap: 12, marginBottom: 10 },
    fLabel:    { fontSize: 11, fontWeight: 700, color: '#7a7a8a', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 4, display: 'block' },
    fInput:    { padding: '9px 12px', borderRadius: 8, border: '1.5px solid #ede8df', fontFamily: 'inherit', fontSize: 14, color: '#1a1a2e', background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
    // Tabs
    tabs:      { display: 'flex', gap: 6, marginBottom: 14, background: '#fff', padding: 6, borderRadius: 10, boxShadow: '0 2px 8px rgba(26,26,46,0.06)', width: 'fit-content' },
    // Toast
    toastBase: { position: 'fixed' as const, bottom: 28, right: 28, zIndex: 999, padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 8 },
  };

  const btn = (variant: 'primary'|'gold'|'outline'|'green'|'red', extra: React.CSSProperties = {}): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
    ...(variant === 'primary' ? { background: 'linear-gradient(135deg, #16213e, #2a3f6f)', color: '#fff', boxShadow: '0 4px 12px rgba(26,26,46,0.25)' } : {}),
    ...(variant === 'gold'    ? { background: 'linear-gradient(135deg, #c9a84c, #e8c76b)', color: '#1a1a2e' } : {}),
    ...(variant === 'outline' ? { background: '#fff', color: '#1a1a2e', border: '1.5px solid #ede8df', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' } : {}),
    ...(variant === 'green'   ? { background: '#1a6b3c', color: '#fff' } : {}),
    ...(variant === 'red'     ? { background: '#c0392b', color: '#fff' } : {}),
    ...extra,
  });

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
    background: active ? '#16213e' : 'transparent',
    color: active ? '#fff' : '#7a7a8a',
    boxShadow: active ? '0 2px 8px rgba(26,26,46,0.25)' : 'none',
  });

  const navBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
    background: active ? '#c9a84c' : 'transparent',
    color: active ? '#1a1a2e' : '#7a7a8a',
  });

  return (
    <>
      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>

      <div style={s.wrap}>
        <div style={s.page}>

          {/* ── ENCABEZADO ── */}
          <div style={s.topBar}>
            <div>
              <h1 style={s.h1}>Préstamo de <span style={s.h1gold}>Documentos</span></h1>
              <p style={{ fontSize: 13, color: '#7a7a8a', marginTop: 4 }}>Registro y control de préstamos del archivo — Proinssalud</p>
            </div>
            <div style={{ display: 'flex', gap: 8, background: '#fff', padding: 6, borderRadius: 10, boxShadow: '0 2px 8px rgba(26,26,46,0.06)' }}>
              <button style={navBtn(vista === 'tabla')} onClick={() => setVista('tabla')}>📋 Préstamos</button>
              <button style={navBtn(vista === 'informe')} onClick={() => setVista('informe')}>📊 Informe Mensual</button>
            </div>
          </div>

          {/* ── STATS ── */}
          <div style={s.statsGrid}>
            {[
              { label: 'Total', val: stats.total, sub: 'Registrados', color: '#c9a84c' },
              { label: 'Pendientes', val: stats.pendiente, sub: 'Sin devolver', color: '#c0392b' },
              { label: 'Devueltos', val: stats.devuelto, sub: 'Completados', color: '#1a6b3c' },
              { label: 'Vencidos', val: stats.vencido, sub: 'Pasaron fecha límite', color: '#7f1d1d' },
              { label: 'Este mes', val: stats.mes, sub: 'Préstamos', color: '#1a3a6b' },
            ].map(({ label, val, sub, color }) => (
              <div key={label} style={{ ...s.statCard, borderLeftColor: color }}>
                <div style={s.statLabel}>{label}</div>
                <div style={{ ...s.statVal, color }}>{val}</div>
                <div style={s.statSub}>{sub}</div>
              </div>
            ))}
          </div>

          {/* ══════════════════════════════════════
              VISTA: TABLA
          ══════════════════════════════════════ */}
          {vista === 'tabla' && (
            <>
              <div style={s.toolbar}>
                <button style={btn('primary')} onClick={abrirModalNuevo}>➕ Nuevo Préstamo</button>
                <button style={btn('outline')} onClick={fetchPrestamos}>🔄 Actualizar</button>
                <div style={s.searchBox}>
                  <span style={{ color: '#7a7a8a' }}>🔍</span>
                  <input
                    type="text" placeholder="Buscar contrato, solicitante..."
                    value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
                    style={{ border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 13, width: 220, background: 'transparent' }}
                  />
                </div>
              </div>

              {/* Filtros */}
              <div style={s.tabs}>
                {[['todos','Todos'],['PENDIENTE','⏳ Pendientes'],['DEVUELTO','✅ Devueltos'],['VENCIDO','⚠️ Vencidos']].map(([k, l]) => (
                  <button key={k} style={tabBtn(filtro === k)} onClick={() => { setFiltro(k); setPagina(1); }}>{l}</button>
                ))}
              </div>

              {/* Tabla */}
              <div style={s.tableWrap}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['#','Fecha Solicitud','Tipo Doc.','Contrato','Solicitante','Tipo','Dependencia','Devolver','Estado','Acciones'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slice.length === 0 ? (
                      <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#7a7a8a' }}>📭 No hay préstamos en esta categoría</td></tr>
                    ) : slice.map(p => (
                      <tr key={p.id} style={{ transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#faf8f4')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td style={s.td}><b>{p.id}</b></td>
                        <td style={s.td}>{fmt(p.fechaSolicitud)}</td>
                        <td style={s.td}>{p.tipoDoc || '—'}</td>
                        <td style={s.td}><b>{p.contrato || '—'}</b></td>
                        <td style={s.td}>{p.solicitante || '—'}</td>
                        <td style={s.td}>
                          <span style={{ fontWeight: 700, color: p.tipoUsuario === 'INTERNO' ? '#1a3a6b' : '#6b3a1a' }}>{p.tipoUsuario}</span>
                        </td>
                        <td style={s.td}>{p.dependencia || '—'}</td>
                        <td style={s.td}>{fmtCorta(p.fechaDevolver)}</td>
                        <td style={s.td}><Badge estado={p.estado} /></td>
                        <td style={s.td}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {p.estado !== 'DEVUELTO' && (
                              <button style={btn('green', { padding: '4px 10px', fontSize: 11 })} onClick={() => abrirDevolucion(p.id)}>↩ Devolver</button>
                            )}
                            <button style={btn('gold', { padding: '4px 10px', fontSize: 11 })} onClick={() => generarPDF(p)}>📄 PDF</button>
                            <button style={btn('red', { padding: '4px 10px', fontSize: 11 })} onClick={() => eliminar(p.id)}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginación */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #f0ede8', fontSize: 12, color: '#7a7a8a' }}>
                  <span>Mostrando {slice.length} de {filtrados.length} registros</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: totalPags }, (_, i) => i + 1).map(n => (
                      <button key={n} onClick={() => setPagina(n)}
                        style={{ width: 28, height: 28, borderRadius: 6, border: '1.5px solid', borderColor: pagina === n ? '#16213e' : '#ede8df', background: pagina === n ? '#16213e' : 'transparent', color: pagina === n ? '#fff' : '#7a7a8a', fontSize: 12, cursor: 'pointer' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════
              VISTA: INFORME
          ══════════════════════════════════════ */}
          {vista === 'informe' && (
            <>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                <select value={informeMes} onChange={e => setInformeMes(+e.target.value)}
                  style={{ ...s.fInput, width: 'auto', minWidth: 130 }}>
                  {meses.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={informeAnio} onChange={e => setInformeAnio(+e.target.value)}
                  style={{ ...s.fInput, width: 'auto' }}>
                  {[2024, 2025, 2026].map(a => <option key={a}>{a}</option>)}
                </select>
                <span style={{ fontSize: 13, color: '#7a7a8a' }}>{filtradosInforme.length} préstamos en {meses[informeMes]} {informeAnio}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Gráfico semanas */}
                <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 4px 16px rgba(26,26,46,0.08)' }}>
                  <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 16, marginBottom: 16, color: '#16213e' }}>Préstamos por semana</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
                    {semanas.map((v, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{v}</span>
                        <div style={{ width: '100%', background: 'linear-gradient(to top, #16213e, #2a3f6f)', borderRadius: '4px 4px 0 0', height: Math.round((v / maxSem) * 110) || 4 }}></div>
                        <span style={{ fontSize: 10, color: '#7a7a8a' }}>Sem {i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tipo usuario */}
                <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 4px 16px rgba(26,26,46,0.08)' }}>
                  <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 16, marginBottom: 20, color: '#16213e' }}>Por tipo de usuario</div>
                  {[['🏢 Interno', interno, '#16213e'], ['🌐 Externo', externo, '#c9a84c']].map(([label, val, color]) => (
                    <div key={label as string} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                        <span>{label as string}</span><span style={{ color: '#7a7a8a' }}>{val as number}</span>
                      </div>
                      <div style={{ height: 10, background: '#f0ede8', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round((val as number) / (interno + externo || 1) * 100)}%`, background: color as string, borderRadius: 99, transition: 'width 0.6s' }}></div>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 20, textAlign: 'center', background: '#f8f5f0', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#16213e' }}>{filtradosInforme.length}</div>
                    <div style={{ fontSize: 11, color: '#7a7a8a', textTransform: 'uppercase', letterSpacing: 1 }}>Total del mes</div>
                  </div>
                </div>
              </div>

              {/* Tabla informe */}
              <div style={s.tableWrap}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['#','Fecha','Contrato','Solicitante','Tipo','Para devolver','Estado'].map(h => <th key={h} style={s.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filtradosInforme.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#7a7a8a' }}>📭 Sin préstamos en este período</td></tr>
                    ) : filtradosInforme.map((p, i) => (
                      <tr key={p.id}>
                        <td style={s.td}>{i + 1}</td>
                        <td style={s.td}>{fmt(p.fechaSolicitud)}</td>
                        <td style={s.td}><b>{p.contrato || p.tipoDoc || '—'}</b></td>
                        <td style={s.td}>{p.solicitante || '—'}</td>
                        <td style={s.td}><span style={{ fontWeight: 700, color: p.tipoUsuario === 'INTERNO' ? '#1a3a6b' : '#6b3a1a' }}>{p.tipoUsuario}</span></td>
                        <td style={s.td}>{fmtCorta(p.fechaDevolver)}</td>
                        <td style={s.td}><Badge estado={p.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          MODAL: NUEVO PRÉSTAMO
      ══════════════════════════════════════ */}
      {modalNuevo && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModalNuevo(false); }}>
          <div style={s.modal}>
            <div style={s.modalHdr}>
              <h2 style={s.modalTitle}>📋 Registrar Préstamo</h2>
              <button onClick={() => setModalNuevo(false)} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #ede8df', background: 'transparent', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <div style={s.modalBody}>

              {/* Sección I */}
              <div style={s.fSection}>
                <div style={s.fSecTitle}>📄 I. Solicitud del Documento</div>
                <div style={{ ...s.fRow, gridTemplateColumns: '1fr' }}>
                  <div><label style={s.fLabel}>Tipo de documento *</label>
                    <input style={s.fInput} value={fTipoDoc} onChange={e => setFTipoDoc(e.target.value.toUpperCase())} placeholder="Ej: Contrato, Acta, Resolución..."/>
                  </div>
                </div>
                <div style={{ ...s.fRow, gridTemplateColumns: '1fr 1fr' }}>
                  <div>
                    <label style={s.fLabel}>Tipo de usuario *</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['INTERNO', 'EXTERNO'] as const).map(t => (
                        <div key={t} onClick={() => setFTipoUsuario(t)}
                          style={{ flex: 1, padding: '9px', borderRadius: 8, border: `2px solid ${fTipoUsuario === t ? '#16213e' : '#ede8df'}`, background: fTipoUsuario === t ? '#16213e' : '#fff', color: fTipoUsuario === t ? '#fff' : '#1a1a2e', textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}>
                          {t === 'INTERNO' ? '🏢 Interno' : '🌐 Externo'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div><label style={s.fLabel}>Extensión / Teléfono</label>
                    <input style={s.fInput} value={fTelefono} onChange={e => setFTelefono(e.target.value)} placeholder="Ext. 1234"/>
                  </div>
                </div>
                <div style={{ ...s.fRow, gridTemplateColumns: '1fr 1fr' }}>
                  <div><label style={s.fLabel}>Dependencia *</label>
                    <input style={s.fInput} value={fDependencia} onChange={e => setFDependencia(e.target.value.toUpperCase())} placeholder="Nombre dependencia..."/>
                  </div>
                  <div><label style={s.fLabel}>Nombre quien solicita *</label>
                    <input style={s.fInput} value={fSolicitante} onChange={e => setFSolicitante(e.target.value.toUpperCase())} placeholder="Nombre completo..."/>
                  </div>
                </div>
                <div style={{ ...s.fRow, gridTemplateColumns: '1fr 1fr' }}>
                  <div><label style={s.fLabel}>Cédula del solicitante</label>
                    <input style={s.fInput} value={fCedula} onChange={e => setFCedula(e.target.value)} placeholder="CC. 1234567890"/>
                  </div>
                  <div><label style={s.fLabel}>Fecha y hora de solicitud</label>
                    <input style={{ ...s.fInput, background: '#f0ede8', color: '#7a7a8a' }} value={fFechaSolicitud} readOnly/>
                  </div>
                </div>
              </div>

              {/* Sección II */}
              <div style={s.fSection}>
                <div style={s.fSecTitle}>🗂️ II. Registro del Préstamo</div>
                <div style={{ ...s.fRow, gridTemplateColumns: '1fr 1fr' }}>
                  <div style={{ position: 'relative' }}>
                    <label style={s.fLabel}>Contrato (buscar)</label>
                    <input style={s.fInput} value={fContratoBuscar} onChange={e => buscarContrato(e.target.value)} placeholder="Buscar contrato..."/>
                    {suggestions.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #ede8df', borderRadius: 8, maxHeight: 160, overflowY: 'auto', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                        {suggestions.map(c => (
                          <div key={c.id} onClick={() => selContr(c)}
                            style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f0ede8' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#faf8f4')}
                            onMouseLeave={e => (e.currentTarget.style.background = '')}>
                            <b>{c.contrato}</b> <span style={{ color: '#7a7a8a', fontSize: 11 }}>ID: {c.id}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div><label style={s.fLabel}>ID Contrato</label>
                    <input style={{ ...s.fInput, background: '#f0ede8', color: '#7a7a8a' }} value={fContratoId} readOnly placeholder="Se completa al seleccionar"/>
                  </div>
                </div>
                <div style={{ ...s.fRow, gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div><label style={s.fLabel}>Quien presta</label>
                    <input style={s.fInput} value={fQuienPresta} onChange={e => setFQuienPresta(e.target.value.toUpperCase())} placeholder="Funcionario..."/>
                  </div>
                  <div><label style={s.fLabel}>Fecha préstamo</label>
                    <input style={{ ...s.fInput, background: '#f0ede8', color: '#7a7a8a' }} value={fFechaSolicitud} readOnly/>
                  </div>
                  <div><label style={s.fLabel}>Para devolver el día *</label>
                    <input type="date" style={s.fInput} value={fFechaDevolver} onChange={e => setFFechaDevolver(e.target.value)}/>
                  </div>
                </div>
              </div>

            </div>
            <div style={s.modalFoot}>
              <button style={btn('outline')} onClick={() => setModalNuevo(false)}>Cancelar</button>
              <button style={btn('primary')} onClick={guardarPrestamo} disabled={loading}>
                {loading ? '⏳ Guardando...' : '💾 Guardar Préstamo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL: DEVOLUCIÓN
      ══════════════════════════════════════ */}
      {modalDev && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModalDev(false); }}>
          <div style={{ ...s.modal, maxWidth: 480 }}>
            <div style={s.modalHdr}>
              <h2 style={s.modalTitle}>✅ Registrar Devolución</h2>
              <button onClick={() => setModalDev(false)} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #ede8df', background: 'transparent', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.fSection}>
                <div style={s.fSecTitle}>📦 III. Devolución del Documento</div>
                <div style={{ ...s.fRow, gridTemplateColumns: '1fr 1fr' }}>
                  <div><label style={s.fLabel}>Devuelto el día</label>
                    <input style={{ ...s.fInput, background: '#f0ede8', color: '#7a7a8a' }} value={now()} readOnly/>
                  </div>
                  <div><label style={s.fLabel}>Firma de quien devuelve *</label>
                    <input style={s.fInput} value={devFirma} onChange={e => setDevFirma(e.target.value.toUpperCase())} placeholder="Nombre..."/>
                  </div>
                </div>
                <div style={{ ...s.fRow, gridTemplateColumns: '1fr' }}>
                  <div><label style={s.fLabel}>Quien atiende la devolución *</label>
                    <input style={s.fInput} value={devAtiende} onChange={e => setDevAtiende(e.target.value.toUpperCase())} placeholder="Funcionario..."/>
                  </div>
                </div>
                <div><label style={s.fLabel}>Observaciones</label>
                  <textarea style={{ ...s.fInput, resize: 'vertical', minHeight: 60 }} value={devObs} onChange={e => setDevObs(e.target.value.toUpperCase())} placeholder="Estado del documento..."/>
                </div>
              </div>
            </div>
            <div style={s.modalFoot}>
              <button style={btn('outline')} onClick={() => setModalDev(false)}>Cancelar</button>
              <button style={btn('green')} onClick={confirmarDevolucion} disabled={loading}>
                {loading ? '⏳ Guardando...' : '✅ Confirmar Devolución'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ ...s.toastBase, background: toast.tipo === 'error' ? '#7f1d1d' : '#16213e', borderLeft: `4px solid ${toast.tipo === 'error' ? '#c0392b' : '#1a6b3c'}`, color: '#fff' }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}