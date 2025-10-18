import React from 'react';

const EventManager = ({ events, onDeleteEvent }) => {
  if (!events || events.length === 0) {
    return <p className="text-center text-texto-secundario">No hay eventos para gestionar.</p>;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-xl font-display font-semibold text-texto-principal mb-4 border-b border-texto-secundario/50 pb-2">Gestionar Eventos</h4>
      <ul className="space-y-3">
        {events.map(event => (
          <li key={event.id} className="flex items-center justify-between bg-fondo-principal p-3 rounded-md shadow">
            <span className="font-medium text-texto-principal">{event.name}</span>
            <button
              onClick={() => onDeleteEvent(event.id)}
              className="bg-primario hover:brightness-110 text-white font-bold py-1 px-3 rounded-md text-sm transition-all"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EventManager;