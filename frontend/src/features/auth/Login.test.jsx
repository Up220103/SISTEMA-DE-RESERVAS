import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'

vi.mock('../../services/api.js', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}))

const api = (await import('../../services/api.js')).default
const { default: authReducer } = await import('./authSlice.js')
const { default: Login } = await import('./Login.jsx')

function renderLogin() {
  const store = configureStore({ reducer: { auth: authReducer } })
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </Provider>,
  )
  return store
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Pantalla de Login', () => {
  test('muestra los campos de correo, contrasena y el boton', () => {
    renderLogin()

    expect(screen.getByLabelText(/correo institucional/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contrase/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  test('al enviar el formulario llama al endpoint del backend', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({
      data: { token: 'jwt-abc', user: { usuario_id: 1, rol_id: 1 } },
    })
    renderLogin()

    await user.type(screen.getByLabelText(/correo institucional/i), 'up220101@alumnos.upa.edu.mx')
    await user.type(screen.getByLabelText(/contrase/i), 'upa12345')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'up220101@alumnos.upa.edu.mx',
      password: 'upa12345',
    })
  })

  test('muestra el mensaje de error que devuelve el backend', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValue({
      response: { status: 401, data: { message: 'Correo o contrasena incorrectos.' } },
    })
    renderLogin()

    await user.type(screen.getByLabelText(/correo institucional/i), 'up220101@alumnos.upa.edu.mx')
    await user.type(screen.getByLabelText(/contrase/i), 'incorrecta')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(await screen.findByText('Correo o contrasena incorrectos.')).toBeInTheDocument()
  })
})
