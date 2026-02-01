import { Link } from 'react-router-dom';
import PopcornBucket from '../components/PopcornBucket';
import WinnersMonitor from '../components/WinnersMonitor';

const Landing = () => {
    return (
        <div className="min-h-screen bg-fondo-principal text-white overflow-x-hidden">

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
                {/* Fondo con gradiente */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-fondo-principal to-blue-900/20" />

                <div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    {/* Contenido izquierdo */}
                    <div className="text-center md:text-left space-y-6 animate-fade-in">
                        {/* Logo */}
                        <img
                            src="/logo.png"
                            alt="FulbitoPlay Logo"
                            className="w-32 h-32 mx-auto md:mx-0 object-contain drop-shadow-2xl"
                        />

                        <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                                FulbitoPlay
                            </span>
                        </h1>

                        <p className="text-2xl md:text-3xl font-semibold text-texto-secundario">
                            Pronósticos Deportivos Entre Amigos
                        </p>

                        <p className="text-lg text-texto-secundario max-w-xl">
                            Compite con tus amigos prediciendo resultados de partidos.
                            Juega gratis por la gloria o conviértete en VIP para ganar premios.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                            <Link
                                to="/register"
                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg hover:shadow-purple-500/50"
                            >
                                🎮 Jugar Gratis
                            </Link>
                            <a
                                href="#vip-info"
                                className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg hover:shadow-yellow-500/50"
                            >
                                👑 Conocer Modo VIP
                            </a>
                        </div>

                        {/* Link a login */}
                        <p className="text-texto-secundario pt-4">
                            ¿Ya tienes cuenta?{' '}
                            <Link to="/login" className="text-secundario hover:underline font-semibold">
                                Iniciar Sesión
                            </Link>
                        </p>
                    </div>

                    {/* Imagen hero derecha */}
                    <div className="relative animate-float">
                        <img
                            src="/landing/hero_fulbitoplay.png"
                            alt="Amigos jugando FulbitoPlay"
                            className="w-full h-auto rounded-2xl shadow-2xl"
                        />
                    </div>
                </div>
            </section>

            {/* Sección: Free vs VIP */}
            <section id="vip-info" className="py-20 px-4 bg-gradient-to-b from-fondo-principal to-gray-900">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
                        Dos Formas de Jugar
                    </h2>
                    <p className="text-texto-secundario text-center mb-16 max-w-2xl mx-auto">
                        Elige tu estilo: compite por la gloria o juega por premios reales
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Modo Free */}
                        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8 hover:scale-105 transition-transform">
                            <div className="flex items-center justify-center mb-6">
                                <div
                                    className="text-8xl"
                                    style={{
                                        filter: 'drop-shadow(0 8px 24px rgba(96, 165, 250, 0.7))',
                                    }}
                                >
                                    🏆
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-center mb-4 text-blue-400">
                                🆓 Modo Free
                            </h3>
                            <p className="text-center text-texto-secundario mb-6">
                                Juega por la Gloria
                            </p>
                            <ul className="space-y-3 text-texto-secundario">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Participación 100% gratuita</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Pronósticos básicos (L/V/E)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>1 punto por acierto</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Compite en el ranking Free</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Reconocimiento y gloria</span>
                                </li>
                            </ul>
                        </div>

                        {/* Modo VIP */}
                        <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-8 hover:scale-105 transition-transform relative overflow-hidden">
                            <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                                PREMIUM
                            </div>
                            <div className="flex items-center justify-center mb-6">
                                <div
                                    className="text-8xl"
                                    style={{
                                        filter: 'drop-shadow(0 8px 24px rgba(234, 179, 8, 0.8))',
                                    }}
                                >
                                    👑
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-center mb-4 text-yellow-400">
                                👑 Modo VIP
                            </h3>
                            <p className="text-center text-texto-secundario mb-6">
                                Juega por Premios (Pochoclos)
                            </p>
                            <ul className="space-y-3 text-texto-secundario">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Requiere 1 llave por evento</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Pronósticos básicos incluidos</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Desbloquea pronósticos exactos (1 llave/partido)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>3 puntos por resultado exacto</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Compite por pochoclos acumulados</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sección: Cómo Funciona */}
            <section className="py-20 px-4 bg-fondo-principal">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
                        ¿Cómo Funciona?
                    </h2>

                    {/* Flujo Free */}
                    <div className="mb-16">
                        <h3 className="text-2xl font-bold text-blue-400 mb-8 text-center">
                            🆓 Modo Free
                        </h3>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                    1
                                </div>
                                <h4 className="font-bold text-xl mb-2">Regístrate Gratis</h4>
                                <p className="text-texto-secundario">
                                    Crea tu cuenta en segundos, sin costo alguno
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                    2
                                </div>
                                <h4 className="font-bold text-xl mb-2">Haz tus Pronósticos</h4>
                                <p className="text-texto-secundario">
                                    Predice L (Local), V (Visitante) o E (Empate)
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                    3
                                </div>
                                <h4 className="font-bold text-xl mb-2">Compite por Gloria</h4>
                                <p className="text-texto-secundario">
                                    Sube en el ranking y gana reconocimiento
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Flujo VIP */}
                    <div>
                        <h3 className="text-2xl font-bold text-yellow-400 mb-8 text-center">
                            👑 Modo VIP
                        </h3>
                        <div className="grid md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                    1
                                </div>
                                <h4 className="font-bold text-lg mb-2">Obtén tu Llave</h4>
                                <p className="text-texto-secundario text-sm">
                                    Un admin te otorga tu llave de activación
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                    2
                                </div>
                                <h4 className="font-bold text-lg mb-2">Activa VIP</h4>
                                <p className="text-texto-secundario text-sm">
                                    Usa 1 llave para activar VIP en el evento
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                    3
                                </div>
                                <h4 className="font-bold text-lg mb-2">Desbloquea Exactos</h4>
                                <p className="text-texto-secundario text-sm">
                                    Usa llaves para predecir resultados exactos
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                    4
                                </div>
                                <h4 className="font-bold text-lg mb-2">Gana Pochoclos</h4>
                                <p className="text-texto-secundario text-sm">
                                    El mejor VIP se lleva el balde completo
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sección: Sistema de Puntos */}
            <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-fondo-principal">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
                        Sistema de Puntos
                    </h2>
                    <p className="text-texto-secundario text-center mb-12">
                        Así se calculan tus puntos en cada partido
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Pronóstico Básico */}
                        <div className="bg-fondo-principal/50 backdrop-blur-md border border-blue-500/30 rounded-xl p-6">
                            <h3 className="text-2xl font-bold mb-4 text-blue-400">
                                Pronóstico Básico
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-texto-secundario">Acierto L/V/E:</span>
                                    <span className="text-3xl font-bold text-secundario">+1 pt</span>
                                </div>
                                <p className="text-sm text-texto-secundario">
                                    Ejemplo: Predijiste "L" y el local ganó → <strong className="text-white">1 punto</strong>
                                </p>
                            </div>
                        </div>

                        {/* Pronóstico Exacto */}
                        <div className="bg-fondo-principal/50 backdrop-blur-md border border-yellow-500/30 rounded-xl p-6">
                            <h3 className="text-2xl font-bold mb-4 text-yellow-400">
                                Pronóstico Exacto (VIP)
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-texto-secundario">Resultado exacto:</span>
                                    <span className="text-3xl font-bold text-secundario">+3 pts</span>
                                </div>
                                <p className="text-sm text-texto-secundario">
                                    Ejemplo: Predijiste "L" y "2-1", salió 2-1 → <strong className="text-white">3 puntos totales</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sección: Balde de Pochoclos */}
            <section className="py-20 px-4 bg-fondo-principal">
                <div className="max-w-4xl mx-auto">
                    <PopcornBucket />
                </div>
            </section>

            {/* Sección: Ganadores */}
            <section className="py-20 px-4 bg-gradient-to-b from-fondo-principal to-gray-900">
                <WinnersMonitor />
            </section>

            {/* Sección: Características */}
            <section className="py-20 px-4 bg-gray-900">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
                        Características
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center p-6">
                            <div className="text-5xl mb-4">💬</div>
                            <h3 className="text-xl font-bold mb-2">Chat en Tiempo Real</h3>
                            <p className="text-texto-secundario">
                                Habla con tus amigos mientras siguen los partidos juntos
                            </p>
                        </div>

                        <div className="text-center p-6">
                            <div className="text-5xl mb-4">📊</div>
                            <h3 className="text-xl font-bold mb-2">Rankings Actualizados</h3>
                            <p className="text-texto-secundario">
                                Ve tu posición en tiempo real y compite por el primer lugar
                            </p>
                        </div>

                        <div className="text-center p-6">
                            <div className="text-5xl mb-4">⚡</div>
                            <h3 className="text-xl font-bold mb-2">Carga Masiva</h3>
                            <p className="text-texto-secundario">
                                Los admins pueden cargar múltiples partidos de una vez
                            </p>
                        </div>

                        <div className="text-center p-6">
                            <div className="text-5xl mb-4">🎯</div>
                            <h3 className="text-xl font-bold mb-2">Pronósticos Exactos</h3>
                            <p className="text-texto-secundario">
                                Modo VIP: predice el resultado exacto para más puntos
                            </p>
                        </div>

                        <div className="text-center p-6">
                            <div className="text-5xl mb-4">🔐</div>
                            <h3 className="text-xl font-bold mb-2">Sistema de Llaves</h3>
                            <p className="text-texto-secundario">
                                Llaves únicas y consumibles para desbloquear funciones VIP
                            </p>
                        </div>

                        <div className="text-center p-6">
                            <div className="text-5xl mb-4">📱</div>
                            <h3 className="text-xl font-bold mb-2">Diseño Responsivo</h3>
                            <p className="text-texto-secundario">
                                Juega desde cualquier dispositivo: PC, tablet o móvil
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black py-12 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <img
                        src="/logo.png"
                        alt="FulbitoPlay"
                        className="w-16 h-16 mx-auto mb-4 object-contain"
                    />
                    <h3 className="text-2xl font-bold mb-4">FulbitoPlay</h3>
                    <p className="text-texto-secundario mb-6">
                        Pronósticos deportivos entre amigos
                    </p>

                    <div className="flex justify-center gap-6 mb-8">
                        <Link to="/register" className="text-secundario hover:underline">
                            Registrarse
                        </Link>
                        <Link to="/login" className="text-secundario hover:underline">
                            Iniciar Sesión
                        </Link>
                    </div>

                    <p className="text-texto-secundario text-sm">
                        © 2026 FulbitoPlay. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
