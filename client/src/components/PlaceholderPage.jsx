export default function PlaceholderPage({ titulo, descripcion, responsable }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-white/30 backdrop-blur-2xl rounded-2xl border border-white/60 p-8 shadow-lg relative">
            <h2 className="text-2xl font-bold mb-2 text-gray-700">{titulo}</h2>
            <p className="text-lg mb-1">{descripcion}</p>
            <p className="text-sm text-gray-400">Responsable: {responsable}</p>
            <span className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                En desarrollo
            </span>
        </div>
    )
}