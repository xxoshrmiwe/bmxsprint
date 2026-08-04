# GATERIGHT BMX

## ¿Qué es?

Una app para entrenar la salida de gate en BMX Racing — ese momento en el que la puerta cae y el corredor tiene que reaccionar lo más rápido posible. Simula esa salida real (con audio y espera al azar) y mide con precisión cuánto tarda el corredor desde que suena el "drop" hasta que cruza la distancia que esté entrenando.

## ¿Para quién es?

Para papás, mamás, entrenadores o **corredores en solitario** que quieren practicar arranques fuera de la pista, sin necesitar el gate del club. Pensada para que varios hermanos puedan entrenar desde el mismo celular, cada uno con su propia cuenta, o entrenar de forma 100% autónoma.

## El problema que resuelve

En BMX Racing, la carrera casi siempre se define en el arranque: quien reacciona más rápido al gate arranca con ventaja. Pero practicar ese reflejo específico requiere el gate real de una pista, y no siempre hay acceso a uno para entrenar seguido o se cuenta con alguien que tome el tiempo en la meta. Esta app recrea esa sensación con audios reales de salida, detección automática por acelerómetro y un cronómetro de precisión, para que el corredor pueda practicar el arranque las veces que quiera.

## Cómo funciona, paso a paso

1. **Cada corredor tiene su propia cuenta** (usuario, correo y contraseña), como cualquier app real — así varios hermanos pueden compartir el mismo celular sin mezclar sus tiempos.
2. Al empezar un entrenamiento, elige **qué distancia** va a correr ese día y el **Modo de Medición**:
   - 👥 **Modo Asistido:** Para cuando un entrenador o acompañante frena el cronómetro manualmente en la meta.
   - 📱 **Modo Solo (Bolsillo):** El corredor guarda el celular en el bolsillo y el acelerómetro congela el tiempo al frenar tras la meta.
3. Puede hacer un **calentamiento guiado** antes de arrancar, con ejercicios sencillos según su edad.
4. En Modo Solo, cuenta con **10 segundos de preparación** para guardar el teléfono en el jersey y acomodarse en la grilla.
5. Se reproduce un **audio real de un gate de BMX**, con un tiempo de espera al azar antes de la salida — igual que en una carrera de verdad, para que el corredor no se acostumbre al ritmo y se adelante.
6. En el instante exacto del "drop" (el golpe de salida), arranca un **cronómetro de precisión**.
7. En Modo Asistido, aprieta "Detener". En Modo Solo, **al frenar tras la meta el acelerómetro congela el tiempo automáticamente** y emite una confirmación de 3 segundos (vibración en Android y ráfaga auditiva rítmica en iPhone).
8. El tiempo queda guardado automáticamente en su historial, junto con la fecha y la distancia.

## El tablero de rendimiento

Cada corredor tiene un panel con sus propias estadísticas:

- Su **mejor tiempo** histórico y el **promedio** de los últimos 30 días.
- Cuántos intentos hizo y **cuántos días seguidos** entrenó.
- Un gráfico simple que muestra si está mejorando o no.
- Puede ponerse una **meta de ritmo** (qué tan rápido corre cada 10 metros) en vez de una meta atada a una sola distancia — así una sola meta lo acompaña sin importar si un día entrena 20 metros y otro día 50.

## Detalles pensados para la cancha, no para la oficina

- **Modo Solo con Acelerómetro Integrado:** Sensores optimizados para iPhone 15 (fuerza dinámica pura) y Android (fuerza con gravedad), con umbrales adaptativos de frenado tras la meta.
- **PWA Standalone Instalable:** Se puede agregar a la pantalla de inicio en Android e iOS como una app nativa a pantalla completa sin barras del navegador, con Service Worker, manifiesto WebApp e instrucciones accesibles para Safari.
- **Respuesta Háptica y Auditiva (3 Segundos):** Confirmación clara al terminar el sprint para saber que el tiempo se congeló sin tener que mirar la pantalla.
- **Desbloqueo de Audio en iOS Safari:** Garantiza que el audio del partidor suene a máximo volumen en iPhone.
- **Control de Formulario e iOS AutoFill:** Atributos W3C para evitar sugerencias de contraseñas nuevas en el inicio de sesión.
- La **pantalla no se bloquea sola** mientras el corredor está calentando o corriendo (`WakeLock API`).
- El **audio del gate suena más fuerte**, pensado para escucharse bien al aire libre en una pista.
- Si alguien **olvida su contraseña**, puede recuperarla por correo, como en cualquier app seria.
- Cada corredor puede **exportar un respaldo** de todos sus tiempos cuando quiera.

## Identidad

Se llama **GATERIGHT BMX**, con logo propio y una paleta de colores inspirada en el semáforo de arranque de BMX — rojo, amarillo y verde sobre azul marino — la misma lógica de "listo, ¡ya!" que se ve en la pista real.
