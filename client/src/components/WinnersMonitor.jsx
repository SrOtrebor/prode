const WinnersMonitor = () => {
    // Por ahora datos estáticos, en el futuro se conectará a la API
    const freeWinner = {
        username: "🏆 Próximamente",
        points: "---",
    };

    const vipWinner = {
        username: "👑 Próximamente",
        points: "---",
    };

    return (
        <div className="w-full py-16 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Título */}
                <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-4">
                    🎉 Ganadores de la Semana
                </h2>
                <p className="text-texto-secundario text-center mb-12 max-w-2xl mx-auto">
                    Cada semana celebramos a nuestros mejores jugadores. ¿Serás tú el próximo campeón?
                </p>

                {/* Podios */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Ganador Free */}
                    <div className="relative bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                            <div
                                className="text-8xl animate-bounce"
                                style={{
                                    filter: 'drop-shadow(0 10px 30px rgba(96, 165, 250, 0.8)) drop-shadow(0 0 40px rgba(147, 197, 253, 0.6))',
                                }}
                            >
                                🏆
                            </div>
                        </div>
                        <div className="mt-16">
                            <h3 className="text-2xl font-bold text-center mb-2 text-blue-400">
                                Campeón Free
                            </h3>
                            <p className="text-sm text-texto-secundario mb-4">
                                Juega por la Gloria
                            </p>
                            <div className="bg-fondo-principal/50 rounded-lg p-4 mb-2">
                                <p className="text-xl font-bold text-white">
                                    {freeWinner.username}
                                </p>
                            </div>
                            <p className="text-3xl font-bold text-secundario">
                                {freeWinner.points} pts
                            </p>
                        </div>
                    </div>

                    {/* Ganador VIP */}
                    <div className="relative bg-gradient-to-br from-yellow-900/30 to-orange-900/30 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                            <div
                                className="text-8xl animate-bounce"
                                style={{
                                    filter: 'drop-shadow(0 10px 30px rgba(234, 179, 8, 0.9)) drop-shadow(0 0 40px rgba(250, 204, 21, 0.7))',
                                }}
                            >
                                👑
                            </div>
                        </div>
                        <div className="mt-16">
                            <h3 className="text-2xl font-bold text-center mb-2 text-yellow-400">
                                Campeón VIP
                            </h3>
                            <p className="text-sm text-texto-secundario mb-4">
                                Se lleva los Pochoclos
                            </p>
                            <div className="bg-fondo-principal/50 rounded-lg p-4 mb-2">
                                <p className="text-xl font-bold text-white">
                                    {vipWinner.username}
                                </p>
                            </div>
                            <p className="text-3xl font-bold text-secundario">
                                {vipWinner.points} pts
                            </p>
                        </div>
                    </div>
                </div>

                {/* Nota sobre futuro sistema de mensajes */}
                <div className="mt-12 text-center">
                    <p className="text-texto-secundario text-sm">
                        💡 Próximamente: Los ganadores podrán dejar mensajes pagando con llaves
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WinnersMonitor;
