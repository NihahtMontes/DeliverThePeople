import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2">Página no encontrada</h2>
      <p className="text-gray-500 mb-6">La ruta a la que intentas acceder no existe.</p>
      <Link to="/" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
        Volver al Dashboard
      </Link>
    </div>
  )
}
