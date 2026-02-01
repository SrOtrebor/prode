import json
from datetime import datetime
import pytz
import re
import sys # Import sys to access command-line arguments

# Paso 1: Definir la lista de nombres completos y correctos.
# (Esta lista debe ser lo más completa posible)
KNOWN_TEAMS = [
    "Aldosivi", "Ind. Rivadavia Mza", "Banfield", "Lanús", "Barracas", "Argentinos Jrs.",
    "Belgrano", "Tigre", "Central Córdoba", "Racing", "Defensa", "Huracán",
    "Estudiantes", "Boca Jrs.", "Godoy Cruz", "San Martín SJ", "Independiente",
    "Instituto", "Newell's", "Platense", "River", "San Lorenzo", "Dep. Riestra",
    "Vélez", "Talleres", "Central", "Sarmiento", "At. Tucumán",
    "Newell's Old Boys", "Unión Santa Fe", "River Plate", "Gimnasia La Plata",
    "Deportivo Riestra", "Vélez Sarsfield", "Talleres de Córdoba"
]

def parse_match_data(raw_text, match_date_str):
    """
    Interpreta un bloque de texto de partidos y devuelve una lista de diccionarios.
    """
    parsed_matches = []
    
    # Paso 2: Dividir el texto en bloques de partido usando la hora como ancla.
    # La expresión regular busca una hora (HH:MM) y captura todo hasta la siguiente hora o el final del texto.
    match_blocks = re.findall(r'(\d{2}:\d{2}.*?)(?=\d{2}:\d{2}|$)', raw_text, re.DOTALL)

    # Define the timezone for Argentina (ART, UTC-3)
    art_tz = pytz.timezone('America/Argentina/Buenos_Aires')

    for block in match_blocks:
        lines = block.strip().split('\n')
        if not lines:
            continue
            
        # La primera línea contiene los datos del partido, el resto es el estadio (ruido).
        data_line = lines[0]

        # Paso 3a: Extraer la Hora
        match_time = data_line[:5]
        teams_text = data_line[5:].strip()
        
        # Paso 3b: Normalizar espacios y separar bloque local de visitante
        # Usar regex para dividir por dos o más espacios
        parts = re.split(r'\s{2,}', teams_text, 1)
        if len(parts) < 2:
            sys.stderr.write(f"Warning: Could not split teams in line: {teams_text}\n")
            continue
        
        home_block = parts[0].strip()
        away_block = parts[1].strip()
            
        home_team_name = None
        away_team_name = None
        
        # Paso 3c: Identificar los nombres completos
        # Priorizar nombres más largos para evitar coincidencias parciales incorrectas
        for team in sorted(KNOWN_TEAMS, key=len, reverse=True):
            if home_team_name is None and team in home_block:
                home_team_name = team
            if away_team_name is None and team in away_block:
                away_team_name = team
            # Si ya encontramos ambos, podemos salir del bucle
            if home_team_name and away_team_name:
                break
        
        # Si se encontraron ambos equipos, se construye el objeto final
        if home_team_name and away_team_name:
            # Construir la fecha en formato ISO 8061
            # match_date_str is expected in YYYY-MM-DD format
            try:
                dt_object = datetime.strptime(f"{match_date_str} {match_time}", "%Y-%m-%d %H:%M")
                parsed_date_time = art_tz.localize(dt_object)

                parsed_matches.append({
                    "homeTeam": home_team_name,
                    "awayTeam": away_team_name,
                    "dateTime": parsed_date_time.isoformat()
                })
            except ValueError as ve:
                sys.stderr.write(f"Warning: Could not parse date/time for match '{home_team_name} vs {away_team_name}': {ve}\n")
                
    return parsed_matches

# --- EJEMPLO DE USO --- 
if __name__ == "__main__":
    # When called from Node.js, arguments will be passed via sys.argv
    if len(sys.argv) > 2:
        unstructured_text_input = sys.argv[1]
        event_date = sys.argv[2]
    else:
        # Fallback for direct execution or testing without arguments
        unstructured_text_input = """
18:00Newell'sNewell's Old Boys  Unión Santa FeUnión
Marcelo Bielsa
18:00PlatensePlatense  SarmientoSarmiento
Ciudad de Vicente López
18:00RiverRiver Plate  Gimnasia La PlataGimnasia LP
Mâs Monumental
18:00San LorenzoSan Lorenzo  Deportivo RiestraDep. Riestra
Nuevo Gasómetro
18:00VélezVélez Sarsfield  Talleres de CórdobaTalleres
José Amalfitani
"""
        event_date = "2025-11-02" # Default date for testing
        sys.stderr.write("Warning: Running scraper.py without command-line arguments. Using default test data.\n")

    partidos_extraidos = parse_match_data(unstructured_text_input, event_date)

    # Imprimir el resultado en formato JSON para que Node.js pueda capturarlo
    print(json.dumps(partidos_extraidos, indent=2, ensure_ascii=False))