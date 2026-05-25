import {
  MRT_ColumnDef,
  MaterialReactTable,
  useMaterialReactTable,
  MRT_Localization,
  MRT_Row,
} from "material-react-table";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Container,
  SelectChangeEvent,
} from "@mui/material";
import { useEffect, useMemo, useState, ChangeEvent } from "react";
import axios from "axios";
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete'; // Nuevo Icono
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// --- LOCALIZACIÓN COMPLETA (Mantenida tal cual la tenías) ---
const MRT_Localization_ES: Partial<MRT_Localization> = {
  actions: 'Acciones',
  and: 'y',
  cancel: 'Cancelar',
  changeFilterMode: 'Cambiar modo de filtro',
  changeSearchMode: 'Cambiar modo de búsqueda',
  clearFilter: 'Limpiar filtro',
  clearSearch: 'Limpiar búsqueda',
  clearSort: 'Limpiar ordenamiento',
  clickToCopy: 'Hacer clic para copiar',
  collapse: 'Contraer',
  collapseAll: 'Contraer todo',
  columnActions: 'Acciones de columna',
  copiedToClipboard: 'Copiado al portapapeles',
  dropToGroupBy: 'Soltar para agrupar por {column}',
  edit: 'Editar',
  expand: 'Expandir',
  expandAll: 'Expandir todo',
  filterArrIncludes: 'Incluye',
  filterArrIncludesAll: 'Incluye todo',
  filterArrIncludesSome: 'Incluye alguno',
  filterBetween: 'Entre',
  filterBetweenInclusive: 'Entre (inclusivo)',
  filterByColumn: 'Filtrar por {column}',
  filterContains: 'Contiene',
  filterEmpty: 'Vacío',
  filterEndsWith: 'Termina con',
  filterEquals: 'Igual a',
  filterEqualsString: 'Igual a',
  filterFuzzy: 'Búsqueda difusa',
  filterGreaterThan: 'Mayor que',
  filterGreaterThanOrEqualTo: 'Mayor o igual que',
  filterInNumberRange: 'En rango numérico',
  filterIncludesString: 'Incluye',
  filterIncludesStringSensitive: 'Incluye (sensible)',
  filterLessThan: 'Menor que',
  filterLessThanOrEqualTo: 'Menor o igual que',
  filterMode: 'Modo de filtro: {filterType}',
  filterNotEmpty: 'No vacío',
  filterNotEquals: 'No igual a',
  filterStartsWith: 'Comienza con',
  filterWeakEquals: 'Igual',
  filteringByColumn: 'Filtrando por {column} - {filterType} - {filterValue}',
  goToFirstPage: 'Ir a la primera página',
  goToLastPage: 'Ir a la última página',
  goToNextPage: 'Ir a la página siguiente',
  goToPreviousPage: 'Ir a la página anterior',
  grab: 'Agarrar',
  groupByColumn: 'Agrupar por {column}',
  groupedBy: 'Agrupado por ',
  hideAll: 'Ocultar todo',
  hideColumn: 'Ocultar columna {column}',
  max: 'Máximo',
  min: 'Mínimo',
  move: 'Mover',
  noRecordsToDisplay: 'No hay registros para mostrar',
  noResultsFound: 'No se encontraron resultados',
  of: 'de',
  or: 'o',
  pinToLeft: 'Anclar a la izquierda',
  pinToRight: 'Anclar a la derecha',
  resetColumnSize: 'Restablecer tamaño de columna',
  resetOrder: 'Restablecer orden',
  rowActions: 'Acciones de fila',
  rowNumber: '#',
  rowNumbers: 'Números de fila',
  rowsPerPage: 'Filas por página',
  save: 'Guardar',
  search: 'Buscar',
  select: 'Seleccionar',
  selectedCountOfRowCountRowsSelected: '{selectedCount} de {rowCount} filas seleccionadas',
  showAll: 'Mostrar todo',
  showAllColumns: 'Mostrar todas las columnas',
  showHideColumns: 'Mostrar/Ocultar columnas',
  showHideFilters: 'Mostrar/Ocultar filtros',
  showHideSearch: 'Mostrar/Ocultar búsqueda',
  sortByColumnAsc: 'Ordenar por {column} ascendente',
  sortByColumnDesc: 'Ordenar por {column} descendente',
  sortedByColumnAsc: 'Ordenado por {column} ascendente',
  sortedByColumnDesc: 'Ordenado por {column} descendente',
  thenBy: ', luego por ',
  toggleDensity: 'Alternar densidad',
  toggleFullScreen: 'Alternar pantalla completa',
  toggleSelectAll: 'Alternar seleccionar todo',
  toggleSelectRow: 'Alternar selección de fila',
  toggleVisibility: 'Alternar visibilidad',
  ungroupByColumn: 'Desagrupar por {column}',
  unpin: 'Desanclar',
  unpinAll: 'Desanclar todo',
};

