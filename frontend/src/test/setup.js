// Configuracion comun de los tests del frontend.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

// Los slices leen y escriben localStorage: cada test arranca en limpio para
// que el orden de ejecucion no cambie el resultado.
beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})
