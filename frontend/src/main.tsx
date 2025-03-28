import { CssBaseline } from '@mui/material'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app.tsx'
import { ThemeProvider } from './components/theme/theme-provider'
import { DataProvider } from './data/data-provider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <ThemeProvider>
        <CssBaseline enableColorScheme />
        <App />
      </ThemeProvider>
    </DataProvider>
  </StrictMode>,
)
