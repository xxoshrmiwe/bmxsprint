# Atribución — ejercicios de calentamiento

Los nombres e instrucciones de los ejercicios de calentamiento (`src/lib/warmup.ts`) están adaptados de
[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset), usado bajo su licencia MIT:

```
MIT License

Copyright (c) 2026 Hasan Emir Yıldırım

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation and data files (the "Software"),
to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Qué se usó y qué no:**

- Se usó únicamente el **texto** del dataset (nombres e instrucciones en español), traducido/adaptado a un formato de pasos cortos para mostrar en pantalla durante el calentamiento.
- **No se incluyó ninguna imagen ni GIF** del dataset. Ese material multimedia pertenece a Gym visual (`© Gym visual — https://gymvisual.com/`) y su redistribución requiere permiso por escrito de Gym visual, según el `NOTICE.md` del repositorio original. No tenemos ese permiso, así que el calentamiento se muestra solo con texto (nombre del ejercicio + pasos), sin fotos ni animaciones.
- Se seleccionaron ~17 ejercicios sin ningún equipo (`equipment: "body weight"` en el dataset original), aptos para hacerse en casa, y se organizaron en tres rutinas según la edad del corredor (`src/lib/warmup.ts`: `obtenerRutina`).
