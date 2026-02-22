/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    CONFIGURACIÓN VITE - FRONTEND ERP PAPAS                   ║
 * ║                                                                              ║
 * ║  🏠 DESARROLLO LOCAL:                                                        ║
 * ║     - Puerto: 3020                                                            ║
 * ║     - Usa .env o .env.development                                             ║
 * ║     - Comando: npm run dev                                                    ║
 * ║                                                                              ║
 * ║  🚀 PRODUCCIÓN (Railway):                                                    ║
 * ║     - Usa .env.production                                                     ║
 * ║     - Comando: npm run build                                                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Detectar entorno
  const isDev = mode === 'development'

  // Log de configuración (solo en desarrollo)
  if (isDev) {
    console.log('')
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║  🏠 FRONTEND ERP PAPAS - DESARROLLO LOCAL                    ║')
    console.log('║  📡 Conectando a backend LOCAL: http://localhost:4020        ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')
    console.log('')
  }

  return {
    plugins: [react()],

    // ========================================================================
    // ALIAS DE RUTAS
    // ========================================================================
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@mocks': path.resolve(__dirname, './src/mocks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@features': path.resolve(__dirname, './src/features')
      }
    },

    // ========================================================================
    // CONFIGURACIÓN DEL SERVIDOR DE DESARROLLO
    // ========================================================================
    server: {
      // 🏠 Puerto de desarrollo local
      port: 3020,
      // Escuchar en todas las interfaces de red
      host: true,
      // Abrir navegador automáticamente
      open: true,
      // Configuración de proxy (opcional, por si se necesita)
      // proxy: {
      //   '/api': {
      //     target: 'http://localhost:4020',
      //     changeOrigin: true
      //   }
      // }
    },

    // ========================================================================
    // CONFIGURACIÓN DE BUILD (PRODUCCIÓN)
    // ========================================================================
    build: {
      // Directorio de salida
      outDir: 'dist',
      // Generar sourcemaps solo en desarrollo
      sourcemap: isDev,
      // Optimizaciones de producción
      minify: !isDev ? 'esbuild' : false
    },

    // ========================================================================
    // DEFINICIÓN DE VARIABLES DE ENTORNO
    // ========================================================================
    define: {
      // Exponer modo de desarrollo a la aplicación
      '__DEV__': isDev
    }
  }
})
