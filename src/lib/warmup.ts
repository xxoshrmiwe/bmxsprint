/**
 * Ejercicios de calentamiento sin equipo, adaptados de "exercises-dataset"
 * (https://github.com/hasaneyldrm/exercises-dataset), MIT License.
 * Solo se usa el texto (nombre/instrucciones en español) del dataset — no se
 * incluyen imágenes ni GIFs, cuyos derechos son de Gym visual y requieren
 * permiso aparte. Ver NOTICE-ejercicios.md para el detalle de la atribución.
 */

export interface Ejercicio {
  id: string;
  nombre: string;
  pasos: string[];
  segundos: number;
}

const ANKLE_CIRCLES: Ejercicio = {
  id: '1368',
  nombre: 'Círculos de tobillo',
  pasos: [
    'Siéntate en el suelo con las piernas extendidas frente a ti.',
    'Levanta una pierna del suelo y rota el tobillo con un movimiento circular.',
    'Haz varios círculos en una dirección y luego cambia a la dirección contraria.',
    'Repite con la otra pierna.'
  ],
  segundos: 30
};

const WALKING_LUNGE: Ejercicio = {
  id: '1460',
  nombre: 'Zancada caminando',
  pasos: [
    'Ponte de pie con los pies separados a la altura de los hombros.',
    'Da un paso adelante con la pierna derecha, bajando el cuerpo a una posición de zancada.',
    'Mantén el torso erguido y la rodilla delantera alineada con el tobillo.',
    'Empújate con el pie derecho y da el siguiente paso con la pierna izquierda.',
    'Continúa alternando las piernas y avanzando, a ritmo controlado.'
  ],
  segundos: 30
};

const STAR_JUMP: Ejercicio = {
  id: '3223',
  nombre: 'Saltos de estrella',
  pasos: [
    'Ponte de pie con los pies separados a la altura de los hombros y los brazos a los costados.',
    'Flexiona ligeramente las rodillas y salta hacia arriba de forma explosiva.',
    'Mientras saltas, separa las piernas y extiende los brazos hacia los lados, como una estrella.',
    'Aterriza suavemente sobre la punta de los pies con las rodillas ligeramente flexionadas.'
  ],
  segundos: 30
};

const BASIC_TOE_TOUCH: Ejercicio = {
  id: '3212',
  nombre: 'Toque de punta de pies',
  pasos: [
    'Ponte de pie con los pies separados a la altura de los hombros y los brazos a los costados.',
    'Inclínate hacia adelante desde la cintura, con la espalda recta y las rodillas ligeramente flexionadas.',
    'Extiende las manos hacia las puntas de los pies.',
    'Haz una pausa breve abajo y regresa lentamente a la posición inicial.'
  ],
  segundos: 30
};

const GLUTE_BRIDGE_MARCH: Ejercicio = {
  id: '3561',
  nombre: 'Puente de glúteos con marcha',
  pasos: [
    'Túmbate boca arriba con las rodillas flexionadas y los pies apoyados en el suelo.',
    'Activa los glúteos y levanta las caderas del suelo, en línea recta desde las rodillas hasta los hombros.',
    'Manteniendo las caderas elevadas, levanta un pie y lleva la rodilla hacia el pecho.',
    'Baja el pie y repite con la otra pierna, alternando como si marcharas.'
  ],
  segundos: 30
};

const HIGH_KNEE_WALL: Ejercicio = {
  id: '3636',
  nombre: 'Rodillas altas contra la pared',
  pasos: [
    'Ponte de pie frente a una pared con los pies separados a la altura de las caderas.',
    'Coloca las manos en la pared para apoyarte.',
    'Levanta la rodilla derecha hacia el pecho y luego cámbiala rápido por la izquierda.',
    'Continúa alternando las piernas con un movimiento de carrera, rodillas lo más alto posible.'
  ],
  segundos: 30
};

const WALKING_HIGH_KNEES_LUNGE: Ejercicio = {
  id: '3655',
  nombre: 'Zancada con rodilla alta',
  pasos: [
    'Ponte de pie con los pies separados a la altura de la cadera.',
    'Levanta la rodilla derecha hacia el pecho lo más alto posible, en equilibrio sobre la izquierda.',
    'Da un paso adelante con el pie derecho y baja a una zancada con ambas rodillas a 90 grados.',
    'Empújate y lleva la rodilla izquierda hacia el pecho, luego da el siguiente paso.',
    'Continúa alternando piernas y avanzando.'
  ],
  segundos: 30
};

const MOUNTAIN_CLIMBER: Ejercicio = {
  id: '0630',
  nombre: 'Escalador (mountain climber)',
  pasos: [
    'Comienza en plancha alta, manos justo debajo de los hombros y cuerpo en línea recta.',
    'Activa el core y lleva la rodilla derecha hacia el pecho, luego cambia rápido a la izquierda.',
    'Continúa alternando las piernas con un movimiento de carrera, caderas bajas.',
    'Mantén un ritmo constante y respira de forma regular.'
  ],
  segundos: 30
};

const WORLD_GREATEST_STRETCH: Ejercicio = {
  id: '1604',
  nombre: 'Estiramiento de zancada con giro',
  pasos: [
    'Da un paso largo adelante con el pie derecho, quedando en zancada.',
    'Coloca las manos en el suelo a ambos lados del pie derecho.',
    'Baja la rodilla izquierda hacia el suelo y estira la pierna derecha.',
    'Gira el torso hacia la derecha, extendiendo el brazo derecho hacia el techo.',
    'Mantén unos segundos y cambia de lado.'
  ],
  segundos: 30
};

