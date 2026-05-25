import { useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { IconButton, Box } from '@mui/material'
import { Brightness4, Brightness7 } from '@mui/icons-material'
import './App.css'
import TableBasic from './components/TableBasic'
import Prestamos from './components/Prestamos'

type Pagina = 'contratos' | 'prestamos'

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [pagina, setPagina] = useState<Pagina>('contratos')

  const toggleDarkMode = () => setDarkMode(!darkMode)

  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#1976d2' },
      background: { default: '#ffffff', paper: '#f8f9fa' },
      text: { primary: '#333333', secondary: '#666666' },
    },
    components: {
      MuiTableContainer: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          },
        },
      },
      MuiTableHead: { styleOverrides: { root: { backgroundColor: '#f5f5f5' } } },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:nth-of-type(even)': { backgroundColor: '#fafafa' },
            '&:hover': { backgroundColor: '#f0f0f0' },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: { fontWeight: 600, color: '#424242', borderBottom: '2px solid #e0e0e0' },
          body: { color: '#333333' },
        },
      },
    },
  })

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: { main: '#90caf9' },
      background: { default: '#121212', paper: '#1e1e1e' },
      text: { primary: '#ffffff', secondary: '#b3b3b3' },
    },
    components: {
      MuiTableContainer: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            borderRadius: '8px',
            border: '1px solid #333333',
          },
        },
      },
      MuiTableHead: { styleOverrides: { root: { backgroundColor: '#2a2a2a' } } },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:nth-of-type(even)': { backgroundColor: '#252525' },
            '&:hover': { backgroundColor: '#333333' },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: { fontWeight: 600, color: '#ffffff', borderBottom: '2px solid #444444' },
          body: { color: '#ffffff' },
        },
      },
    },
  })

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        transition: 'background-color 0.3s ease',
      }}>

        {/* ── BARRA DE NAVEGACIÓN SUPERIOR ── */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3, py: 1,
          borderBottom: '1px solid',
          borderColor: darkMode ? '#333' : '#e0e0e0',
          backgroundColor: darkMode ? '#1a1a2e' : '#16213e',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '8px',
              background: 'linear-gradient(135deg, #c9a84c, #e8c76b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>📋</Box>
            <Box>
              <Box sx={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.1 }}>Proinssalud</Box>
              <Box sx={{ color: '#c9a84c', fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Gestión Documental</Box>
            </Box>
          </Box>

          {/* Navegación central */}
          <Box sx={{ display: 'flex', gap: 1, background: 'rgba(255,255,255,0.07)', borderRadius: '10px', p: '5px' }}>
            {[
              { key: 'contratos', label: '📊 Base de Datos' },
              { key: 'prestamos', label: '📋 Préstamos' },
            ].map(({ key, label }) => (
              <Box
                key={key}
                onClick={() => {
                        if (key === 'prestamos') {
                          window.location.href = '/src/components/contratos_2.html'
                          return
                        }

                        setPagina(key as Pagina)
                      }}
                sx={{
                  px: 2.5, py: 0.8,
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: pagina === key ? 'linear-gradient(135deg, #c9a84c, #e8c76b)' : 'transparent',
                  color: pagina === key ? '#1a1a2e' : 'rgba(255,255,255,0.7)',
                  '&:hover': { color: '#fff', background: pagina === key ? undefined : 'rgba(255,255,255,0.1)' },
                }}
              >
                {label}
              </Box>
            ))}
          </Box>

          {/* Botón tema */}
          <IconButton
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            sx={{
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.8)',
              '&:hover': { background: 'rgba(255,255,255,0.1)' },
            }}
          >
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Box>

        {/* ── CONTENIDO ── */}
        <Box sx={{ p: pagina === 'prestamos' ? 0 : 2 }}>
          {pagina === 'contratos' && <TableBasic />}
          {pagina === 'prestamos' && <Prestamos />}
        </Box>

      </Box>
    </ThemeProvider>
  )
}

export default App