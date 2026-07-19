import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { login } from './authSlice.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error } = useSelector((state) => state.auth)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(login({ email, password }))
    if (login.fulfilled.match(result)) navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md"
      >
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Iniciar sesion</h1>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Correo</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Contrasena</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </label>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded bg-blue-600 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'loading' ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
