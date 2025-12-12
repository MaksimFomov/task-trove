import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Обновлять при возврате на вкладку
      refetchOnMount: true, // Обновлять при монтировании компонента
      retry: 1,
      staleTime: 30000, // Данные считаются устаревшими через 30 секунд
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster 
        position="top-right"
        containerStyle={{
          zIndex: 10000,
        }}
        toastOptions={{
          style: {
            zIndex: 10000,
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
)

