import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { fetchBookings, selectAllBookings } from './bookingSlice.js'

export default function CalendarView() {
  const dispatch = useDispatch()
  const bookings = useSelector(selectAllBookings)
  const status = useSelector((state) => state.bookings.status)

  useEffect(() => {
    if (status === 'idle') dispatch(fetchBookings())
  }, [status, dispatch])

  return (
    <section className="p-6">
      <h2 className="mb-4 text-xl font-semibold text-slate-800">Reservas</h2>

      {status === 'loading' && <p className="text-slate-500">Cargando...</p>}

      {status === 'succeeded' && bookings.length === 0 && (
        <p className="text-slate-500">No hay reservas registradas.</p>
      )}

      <ul className="space-y-2">
        {bookings.map((b) => (
          <li key={b.id} className="rounded border border-slate-200 bg-white p-4 shadow-sm">
            <p className="font-medium text-slate-800">{b.title}</p>
            <p className="text-sm text-slate-500">
              {b.start_date} — {b.end_date}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