const SPLIT_SQUATS: Ejercicio = {
  id: '2368',
  nombre: 'Zancada estática (split squat)',
  pasos: [
    'Ponte de pie con los pies separados a la altura de los hombros.',
    'Da un paso adelante con un pie, dejando bastante distancia entre ambos pies.',
    'Baja el cuerpo flexionando ambas rodillas, con la espalda recta.',
    'Baja hasta que el muslo delantero quede paralelo al suelo.',
    'Empuja con el talón delantero para subir. Repite y luego cambia de pierna.'
  ],
  segundos: 30
};

const SKATER_HOPS: Ejercicio = {
  id: '3361',
  nombre: 'Saltos de patinador',
  pasos: [
    'Ponte de pie con los pies separados a la altura de los hombros.',
    'Flexiona un poco las rodillas y salta hacia la derecha, aterrizando sobre el pie derecho.',
    'Al aterrizar, lleva la pierna izquierda detrás de la derecha, tocando el suelo con los dedos.',
    'Salta de inmediato hacia el otro lado y repite, alternando.'
  ],
  segundos: 30
};

const HAMSTRING_STRETCH: Ejercicio = {
  id: '1511',
  nombre: 'Estiramiento de isquiotibiales',
  pasos: [
    'Ponte de pie con los pies separados a la altura de los hombros.',
    'Da un paso adelante con el pie derecho y traslada el peso hacia esa pierna.',
    'Con la espalda recta, inclínate lentamente hacia adelante desde las caderas.',
    'Mantén el estiramiento 20-30 segundos y repite del otro lado.'
  ],
  segundos: 30
};

const BURPEE: Ejercicio = {
  id: '1160',
  nombre: 'Burpee',
  pasos: [
    'Comienza de pie con los pies separados a la altura de los hombros.',
    'Baja a sentadilla y coloca las manos en el suelo frente a ti.',
    'Lleva los pies hacia atrás de un salto hasta quedar en posición de flexión.',
    'Haz una flexión de brazos, con el cuerpo en línea recta.',
    'Salta con los pies de vuelta a la sentadilla y salta hacia arriba explosivamente.'
  ],
  segundos: 30
};

const JUMP_SQUAT: Ejercicio = {
  id: '0514',
  nombre: 'Sentadilla con salto',
  pasos: [
    'Ponte de pie con los pies separados a la altura de los hombros.',
    'Baja el cuerpo a sentadilla, flexionando rodillas y empujando las caderas hacia atrás.',
    'Salta de forma explosiva extendiendo caderas, rodillas y tobillos.',
    'Aterriza suavemente sobre la punta de los pies y continúa con la siguiente repetición.'
  ],
  segundos: 30
};

const SCISSOR_JUMPS: Ejercicio = {
  id: '3219',
  nombre: 'Saltos de tijera',
  pasos: [
    'Ponte de pie con los pies separados a la altura de los hombros.',
    'Salta y cruza la pierna derecha por delante de la izquierda.',
    'Al aterrizar, cambia rápido de pierna, cruzando la izquierda por delante.',
    'Continúa alternando las piernas, saltando a buen ritmo.'
  ],
  segundos: 30
};

const BEAR_CRAWL: Ejercicio = {
  id: '3360',
  nombre: 'Caminata de oso',
  pasos: [
    'Apóyate sobre manos y rodillas, manos justo debajo de los hombros.',
    'Levanta las rodillas un poco del suelo, espalda plana y core activado.',
    'Mueve la mano derecha y el pie izquierdo adelante a la vez, luego el otro lado.',
    'Continúa avanzando a gatas, alternando manos y pies.'
  ],
  segundos: 30
};

const BACK_AND_FORTH_STEP: Ejercicio = {
  id: '3672',
  nombre: 'Paso adelante y atrás',
  pasos: [
    'Ponte de pie con los pies separados a la altura de los hombros.',
    'Da un paso adelante con el pie derecho, bajando a una zancada.',
    'Empuja con el pie derecho y da un paso atrás a la posición inicial.',
    'Repite con el pie izquierdo, alternando en cada paso.'
  ],
  segundos: 30
};

const RUTINA_PEQUES: Ejercicio[] = [
  ANKLE_CIRCLES,
  WALKING_LUNGE,
  STAR_JUMP,
  BASIC_TOE_TOUCH,
  GLUTE_BRIDGE_MARCH,
  HIGH_KNEE_WALL
];

const RUTINA_JUVENIL: Ejercicio[] = [
  STAR_JUMP,
  WALKING_HIGH_KNEES_LUNGE,
  MOUNTAIN_CLIMBER,
  WORLD_GREATEST_STRETCH,
  SPLIT_SQUATS,
  SKATER_HOPS,
  HAMSTRING_STRETCH,
  ANKLE_CIRCLES
];

const RUTINA_AVANZADA: Ejercicio[] = [
  BURPEE,
  JUMP_SQUAT,
  SCISSOR_JUMPS,
  BEAR_CRAWL,
  BACK_AND_FORTH_STEP,
  SPLIT_SQUATS,
  WORLD_GREATEST_STRETCH,
  HIGH_KNEE_WALL
];

export function obtenerRutina(edad?: number): Ejercicio[] {
  if (edad !== undefined && edad < 9) return RUTINA_PEQUES;
  if (edad !== undefined && edad >= 15) return RUTINA_AVANZADA;
  return RUTINA_JUVENIL;
}