interface IContrato {
  id: string;
  fecha: string;
  caja: string;
  carpeta: string;
  contrato: string;
  tomo: string;
  representante: string;
  observacion: string;
}

function TableBasic() {
  const [data, setData] = useState<IContrato[]>([]);
  const [open, setOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false); // Nuevo
  const [rowToDelete, setRowToDelete] = useState<IContrato | null>(null); // Nuevo
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<IContrato | null>(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialData, setHistorialData] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const [caja, setCaja] = useState('');
  const [carpeta, setCarpeta] = useState('');
  const [contrato, setContrato] = useState('');
  const [tomo, setTomo] = useState('');
  const [representante, setRepresentante] = useState('');
  const [observacion, setObservacion] = useState('');
  const [fecha, setFecha] = useState('');

  const tomoOptions = [
    'NO TIENE', 'TOMO I', 'TOMO II', 'TOMO III', 'TOMO IV', 'TOMO V',
    'TOMO VI', 'TOMO VII', 'TOMO VIII', 'TOMO IX', 'TOMO X',
    'TOMO XI', 'TOMO XII', 'TOMO XIII', 'TOMO XIV', 'TOMO XV',
    'TOMO XVI', 'TOMO XVII', 'TOMO XVIII', 'TOMO XIX', 'TOMO XX'
  ];

  const getNextId = (): number => {
  if (data.length === 0) return 1;
  const ids = data.map(item => parseInt(item.id) || 0).filter(n => !isNaN(n));
  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  };

  const getCurrentDateTime = (): string => {
    const now = new Date();
    return now.toLocaleString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const handleNumericInput = (value: string, setter: (val: string) => void) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setter(numericValue);
  };

  const handleEdit = (row: IContrato) => {
    setEditingRow(row);
    setCaja(row.caja);
    setCarpeta(row.carpeta);
    setContrato(row.contrato);
    setTomo(row.tomo);
    setRepresentante(row.representante);
    setObservacion(row.observacion);
    setFecha(getCurrentDateTime());
    setOpen(true);
  };

  // --- NUEVA FUNCIÓN DE ELIMINACIÓN ---
  const handleDelete = async () => {
    if (!rowToDelete) return;
    setLoading(true);
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbxkFeyjfcIMLH4zHoztIT_r-IpjWB8r5sg54J6GlPXywq7rn_QLYKrQyVXXaUEqFeX_eQ/exec';

    try {
      const response = await axios.get(`${GAS_URL}?action=delete&id=${rowToDelete.id}`);
      if (response.data.success) {
        setConfirmDeleteOpen(false);
        fetchData();
      } else {
        alert("Error: " + response.data.error);
      }
    } catch (error: any) {
      alert("Error al conectar con el servidor: " + error.message);
    } finally {
      setLoading(false);
    }
  };


  const fetchHistorial = async () => {
  setLoadingHistorial(true);
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbxkFeyjfcIMLH4zHoztIT_r-IpjWB8r5sg54J6GlPXywq7rn_QLYKrQyVXXaUEqFeX_eQ/exec';
  try {
    const response = await axios.get(`${GAS_URL}?action=getHistory`);
    if (response.data.success) {
      setHistorialData(response.data.data);
    }
  } catch (error) {
    console.error("Error al obtener historial:", error);
  } finally {
    setLoadingHistorial(false);
  }
};

  const clearForm = () => {
    setCaja(''); setCarpeta(''); setContrato(''); setTomo('');
    setRepresentante(''); setObservacion(''); setFecha('');
    setEditingRow(null);
  };

  const handleSubmit = async () => {
    const camposFaltantes = [];
    if (!caja) camposFaltantes.push("Caja");
    if (!carpeta) camposFaltantes.push("Carpeta");
    if (!contrato) camposFaltantes.push("Contrato");
    if (!tomo) camposFaltantes.push("Tomo");
    if (!representante) camposFaltantes.push("Representante");

    if (camposFaltantes.length > 0) {
      alert(`Por favor, completa los siguientes campos: ${camposFaltantes.join(", ")}`);
      return;
    }
    setLoading(true);
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbxkFeyjfcIMLH4zHoztIT_r-IpjWB8r5sg54J6GlPXywq7rn_QLYKrQyVXXaUEqFeX_eQ/exec';
    const action = editingRow ? 'edit' : 'add';
    const id = editingRow ? editingRow.id : '';
    const params = new URLSearchParams({
      action, id, fecha: getCurrentDateTime(),
      caja, carpeta, contrato, tomo, representante, observacion
    });

    try {
      const response = await axios.get(`${GAS_URL}?${params.toString()}`);
      if (response.data.success) {
        setOpen(false); clearForm(); fetchData();
      } else {
        throw new Error(response.data.error || 'Error desconocido');
      }
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    const API_KEY = 'AIzaSyDmnlKUIQXcKDghVXxl8urYX57uj6kPvO0';
    const SHEET_ID = '12bK87flqbGDaF4QSPdeJBUrZD2GdNkOapfdwwmhITnc';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/CONTRATOS?key=${API_KEY}`;
    try {
      const response = await axios.get(url);
      const rows = response.data.values || [];
      const formattedData: IContrato[] = rows.slice(1).map((row: string[]) => ({
        id: row[0] || "", fecha: row[1] || "", caja: row[2] || "",
        carpeta: row[3] || "", contrato: row[4] || "", tomo: row[5] || "",
        representante: row[6] || "", observacion: row[7] || "",
      }));
      setData(formattedData);
    } catch (error) { console.error("Error al obtener datos:", error); }
  };

  useEffect(() => { fetchData(); }, []);

  const columns = useMemo<MRT_ColumnDef<IContrato>[]>(() => [
    { accessorKey: "id", header: "ID", size: 80 },
    { accessorKey: "fecha", header: "FECHA", size: 150 },
    { accessorKey: "caja", header: "CAJA", size: 100 },
    { accessorKey: "carpeta", header: "CARPETA", size: 120 },
    {
      accessorKey: "contrato", header: "CONTRATO",
      muiTableBodyCellProps: { sx: { whiteSpace: 'normal', wordBreak: 'break-word' } },
      muiTableHeadCellProps: { sx: { whiteSpace: 'normal', wordBreak: 'break-word' } },
    },
    { accessorKey: "tomo", header: "TOMO", size: 130 },
    {
      accessorKey: "representante", header: "REPRESENTANTE",
      muiTableBodyCellProps: { sx: { whiteSpace: 'normal', wordBreak: 'break-word' } },
      muiTableHeadCellProps: { sx: { whiteSpace: 'normal', wordBreak: 'break-word' } },
    },
    {
        accessorKey: "observacion",
        header: "OBSERVACIÓN",
        muiTableBodyCellProps: { sx: { whiteSpace: 'normal', wordBreak: 'break-word' } },
        muiTableHeadCellProps: { sx: { whiteSpace: 'normal', wordBreak: 'break-word' } },
      },
  ], []);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contratos');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const file = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(file, 'Contratos.xlsx');
  };

  const table = useMaterialReactTable({
    columns,
    data,
    localization: MRT_Localization_ES,
    enableColumnOrdering: true,
    enableGlobalFilter: true,
    enableSorting: true,
    initialState: { pagination: { pageSize: 10, pageIndex: 0 } },
    muiSearchTextFieldProps: {
      placeholder: 'Buscar en todos los campos...',
      sx: {
        minWidth: '400px',
        '& .MuiOutlinedInput-root': {
          borderRadius: '25px', backgroundColor: '#f8f9fa',
          '&:hover': { backgroundColor: '#e9ecef' }
        }
      }
    },
    renderTopToolbarCustomActions: () => (
      <Stack direction="row" spacing={2} alignItems="center">
        <Button
          onClick={() => { clearForm(); setFecha(getCurrentDateTime()); setOpen(true); }}
          variant="contained" startIcon={<AddIcon />}
          sx={{
            borderRadius: '25px', px: 4, py: 1.5, fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 6px 20px rgba(102,126,234,0.4)',
            '&:hover': { transform: 'translateY(-2px)' }
          }}
        >
          ➕ Agregar Contrato
        </Button>
        <Button 
          onClick={exportToExcel} variant="outlined" 
          sx={{ borderRadius: '25px', px: 3, borderColor: '#4caf50', color: '#2e7d32' }}
        >
          📥 Descargar Excel
        </Button>

        
        {/* Botón Ver Drive */}
        <Button 
          onClick={() => window.open('https://docs.google.com/spreadsheets/d/12bK87flqbGDaF4QSPdeJBUrZD2GdNkOapfdwwmhITnc/edit?gid=0#gid=0', '_blank')}
          variant="outlined"
          sx={{ borderRadius: '25px', px: 4 }}
        >
          🔗 Ver Drive
        </Button>
        <Button
          onClick={() => { fetchHistorial(); setHistorialOpen(true); }}
          variant="outlined"
          sx={{ borderRadius: '25px', px: 3, borderColor: '#764ba2', color: '#764ba2' }}
        >
          🕐 Ver Historial
        </Button>

      </Stack>
    ),
    enableRowActions: true,
    positionActionsColumn: 'first',
    renderRowActions: ({ row }: { row: MRT_Row<IContrato> }) => (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Editar">
          <IconButton onClick={() => handleEdit(row.original)} sx={{ color: '#667eea' }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton 
            onClick={() => { setRowToDelete(row.original); setConfirmDeleteOpen(true); }} 
            sx={{ color: '#f44336' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  });

  return (
    <Container maxWidth={false} sx={{ py: 4, width: '100%' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ fontWeight: '700', color: '#764ba2', WebkitTextStroke: '1px white', mb: 1 }}
        >
          📊 BASE DE DATOS CONTRATOS
        </Typography>
        <Typography variant="h6" color="text.secondary">Sistema de Gestión y Control</Typography>
      </Box>

      <MaterialReactTable table={table} />

      {/* MODAL PRINCIPAL (Mantenidos tus estilos de fondo e imagen) */}
      <Dialog 
        open={open} onClose={() => { setOpen(false); clearForm(); }} 
        fullWidth maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '16px', minHeight: '650px',
            backgroundImage: 'url("https://plus.unsplash.com/premium_photo-1701090940014-320b715b5a8c?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8dGV4dHVyYSUyMGdyaXN8ZW58MHx8MHx8fDA%3D")',
            backgroundSize: 'cover', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontSize: '2rem', fontWeight: '700', py: 4, color: '#000' }}>
          {editingRow ? '✏️ Editar Contrato' : '📋 Registrar Contrato'}
        </DialogTitle>
        <DialogContent sx={{ px: 5, pb: 4 }}>
          <Stack spacing={4} mt={1}>
            <TextField 
              label="📅 Fecha y Hora" value={fecha || getCurrentDateTime()} 
              InputProps={{ readOnly: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#f5f5f5' } }}
            />
            <Stack direction="row" spacing={3}>
              <TextField 
                label="📦 Caja" value={caja} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleNumericInput(e.target.value, setCaja)}
                required sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#fff' } }}
              />
              <TextField 
                label="📁 Carpeta" value={carpeta} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleNumericInput(e.target.value, setCarpeta)}
                required sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#fff' } }}
              />
            </Stack>
            <Stack direction="row" spacing={3}>
              <TextField 
                label="📄 Contrato" value={contrato} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setContrato(e.target.value.toUpperCase())}
                required sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#fff' } }}
              />
              <FormControl required sx={{ minWidth: '200px', '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#fff' } }}>
                <InputLabel>📚 Tomo</InputLabel>
                <Select value={tomo} label="📚 Tomo" onChange={(e: SelectChangeEvent) => setTomo(e.target.value)}>
                  {tomoOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <TextField 
              label="👤 Representante" value={representante} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRepresentante(e.target.value.toUpperCase())}
              required fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#fff' } }}
            />
            <TextField 
              label="📝 Observación" value={observacion} 
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setObservacion(e.target.value.toUpperCase())}
              multiline rows={3} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#fff' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 5, pb: 4 }}>
          <Button onClick={() => { setOpen(false); clearForm(); }} sx={{ color: '#d32f2f', fontWeight: 'bold' }}>❌ Cancelar</Button>
          <Button 
            onClick={handleSubmit} variant="contained" disabled={loading}
            sx={{ borderRadius: '25px', px: 4, background: 'linear-gradient(45deg, #667eea, #764ba2)' }}
          >
            {loading ? '⏳ Guardando...' : '💾 Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

        {/* MODAL HISTORIAL */}
<Dialog open={historialOpen} onClose={() => setHistorialOpen(false)} fullWidth maxWidth="md">
  <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.4rem' }}>
    🕐 Histórico de Cambios
  </DialogTitle>
  <DialogContent dividers>
    {loadingHistorial ? (
      <Typography textAlign="center" py={4}>⏳ Cargando historial...</Typography>
    ) : historialData.length === 0 ? (
      <Typography textAlign="center" py={4} color="text.secondary">
        No hay cambios registrados aún.
      </Typography>
    ) : (
      <Stack spacing={2}>
        {historialData.map((item: any, index: number) => {
          const deshecho = item.tipo?.includes('_DESHECHO');
          const esEliminado = item.tipo?.includes('ELIMINADO');
          return (
            <Box key={index} sx={{
              border: '1px solid',
              borderColor: deshecho ? '#e0e0e0' : esEliminado ? '#ffcdd2' : '#c8e6c9',
              borderRadius: '10px', p: 2,
              backgroundColor: deshecho ? '#fafafa' : esEliminado ? '#fff8f8' : '#f8fff8',
              opacity: deshecho ? 0.6 : 1,
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight="bold" sx={{
                  color: deshecho ? '#9e9e9e' : esEliminado ? '#d32f2f' : '#388e3c'
                }}>
                  {deshecho ? '↩️ Deshecho' : esEliminado ? '🗑️ Eliminado' : '✏️ Editado'}
                </Typography>
                <Typography variant="caption" color="text.secondary">{item.fecha}</Typography>
              </Stack>

              <Typography variant="body2" mt={0.5}>
                <b>Contrato:</b> {item.antes?.contrato || item.despues?.contrato} &nbsp;|&nbsp;
                <b>Representante:</b> {item.antes?.representante || item.despues?.representante}
              </Typography>

              {!deshecho && (
                <Stack direction="row" spacing={1} mt={1.5}>
                  <Button
                    size="small" variant="contained"
                    onClick={async () => {
                      const GAS_URL = 'https://script.google.com/macros/s/AKfycbxkFeyjfcIMLH4zHoztIT_r-IpjWB8r5sg54J6GlPXywq7rn_QLYKrQyVXXaUEqFeX_eQ/exec';
                      try {
                        const res = await axios.get(`${GAS_URL}?action=undo&accionId=${item.id}`);
                        if (res.data.success) {
                          fetchData();
                          fetchHistorial();
                        } else {
                          alert("Error: " + res.data.error);
                        }
                      } catch (err: any) {
                        alert("Error: " + err.message);
                      }
                    }}
                    sx={{ borderRadius: '20px', backgroundColor: '#f59e0b', '&:hover': { backgroundColor: '#d97706' } }}
                  >
                    ↩️ Deshacer
                  </Button>
                </Stack>
              )}
            </Box>
          );
        })}
      </Stack>
    )}
  </DialogContent>
  <DialogActions sx={{ p: 2 }}>
    <Button onClick={() => setHistorialOpen(false)} variant="contained"
      sx={{ borderRadius: '25px', background: 'linear-gradient(45deg, #667eea, #764ba2)' }}>
      Cerrar
    </Button>
  </DialogActions>
</Dialog>

      {/* NUEVO: DIÁLOGO DE CONFIRMACIÓN PARA ELIMINAR */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>¿Confirmar eliminación?</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que deseas eliminar el contrato <b>{rowToDelete?.contrato}</b>?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDeleteOpen(false)}>No, Cancelar</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={loading}>
            {loading ? 'Eliminando...' : 'Sí, Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default TableBasic;