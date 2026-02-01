import { useEffect, useState } from 'react';
import axios from 'axios';

const PopcornBucket = () => {
    const [totalKeys, setTotalKeys] = useState(0);
    const [loading, setLoading] = useState(true);
    const [animatedCount, setAnimatedCount] = useState(0);

    useEffect(() => {
        // Obtener estadísticas de llaves consumidas
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stats/key-usage`);
                const vipKeys = response.data.vip_by_event.reduce((acc, event) => acc + event.vip_count, 0);
                const total = vipKeys + response.data.keys_spent_on_unlocks;
                setTotalKeys(total);
                setLoading(false);
            } catch (error) {
                console.error('Error al obtener estadísticas:', error);
                setTotalKeys(0);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Animación del contador
    useEffect(() => {
        if (totalKeys > 0) {
            let current = 0;
            const increment = Math.ceil(totalKeys / 50);
            const timer = setInterval(() => {
                current += increment;
                if (current >= totalKeys) {
                    setAnimatedCount(totalKeys);
                    clearInterval(timer);
                } else {
                    setAnimatedCount(current);
                }
            }, 30);
            return () => clearInterval(timer);
        }
    }, [totalKeys]);

    // Calcular el porcentaje de llenado (máximo 100 llaves para llenar el balde)
    const fillPercentage = Math.min((totalKeys / 100) * 100, 100);

    return (
        <div className="relative flex flex-col items-center justify-center p-8">
            {/* Título */}
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">
                🍿 Balde de Premios
            </h3>
            <p className="text-texto-secundario text-center mb-6 max-w-md">
                Cada llave consumida suma al premio. ¡Cuantas más llaves, más grande el premio!
            </p>

            {/* Contenedor del balde con animación */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                {/* Barra de progreso circular */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Círculo de fondo */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="2"
                    />
                    {/* Círculo de progreso */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - fillPercentage / 100)}`}
                        style={{
                            transition: 'stroke-dashoffset 1s ease-out',
                            filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))'
                        }}
                    />
                    {/* Gradiente para la barra */}
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFD700" />
                            <stop offset="50%" stopColor="#FFA500" />
                            <stop offset="100%" stopColor="#FF6B35" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Balde de pochoclos con emoji estilizado */}
                <div className="relative z-10">
                    <div
                        className="text-[10rem] md:text-[14rem] leading-none"
                        style={{
                            filter: 'drop-shadow(0 20px 40px rgba(255, 165, 0, 0.6)) drop-shadow(0 0 60px rgba(255, 215, 0, 0.4))',
                            transform: `scale(${1 + (fillPercentage / 100) * 0.15})`,
                            transition: 'all 1s ease-out',
                            animation: fillPercentage >= 100 ? 'pulse 2s infinite' : 'none'
                        }}
                    >
                        🍿
                    </div>
                </div>

                {/* Efecto de brillo/glow detrás que crece */}
                <div
                    className="absolute inset-0 bg-gradient-to-t from-yellow-400/40 via-orange-300/30 to-transparent rounded-full blur-3xl transition-all duration-1000 ease-out"
                    style={{
                        opacity: fillPercentage / 100,
                        transform: `scale(${0.8 + (fillPercentage / 100) * 0.4})`
                    }}
                />

                {/* Ondas de energía cuando está lleno */}
                {fillPercentage >= 100 && (
                    <>
                        <div className="absolute inset-0 rounded-full border-4 border-yellow-400/50 animate-ping" />
                        <div className="absolute inset-0 rounded-full border-4 border-orange-400/30 animate-ping" style={{ animationDelay: '0.5s' }} />
                    </>
                )}

                {/* Partículas de pochoclos cayendo */}
                {!loading && totalKeys > 0 && (
                    <>
                        <div className="popcorn-particle" style={{ left: '20%', animationDelay: '0s', fontSize: '32px' }}>🍿</div>
                        <div className="popcorn-particle" style={{ left: '50%', animationDelay: '0.7s', fontSize: '28px' }}>🍿</div>
                        <div className="popcorn-particle" style={{ left: '75%', animationDelay: '1.4s', fontSize: '30px' }}>🍿</div>
                    </>
                )}

                {/* Indicador de porcentaje */}
                {!loading && (
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-orange-600 px-4 py-1 rounded-full text-white font-bold text-sm shadow-lg">
                        {Math.round(fillPercentage)}%
                    </div>
                )}
            </div>

            {/* Contador animado */}
            <div className="mt-10 text-center">
                {loading ? (
                    <p className="text-texto-secundario">Cargando...</p>
                ) : (
                    <>
                        <p className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-2">
                            {animatedCount}
                        </p>
                        <p className="text-texto-secundario text-lg">
                            Llaves en el Balde
                        </p>
                        <p className="text-texto-secundario text-sm mt-2">
                            {totalKeys < 100 ? `Faltan ${100 - totalKeys} llaves para llenar el balde` : '¡Balde lleno! 🎉'}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};
export default PopcornBucket;
