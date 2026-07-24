import { describe, test, expect, vi, beforeEach } from 'vitest'

// El slice importa el cliente axios: lo reemplazamos para no salir a la red.
vi.mock('../../services/api.js', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}))

const api = (await import('../../services/api.js')).default
const { default: authReducer, login, register, logout, selectIsAuthenticated, selectEsAlumno } =
  await import('./authSlice.js')

const estadoInicial = { user: null, token: null, status: 'idle', error: null }

const usuario = {
  usuario_id: 1,
  nombre: 'Ana',
  apellido: 'Garcia',
  email: 'up220101@alumnos.upa.edu.mx',
  rol_id: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('authSlice · reducers', () => {
  test('login.pending marca loading y limpia el error previo', () => {
    const estado = authReducer(
      { ...estadoInicial, error: 'Error anterior' },
      { type: login.pending.type },
    )

    expect(estado.status).toBe('loading')
    expect(estado.error).toBeNull()
  })

  test('login.fulfilled guarda usuario y token', () => {
    const estado = authReducer(estadoInicial, {
      type: login.fulfilled.type,
      payload: { token: 'jwt-123', user: usuario },
    })

    expect(estado.status).toBe('succeeded')
    expect(estado.token).toBe('jwt-123')
    expect(estado.user.email).toBe('up220101@alumnos.upa.edu.mx')
  })

  test('login.rejected guarda el mensaje del backend y no deja sesion', () => {
    const estado = authReducer(estadoInicial, {
      type: login.rejected.type,
      payload: 'Correo o contrasena incorrectos.',
    })

    expect(estado.status).toBe('failed')
    expect(estado.error).toBe('Correo o contrasena incorrectos.')
    expect(estado.token).toBeNull()
  })

  test('logout borra la sesion del estado y de localStorage', () => {
    localStorage.setItem('token', 'jwt-123')
    localStorage.setItem('user', JSON.stringify(usuario))

    const estado = authReducer(
      { user: usuario, token: 'jwt-123', status: 'succeeded', error: null },
      logout(),
    )

    expect(estado.user).toBeNull()
    expect(estado.token).toBeNull()
    expect(estado.status).toBe('idle')
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})

describe('authSlice · thunk login', () => {
  test('llama al backend y persiste token y usuario', async () => {
    api.post.mockResolvedValue({ data: { token: 'jwt-abc', user: usuario } })

    const dispatch = vi.fn()
    const resultado = await login({
      email: 'UP220101@Alumnos.UPA.edu.mx',
      password: 'upa12345',
    })(dispatch, () => ({}), undefined)

    // El correo se normaliza antes de mandarlo: la BD lo guarda en minusculas.
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'up220101@alumnos.upa.edu.mx',
      password: 'upa12345',
    })
    expect(resultado.payload.token).toBe('jwt-abc')
    expect(localStorage.getItem('token')).toBe('jwt-abc')
  })

  test('un 401 del backend se traduce al mensaje que ve el usuario', async () => {
    api.post.mockRejectedValue({
      response: { status: 401, data: { message: 'Correo o contrasena incorrectos.' } },
    })

    const resultado = await login({ email: 'x@alumnos.upa.edu.mx', password: 'mala' })(
      vi.fn(),
      () => ({}),
      undefined,
    )

    expect(resultado.payload).toBe('Correo o contrasena incorrectos.')
    // Credenciales malas no deben dejar rastro de sesion.
    expect(localStorage.getItem('token')).toBeNull()
  })

  test('ya no existe el bypass demo: cualquier correo pasa por el backend', async () => {
    api.post.mockRejectedValue({
      response: { status: 401, data: { message: 'Correo o contrasena incorrectos.' } },
    })

    const resultado = await login({ email: 'biblioteca@upa.edu.mx', password: 'lo-que-sea' })(
      vi.fn(),
      () => ({}),
      undefined,
    )

    expect(api.post).toHaveBeenCalledTimes(1)
    expect(resultado.payload).toBe('Correo o contrasena incorrectos.')
    expect(localStorage.getItem('token')).toBeNull()
  })
})

describe('authSlice · thunk register', () => {
  test('propaga el mensaje de correo invalido del backend', async () => {
    api.post.mockRejectedValue({
      response: {
        data: { message: 'El correo de alumno debe tener el formato up<matricula>@alumnos.upa.edu.mx' },
      },
    })

    const resultado = await register({
      nombre: 'Ana',
      apellido: 'Garcia',
      email: 'ana@gmail.com',
      password: 'upa12345',
    })(vi.fn(), () => ({}), undefined)

    expect(resultado.payload).toMatch(/alumnos\.upa\.edu\.mx/)
  })
})

describe('authSlice · selectores', () => {
  test('selectIsAuthenticated depende del token', () => {
    expect(selectIsAuthenticated({ auth: { token: null } })).toBe(false)
    expect(selectIsAuthenticated({ auth: { token: 'jwt' } })).toBe(true)
  })

  test('selectEsAlumno solo es true para rol_id 1', () => {
    expect(selectEsAlumno({ auth: { user: { rol_id: 1 } } })).toBe(true)
    expect(selectEsAlumno({ auth: { user: { rol_id: 3 } } })).toBe(false)
    expect(selectEsAlumno({ auth: { user: null } })).toBe(false)
  })
})
