# Guía de Uso: Carga Masiva de Partidos

## 📝 Formatos Soportados

El sistema acepta los siguientes formatos de texto **Y JSON**:

### **Formatos de Texto**

#### Formato 1: Fecha completa + Hora + vs
```
22/01/2026 20:00 River Plate vs Boca Juniors
22/01/2026 22:00 Racing Club vs Independiente
23/01/2026 18:00 San Lorenzo vs Huracán
```

#### Formato 2: Fecha completa + Hora + guión
```
22/01/2026 20:00 River Plate - Boca Juniors
22/01/2026 22:00 Racing Club - Independiente
23/01/2026 18:00 San Lorenzo - Huracán
```

#### Formato 3: Solo hora + vs (usa fecha actual)
```
20:00 River Plate vs Boca Juniors
22:00 Racing Club vs Independiente
18:00 San Lorenzo vs Huracán
```

#### Formato 4: Solo hora + guión (usa fecha actual)
```
20:00 River Plate - Boca Juniors
22:00 Racing Club - Independiente
18:00 San Lorenzo - Huracán
```

### **Formatos JSON**

#### Formato 5: JSON con fecha ISO completa
```json
[
  {
    "homeTeam": "River Plate",
    "awayTeam": "Boca Juniors",
    "dateTime": "2026-01-22T20:00:00-03:00"
  },
  {
    "homeTeam": "Racing Club",
    "awayTeam": "Independiente",
    "dateTime": "2026-01-22T22:00:00-03:00"
  }
]
```

#### Formato 6: JSON con fecha y hora separadas
```json
[
  {
    "homeTeam": "River Plate",
    "awayTeam": "Boca Juniors",
    "date": "22/01/2026",
    "time": "20:00"
  },
  {
    "homeTeam": "Racing Club",
    "awayTeam": "Independiente",
    "date": "22/01/2026",
    "time": "22:00"
  }
]
```

#### Formato 7: JSON solo con hora (usa fecha actual)
```json
[
  {
    "homeTeam": "River Plate",
    "awayTeam": "Boca Juniors",
    "time": "20:00"
  },
  {
    "homeTeam": "Racing Club",
    "awayTeam": "Independiente",
    "time": "22:00"
  }
]
```

**Nota**: También puedes enviar un objeto JSON único (sin array) si solo quieres cargar un partido.

## 🎯 Cómo Usar

1. **Accede al Panel de Admin** → Pestaña "Carga Rápida"
2. **Selecciona el evento** donde quieres cargar los partidos
3. **Pega el texto** con los partidos (uno por línea)
4. **Haz clic en** "Procesar y Cargar Partidos"

## ✅ Validaciones

- ✓ Verifica que el evento exista
- ✓ Parsea múltiples formatos automáticamente
- ✓ Reporta líneas que no pudieron ser procesadas
- ✓ Inserta todos los partidos en una transacción (todo o nada)
- ✓ Formatea fechas para zona horaria Argentina (UTC-3)

## 📊 Respuesta del Servidor

### Éxito
```json
{
  "message": "Se cargaron 5 partidos correctamente.",
  "loaded": 5
}
```

### Éxito parcial (algunas líneas con error)
```json
{
  "message": "Se cargaron 5 partidos correctamente. (2 líneas no pudieron ser procesadas)",
  "loaded": 5,
  "errors": [
    "Línea 3: \"texto inválido\" - Formato no reconocido",
    "Línea 7: \"otro error\" - Formato no reconocido"
  ]
}
```

### Error
```json
{
  "message": "No se pudieron extraer partidos del texto proporcionado.",
  "error": "Formato de texto no reconocido"
}
```

## 💡 Consejos

- Cada partido debe estar en una línea separada
- Puedes mezclar formatos en el mismo texto
- Las líneas vacías son ignoradas
- Los espacios extra son ignorados
- Usa "vs", "VS" o "-" como separador entre equipos
- El formato de fecha es DD/MM/YYYY
- El formato de hora es HH:MM (24 horas)

## 🔧 Endpoint API

**POST** `/api/admin/batch-load-matches`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "rawText": "22/01/2026 20:00 River Plate vs Boca Juniors\n22/01/2026 22:00 Racing - Independiente",
  "eventId": 1
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Se cargaron 2 partidos correctamente.",
  "loaded": 2
}
```
