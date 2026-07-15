# Audios de salida (gate)

Coloca aquí tus archivos de audio de salida de BMX (`.mp3`, `.wav`, `.ogg` o `.m4a`). Se detectan automáticamente — no hay que tocar código ni un manifiesto. Cada vez que agregues o quites un archivo, corre de nuevo `npm run build` (o `npm run dev` si está corriendo) para que Astro los recoja.

**Requisito importante para que el cronómetro sea preciso:** el archivo debe terminar exactamente en el momento del "gate drop" (el tono/klaxon de salida), sin silencio después. El cronómetro arranca en el evento `ended` del audio, es decir, en el último instante del archivo. Si tu audio tiene silencio al final, recórtalo antes de subirlo.

Sube varios audios distintos (con distintos tiempos de espera aleatorios antes del drop) para que el corredor no pueda anticiparse memorizando el patrón — así es como funciona el gate real en pista.
