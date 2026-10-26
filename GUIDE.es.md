# Guía HMS

**RPG Companion HMS Edition 2.9 beta** y **HMS Reporter beta**

Esta guía explica cómo funciona una partida HMS, cómo configurarla y qué hace cada parte.
Lee primero **Empieza aquí**. Usa las demás partes cuando las necesites.

---

## 1. Empieza aquí: tres partes, una partida

Una partida HMS tiene tres partes. Cada parte tiene una tarea.

| Parte | Qué es | Su tarea |
| --- | --- | --- |
| **El bot** | La tarjeta del personaje y sus lorebooks: Re:Zero, Mushoku Tensei, Classroom of the Elite u Overlord | El mundo y sus reglas. Escribe el **HUD del WORLD STATE** al principio de cada respuesta. |
| **HMS Reporter beta** | Un preset: el prompt que envía Lumiverse | Cómo se escribe la historia bajo el HUD: estilo, voces, longitud, razonamiento. |
| **RPG Companion HMS Edition 2.9 beta** | Una extensión: el panel lateral | Lee el HUD y lo muestra en tarjetas. Sigue personas, lo que sienten y lo que saben, misiones, combates y más. Te ayuda a empezar una partida y a hacer preguntas. |

### Quién manda

Cuando dos partes no están de acuerdo, gana este orden:

1. **El bot.** Sus reglas y su HUD son la ley. Los bots lo llaman **STATE IS GOD**. Nada puede ocultar, cambiar ni sustituir el HUD.
2. **El preset.** Solo da forma a la historia bajo el HUD. Nunca cambia una regla ni una línea del HUD.
3. **La extensión.** Lee y muestra. Pide al modelo un pequeño bloque oculto tras la historia, y devuelve lo que recuerda de las personas (Mentes) antes de la respuesta siguiente. Nunca escribe un HUD propio ni añade reglas.

### Cómo es una respuesta

```
### WORLD STATE ###
Day: 3 | Time: 14:10 (Afternoon)
◆ World of Re:Zero → Lugunica → Roswaal Mansion
Arc: Arc 2: A Week at the Mansion
***
La historia...
<rpg_companion>{ ... }</rpg_companion>
```

- **El HUD** es la parte de arriba, desde `### WORLD STATE ###` hasta la línea `***`. Pertenece al bot.
- **El muro** es la línea `***`.
- **La historia** va bajo el muro. Sigue las reglas del bot, escrita con el estilo del preset.
- **El bloque oculto** va al final. Pertenece a la extensión. Nunca lo ves: se elimina del mensaje guardado.

### Quién es dueño de qué

| Cosa | Dueño | Notas |
| --- | --- | --- |
| El HUD: hora, lugar, arco, poderes, dinero | Bot | La extensión solo lo lee. |
| Reglas: muerte, diferencias de poder, Return by Death, exámenes | Bot | Los combates de la extensión usan las reglas del propio bot. |
| Comandos de inicio y el catálogo | Bot | La tarjeta Nueva partida solo los rellena por ti. |
| Respuestas OOC | Bot (su personaje guía) | La tarjeta OOC pregunta a esa misma guía. |
| Heridas en Re:Zero y Mushoku Tensei | Bot | Estos bots guardan las heridas en su HUD. La extensión no se mete. |
| Heridas en Classroom of the Elite y Overlord | Extensión | Estos bots no guardan heridas. La tarjeta Heridas las sigue. |
| Cómo se lee la historia, su longitud, el razonamiento | Preset | Ajústalo en el icono de controles deslizantes. |
| Emoji y colores de diálogo | Extensión | Se dibujan en tu pantalla. El preset nunca escribe emoji. |
| Panel lateral, mapa, Crónica, personas, misiones | Extensión | Se leen del HUD y del bloque oculto. |
| Quién es un personaje | Bot (las tarjetas de los personajes) | Las tarjetas siempre ganan. |
| Cómo se interpreta a los personajes por dentro | Preset (el bloque Minds) | De FrankenSIM. Ver la parte 7. |
| Los números: sentimientos, rutinas, quién sabe qué, detalles sembrados | Extensión (Mentes) | El modelo solo dice lo que se movió. La extensión guarda el resto. Ver la parte 7. |

---

## 2. Instalar y configurar

Necesitas **Lumiverse 1.2.0 o más reciente**.

### Paso 1: Quita el RPG Companion antiguo

Si tienes la extensión RPG Companion original, desactívala o quítala. Las dos añadirían cosas a tu prompt.

### Paso 2: Instala la extensión

1. Abre el cajón y ve a **Extensions**.
2. Haz clic en **Add Extension**.
3. Elige una forma:
    - **Install from Source**: pega el enlace de GitHub de la extensión.
    - **Import Local** (solo propietario o admin): primero pon la carpeta `rpg_companion_hms` en `Lumiverse/data/extensions/`.
4. Lee los permisos y haz clic en **Install**.
5. Las extensiones nuevas empiezan apagadas. Activa **Enable**.
6. Concede los permisos. Puedes saltarte cualquiera. Esa parte se apaga y te dice por qué.

| Permiso | Para qué sirve |
| --- | --- |
| interceptor | Añade la pequeña petición de la extensión a tu prompt. |
| generation | Las llamadas propias de la extensión al modelo: combates, la guía OOC, resúmenes de capítulo, un bloque del panel lateral que faltó. |
| chat_mutation | Mantiene el bloque oculto fuera de las respuestas guardadas, vuelve a poner líneas del HUD y publica tus turnos de nueva partida, teléfono y Mover el mundo. |
| world_books | Lee tus lorebooks: el Atlas, la comprobación de la línea Arc, la guía OOC, el lore de los combates. |
| memories | Usa el Memory Cortex de Lumiverse: la Crónica escribe en él, los combates leen de él. |
| image_gen | Solo retratos de personajes. |

### Paso 3: Importa el preset

1. Abre el **Preset Manager** en Lumiverse.
2. Importa el archivo `HMS_Reporter_beta.json`. Viene con la extensión, en su carpeta `preset`.
3. Elige **HMS Reporter beta** como preset de tus chats HMS.

### Paso 4: Abre el panel

Abre un chat con un bot HMS. Luego abre la pestaña **RPG Companion (HMS)** en el cajón lateral.

### Paso 5: Usa el preset de tu mundo

Tras la primera respuesta, el panel ofrece **Usar el preset [mundo]**. Haz clic.
Prepara las tarjetas, combates y tema adecuados para ese bot con un clic.
También puedes hacerlo más tarde en **Ajustes → Estilo de juego**.

### Idioma

El panel habla **English**, **Português (BR)** y **Español**: **Ajustes → General → Idioma**. En *Automático* sigue el idioma del navegador.
Con **Pedir el texto del panel en este idioma** activado, el modelo escribe pensamientos, descripciones, resúmenes de capítulo y las respuestas de la guía OOC en el idioma elegido. El HUD, los nombres y las palabras clave nunca se traducen, para que los lorebooks sigan cargándose.

### Buenos ajustes para empezar

- Controles del preset: **Thinking: Normal**, **Prose length: Scene-led**, **Start replies with the HUD header: Auto**.
- Lumiverse: activa el **Memory Cortex** si quieres que la Crónica recuerde los momentos clave.
- Extensión: deja el **Modo conjunto** (Ajustes → General).
- ¿Quieres emoji o diálogo en color? Ajustes → **Extras del chat y del panel** → **Diálogo**. Empiezan apagados.

---

## 3. Empezar una partida nueva

### El catálogo

Todo bot HMS abre con un **catálogo**. Su primer mensaje tiene muchas páginas. Desliza a izquierda y derecha para verlas.

- **La página del hub** dice cómo empezar y nombra la línea del **start handler**.
- **La página canvas** está casi vacía. Escribes tu inicio debajo de ella.
- **Las páginas de comandos** listan inicios, complementos y ejemplos listos.

### La línea del start handler

Tu primer mensaje debe empezar con la línea de inicio del bot, en una línea propia.

| Bot | Primera línea | Línea para reanudar una campaña antigua |
| --- | --- | --- |
| Re:Zero | `ReZero_Start_Handler` | `ReZero_Start_Continuer` |
| Mushoku Tensei | `MUSHOKU_TENSEI_START_HANDLER` | `MUSHOKU_TENSEI_START_CONTINUER` |
| Classroom of the Elite | `Cote_Start_Handler` | `Cote_Start_Continuer` |
| Overlord | `Overlord_Start_Handler` | `Overlord_Start_Continuer` |

Luego van tus comandos. Por ejemplo:

```
ReZero_Start_Handler
Start at Arc 3 with RBD, Hell Mode, Start with Echidna
```

Los comandos se quedan en inglés, como los escribe el bot.

### La tarjeta Nueva partida (la forma fácil)

En un chat nuevo, el panel muestra **Nueva partida**. Lee las páginas del catálogo por ti.

1. Elige una página arriba.
2. Elige un **inicio**.
3. Elige los **complementos** que quieras. Los complementos se apilan sobre un inicio.
4. Rellena los huecos, como `[Name]`.
5. Lee los avisos. Por ejemplo: aún no hay inicio, un hueco vacío, o ningún Return by Death en Re:Zero. Un clic añade `with RBD`.
6. Pulsa **Empezar la partida**.

La tarjeta pasa el saludo a la página canvas y envía tu comando. También puedes editar el comando a mano, **Copiarlo** o **Limpiarlo**.

### Reanudar una campaña antigua

Dentro de la tarjeta Nueva partida, abre **Reanudar una campaña antigua**.

1. Pega el último HUD de tu chat antiguo. Es tu archivo de guardado.
2. Si los tienes, pega tus últimos mensajes y un resumen de la historia.
3. Pulsa **Reanudar la campaña**.

La tarjeta pone primero la línea Continuer del bot, como pide el bot.

### Tras la primera respuesta

- El bot construye el HUD en el turno 1. A partir de ahí lo lleva en cada respuesta.
- **Comprobación de la línea Arc.** La línea Arc es una clave de búsqueda. Si está mal escrita, el lore del arco nunca se carga. La tarjeta World State te avisa y ofrece la grafía del libro con un clic.

---

## 4. Qué pasa en cada turno

1. Escribes lo que haces y lo envías.
2. El preset construye el prompt: la tarjeta y el motor del bot, tu lore, la memoria, el chat, el estado de las mentes y la pequeña petición de la extensión.
3. El modelo escribe el HUD, el muro `***`, la historia y el bloque oculto.
4. La extensión lee la respuesta:
    - Lee el HUD y actualiza las tarjetas.
    - Lee el bloque oculto (personas, sentimientos, rutinas, lo que la gente descubrió, detalles sembrados, misiones, teléfono, heridas) y lo elimina del mensaje guardado.
    - Hace las cuentas de las Mentes: limita cada paso, deja que los sentimientos viejos se enfríen, recuerda las deudas.
    - Busca líneas del HUD que desaparecieron y vuelve a poner las que fijaste.
    - Dibuja el HUD como tarjeta en el chat, y los colores y emoji de diálogo si los activaste.
5. Cuando contestas a una respuesta, esa respuesta queda asentada. La Crónica escribe entonces sus momentos clave en el Memory Cortex.

### La fila de botones

| Botón | Qué hace |
| --- | --- |
| **Mover el mundo** | No haces nada nuevo. Un hilo de la historia fuera de escena avanza un paso. |
| **Combate inmersivo** | Empieza un combate que juegas en el chat. El panel lo sigue. |
| **Combate por turnos** | Abre la ventana de combate de D&D. Solo con D&D activado. |
| **Volver a leer** | Vuelve a leer la última respuesta. Gratis: sin llamada al modelo. Úsalo cuando una tarjeta no se actualizó. |

### La barra superior

| Elemento | Qué hace |
| --- | --- |
| Modo conjunto / Modo separado / En pausa | Muestra cómo obtiene la extensión sus datos. Ver Ajustes → General. |
| **Actualizar** | Vuelve a pedir al modelo los datos del panel lateral. Cuesta una llamada. |
| Cajón / Flotante / Ventana propia | Dónde está el panel: en el cajón, flotando sobre el chat o en su propia ventana para una segunda pantalla. |
| **Zona de pruebas** | Un chat de práctica dentro de la extensión. El modo Demo no cuesta nada. |
| **Guía** | Esta guía. |
| **Ajustes** | Todos los ajustes. |

### Botones en la barra de escritura del chat

**Actualizar el panel lateral**, **Abrir RPG Companion**, **Iniciar o reanudar un combate** y **Mover el mundo**.

---

## 5. HMS Reporter beta (el preset)

### Qué hace

HMS Reporter beta le dice al modelo cómo escribir la historia bajo el muro. Siempre pone al bot primero. Dice: el núcleo y sus entradas de lorebook están por encima de todo en este preset.

El preset está en inglés, como la tarjeta. Para jugar en español, díselo al bot (por ejemplo, en tu persona o en una nota de autor); el HUD sigue en inglés, porque sus palabras cargan el lore.

### Los bloques, de arriba abajo

| Bloque | ¿Activado al principio? | Qué hace |
| --- | --- | --- |
| Frame | Sí | Dice quién manda y la forma de la respuesta: HUD, muro, historia y el bloque oculto si se pide. Explica los mensajes OOC. |
| Game card | Sí | La descripción del bot y su system prompt. |
| HMS core (campo personality) | Sí | El motor del bot: sus reglas y su HUD. |
| Scenario | Sí | El escenario de la tarjeta, si lo tiene. |
| Player persona | Sí | Tu persona. |
| Example messages | Sí | Solo ejemplos de estilo. |
| Reporter: how the prose reads | Sí | Empieza por lo que cambió. Usa detalles exactos. Muestra solo lo que se puede ver. Termina donde el mundo te devuelve el turno. Corta frases hechas. |
| Voices and groups | Sí | La gente habla poco y con su propia voz. Nadie lee mentes. Los grupos hablan entre sí. |
| The player's character | Sí | El modelo nunca escribe tus decisiones, palabras ni pensamientos. Un Narrative Mode del bot puede cambiarlo. |
| Minds (from FrankenSIM) | Sí | Cómo interpretar a cada personaje por dentro: el lado que lidera, sentimientos que se arrastran, máscaras, una honestidad que se gana, un conocimiento que necesita un camino para llegar. Ver la parte 7. |
| Mature content (adults only) | No | Escenas adultas solo entre adultos. Los menores y los lazos familiares siempre quedan no explícitos. |
| Gore | No | Muestra la violencia sin suavizarla. |
| World info (before) y (after) | Sí | Tus entradas de lorebook. |
| Memory (Chat Memory y Memory Cortex) | Sí | La memoria a largo plazo de Lumiverse. |
| Story summary (Loom Summary) | No | El resumen propio de Lumiverse. Actívalo solo si lo usas en vez de los Capítulos. |
| Chat history | Sí | El chat mismo. |
| Card's post-history instructions | Sí | Lo que la tarjeta pone tras el chat. |
| Minds state (RPG Companion) | Sí | Lo que la extensión recuerda de las personas de la historia. Queda vacío sin la extensión, con las Mentes apagadas y en los turnos OOC. |
| Fight craft | Solo en combates | Se carga solo durante los combates: preparación de golpes, la sala en el combate, el impacto antes del dolor. |
| Side panel (RPG Companion) | Sí | Aquí va la petición de la extensión. Queda vacío sin la extensión y en los turnos OOC. |
| Before you write | Sí | Razonamiento, longitud y el recordatorio de los marcadores de diálogo. En un turno OOC: responder fuera del personaje. |

### Tus ajustes: el icono de controles deslizantes

| Ajuste | Opciones | Consejo |
| --- | --- | --- |
| Thinking | Off, Light, Normal (predeterminado), Deep | Normal y Deep piensan primero en cada personaje (el paso de las mentes). Deep además mueve el mundo fuera de escena y revisa los detalles sembrados. Es el más lento. |
| Think out loud | Activado o apagado | Para modelos que no razonan solos. Activa también Auto-parse thoughts en Lumiverse, para que el plan se pliegue. |
| Prose length | Brief, Scene-led (predeterminado), Long, Very long | El HUD nunca cuenta para la longitud. |
| Start replies with the HUD header | Auto (predeterminado), Always, Never | Auto solo ayuda a Kimi y DeepSeek. Usa Always solo si un modelo se salta el HUD a menudo, con el razonamiento apagado. |

### Mensajes OOC

Empieza un mensaje con el disparador OOC del bot, como `[OOC: ...]` o `OOC guide: ...`.
El preset pide entonces una respuesta fuera del personaje: sin HUD, sin historia, sin bloque oculto, y no pasa el tiempo.

---

## 6. Las tarjetas de la extensión

El panel muestra una tarjeta por cosa. Una tarjeta solo aparece cuando tiene algo que mostrar.
Haz clic en el título de una tarjeta para plegarla o desplegarla.

### Nueva partida
Solo en un chat nuevo. Ver la parte 3.

### World State
El HUD, línea a línea.

- **Fija** una línea (el icono de chincheta) para mantenerla exactamente igual. Si el modelo la pierde o la cambia, la extensión la vuelve a poner. También se le recuerda al modelo.
- **La guardia.** Si una línea desaparece, la ves con **Restaurar**. Una línea portadora (una que mantiene lore cargado, como la línea Arc) se marca, porque perderla oculta lore.
- Las líneas que terminan por sus propias reglas (una herida curada, un examen superado) aparecen como **terminadas**, con un botón para volver a ponerlas.
- Si una respuesta no tiene HUD en absoluto, pulsa **Devolver el último HUD**.
- La **comprobación de la línea Arc** avisa cuando la línea Arc no carga lore de ningún arco, y lo arregla con un clic.

### La tarjeta del mundo
Una tarjeta por mundo: **Re:Zero**, **Overlord**, **Classroom of the Elite**, **Mushoku Tensei**, **Undertale**, **Dark Souls** y **Skyrim**.
Muestra las estadísticas propias de ese mundo a partir del HUD, explicadas con tus lorebooks. Algunos ejemplos:

- Re:Zero: muertes y el punto de guardado, Autoridades, contratos de espíritu y sus rangos.
- Overlord: niveles y clases, con una comprobación de que cuadran.
- Classroom of the Elite: el calendario, la clasificación de las clases, Private Points, el examen.
- Mushoku Tensei: estilos de espada y rangos de magia, los consejos del Dios-Hombre y la línea de tiempo de la saga: el año (K.) en una barra con los 22 arcos, el arco actual y cuántos años faltan para el siguiente. Los arcos y sus años salen de las entradas "[WORLD STATE — ARC N: …]" del lorebook, o de la lista canónica si no las tiene.

### Mapa
Dónde está cada uno en la sala. Empieza apagado: Ajustes → Extras del chat y del panel → **Mapa**.
Una sala se dibuja una vez y luego solo se mueven las personas. El **banco de mapas** guarda cada sala dibujada para ese mundo, así que un lugar nunca se paga dos veces.

**Edificio entero.** Cuando ya hay dos o más salas de un mismo edificio dibujadas, pulsa **Edificio entero**. La extensión une las salas por sus puertas, planta por planta. No gasta tokens. Quien no está en tu sala aparece donde su rutina lo pone. Una sala a la que ninguna puerta lleva todavía se dibuja con línea discontinua. Ver la parte 7.

### Atlas
El libro de lugares del bot como mapa. Muestra dónde estás, las salas a tu alrededor y detalles de cualquier lugar: cuánto está vigilado, horario, quién suele estar allí.
Haz clic en un lugar para entrar, **Subir** para salir.

### Tú
Tu propio estado: salud y otros recursos, medidores, ánimo, estrés y cordura.
El nivel y la experiencia solo aparecen en mundos que tienen niveles.
**De serie** lista lo que el bot da por hecho que tienes. **Llevado** lista cosas pequeñas que conseguiste en la historia. Puedes añadirlas o quitarlas.

### D&D
Una hoja de personaje y un lanzador de dados. Tu tirada va en tu próximo mensaje.
Apágalo en Ajustes → Módulos si tu partida no usa dados.

### Personas
Todos los que has conocido. Cada persona muestra:

- **Posición**: qué tan cerca se siente de ti, de Nemesis a Devoted. Nunca es romance.
- **Vínculo**: qué tipo de relación es: compañero de clase, mentor, familia, pareja.
- **La línea 🧠**: lo que siente ahora y hacia quién, cuán cálido se muestra, y sus tres sentimientos más fuertes hacia ti. ⚠️ es un muro, ⚖️ es una deuda tuya con esa persona.
- **📍** qué está haciendo y hasta cuándo.
- **Por dentro, sentimientos y lo que sabe**: ábrelo para ver el resto. Ver la parte 7.
- **En la escena**: cómo se ve y cómo actúa ahora, y sus pensamientos.

Las barras clásicas (Afecto, Confianza y las demás) vuelven si pones Ajustes → Mentes → **Sentimientos hacia ti** en Barras clásicas.

Usa **Fijar el vínculo** si la historia interpreta mal una relación.
Los menores están protegidos: nunca un vínculo romántico, nunca ningún deseo.
Los miembros del grupo muestran cómo aguantan. Añádelos con **Añadir al grupo**.

### Finanzas
Un libro de cuentas de cada pago, sueldo, compra, soborno, préstamo y deuda, desde tus mensajes y la historia, junto al saldo del HUD (que sigue siendo el registro de lo que tienes).

- **Deudas pendientes**: quién debe a quién y cuánto falta; un pago a la misma persona lo va descontando, y ✓ la salda a mano.
- **Libro de cuentas**: de lo más nuevo a lo más antiguo, con totales de entradas y salidas por moneda. **Registrar** añade una entrada tuya; ✕ quita una.
- Al modelo se le recuerdan las deudas pendientes, para que el acreedor no lo olvide.

### Facciones
Grupos, no personas: gremios, reinos, iglesias, casas nobles, bandas, clases de la escuela. Para cada uno: tu **posición** (perseguido, hostil, poco amistoso, neutral, amistoso, de confianza, aliado, miembro), tu **rango** dentro, cualquier **recompensa** por tu cabeza, por qué cambió por última vez y quién de Personas pertenece al grupo.

- Desde tus mensajes y la historia, y desde las líneas Faction, Guild, Affiliation y Bounty del HUD. Cambia la posición desde la tarjeta; vale hasta que la historia la mueva otra vez.
- Al modelo se le recuerda tu posición con cada uno. Los grandes cambios, ascensos y recompensas van a la Crónica.

### Secretos
Quién sabe qué.

- **Tus secretos** (una vida pasada, el Return by Death, un plan) y quién descubrió cada uno, y cómo. **Lo que sabes de otros**: secretos ajenos que descubriste.
- Desde la historia cuando alguien descubre algo, y a mano: añade un secreto, a alguien que lo sabe, o ✕ a quien no lo sabe.
- Al modelo se le dice quién sabe cada secreto; quien no aparece no lo sabe y no puede actuar sobre él. Cada descubrimiento va a la Crónica.

### Agenda
Citas, promesas y horas fijadas: "nos vemos mañana en el río", "el examen es el viernes", "vuelve antes del anochecer".

- Vienen de tus mensajes y de la historia. Las horas se colocan en el reloj del HUD ("tomorrow at dawn", "in three days", "Day 5, 14:00"), así que la tarjeta hace la cuenta atrás: **Con retraso**, **Pronto** (próximas 3 horas), **Próximamente**, **Sin hora fija**.
- ✓ cumplida, ✗ perdida, ⊘ cancelada; la historia también las marca. Las terminadas se pliegan.
- Al modelo se le recuerda lo próximo, lo que vence o lo que va con retraso, para que la gente recuerde que habíais quedado. Las promesas cumplidas y perdidas van a la Crónica.

### Propiedades
Lo que posees o tienes y no llevas encima: **vehículos** (un carro, un barco), **monturas**, **viviendas** y habitaciones alquiladas, **tierras**, **edificios**, **negocios**, **títulos** y **cargos**.

- Se leen de tus mensajes y de la historia (ganada, perdida, cambiada) y de las líneas Title, Property, Mount y similares del HUD. Lo que el HUD lista no se puede marcar como perdido.
- Cada una muestra dónde está, una nota (estado, rango, lo que aporta), desde cuándo es tuya y lo que la tarjeta Equipo dice que está guardado allí ("dejado en el carro").
- **Editar** fija dónde está o una nota; ✕ la marca como perdida. Lo ganado y lo perdido va a la Crónica.

### Equipo
Cómo llevas cada cosa: **en la mano**, **puesto**, **envainado**, **encima** (a la espalda, en el cinturón), **dentro de una bolsa**, **dejado en algún sitio** o **tirado**.

- Basta con escribirlo en tu mensaje: "envaino mi espada y me cuelgo la mochila a la espalda", "la carta va al bolsillo del abrigo". Tras la respuesta la tarjeta lo muestra. Lo que dices que haces cuenta, salvo que la respuesta muestre que falló.
- Lo que el HUD lista en Equipment o Items también aparece (como *en el HUD*). El HUD sigue siendo el registro de lo que posees; Equipo solo dice cómo lo llevas.
- **Este turno** lista lo que cambió. Cada bolsa tiene su propia lista de lo que hay dentro.
- **Mover…** cambia cómo llevas algo, lo guarda en una bolsa o lo marca como desaparecido. Vale hasta que la historia diga algo más nuevo sobre ese objeto.
- Al modelo se le recuerda cómo está todo, para que no se blanda una espada envainada ni se abra una mochila que se dejó caer.

### Familia
Tu propia familia, en su propia tarjeta: qué es cada uno para ti, si sigue vivo y dónde está.

- **Dónde**: el lugar que la historia mostró o contó por última vez. *visto* significa que estaba en la escena contigo (el lugar es tu ubicación del HUD), *contado* que alguien en la historia lo dijo, *una suposición* que solo se supone. **Aquí contigo** marca a quien está en la escena actual.
- **Estado**: vivo, desaparecido, muerto o desconocido. Un desaparecido que vuelve a verse se marca como encontrado.
- **Dónde ha estado**: cada cambio de lugar, con cómo se supo y hace cuánto en el reloj del HUD.
- La posición, el Afecto y la Confianza vienen de Personas, así que ambas tarjetas coinciden.
- **Corregir**: fija el lugar, el parentesco o el estado. Vale hasta que la historia diga algo más nuevo sobre la persona.
- **Añadir a la familia** para alguien que la historia aún no nombró. **✕** oculta a quien no es familia.
- Al modelo se le recuerda dónde se vio por última vez a cada uno. Muertes, desapariciones, reencuentros y noticias van a la Crónica.

Ajustes → Sistemas HMS tiene, para cada una de estas tarjetas, la tarjeta en sí, la lectura de la historia y el recordatorio al modelo.

### Teléfono
Tu dispositivo, tu dinero, tus contactos, tus mensajes y avisos.
Envía un mensaje, llama o transfiere. Entra en la historia como tu turno, y el bot decide si llega a alguien.

### Cuerpo
Heridas y condiciones del HUD, con cuánto lleva cada una.

### Heridas
Solo para bots que no guardan heridas en su HUD (Classroom of the Elite, Overlord).
Cada herida está en carne viva hasta ser atendida. Tratada no es curada. La tarjeta muestra el tiempo de curación y avisos.

### Mente
Condiciones mentales, como Dread, y el Consejo Mental.

### Supervivencia
Empieza apagada. Sigue el tiempo desde que dormiste, comiste y bebiste, con el reloj del HUD. El bot decide qué significa.

### Magia
Reservas de magia, tradiciones, tiempos de recarga y un libro de conjuros que aprende tus conjuros.

**Lista de hechizos.** Cuando el lorebook del bot describe hechizos, la tarjeta los lista por escuela, leídos del propio lorebook: una entrada por hechizo (`[SPELL — Earth Lance]` con `School:` y `Rank:`, o `Earth Lance [Earth Magic - Intermediate]`), un índice de hechizos (`### Fire Magic` › `**Goa Series**` › `* **El Goa** – …`) o una entrada por elemento. El HUD decide qué está a tu alcance: `Magic School: Water: Saint, Fire: Advanced` da un rango por escuela; `Magic: Fire | Gate: C-Rank` da tus elementos, y la Gate hasta dónde llega una serie (D El, C Ul, B Al). Cada hechizo aparece como **Dominado**, **Conocido**, **Estudiando**, **A tu alcance**, **Siguiente rango**, **Rango desconocido** (el lorebook no le da rango, así que decide la historia; aparece en Todos), **Bloqueado** o **Especial** (único de un personaje, prohibido, perdido). **Usables y siguientes** oculta el resto; **Todos** muestra todo; la búsqueda encuentra un hechizo por nombre o efecto. Con `Casting Method: Voiceless`, el conjuro aparece como opcional.

**Aprender.** Pulsa 📖 para estudiar un hechizo. Antes de cada respuesta se le recuerda al modelo lo que estudias, con el efecto y el conjuro del lorebook, y la regla de que aprender exige práctica y tu rango. El bloque del panel lateral informa el progreso (una barra bajo el hechizo) y el hechizo cuando lo lanzas bien por primera vez: pasa a Conocido y a la Crónica. ✓ lo marca como aprendido a mano; ✕ lo quita. Cuando el rango de una escuela sube en el HUD, la tarjeta dice qué hechizos acaba de abrir. Los hechizos que conoces también van a la preparación de las peleas. Aparecer en el menú de una pelea, o solo intentarlo, nunca cuenta como aprender; un hechizo que la historia te muestra practicando pasa solo a Estudiando. Los lorebooks de cualquier tamaño se leen enteros, no solo las primeras 200 entradas.

### Técnicas de espada
La misma lista que los hechizos, para los estilos de espada. Las técnicas salen del lorebook: `[TECHNIQUE — Longsword of Light]` con `Style: Sword God · Rank: Saint`, o texto corrido como "Sword God Technique: Silent Strike." y "… technique of the Water God Style, achieved at the Saint tier". La línea `Sword Style:` (o `Martial Style:`) del HUD da tu rango en cada estilo, así que cada técnica aparece como Conocida, Estudiando, A tu alcance, Siguiente rango, Bloqueada o Rango desconocido. Estudiar, ✓ y ✕ funcionan como con los hechizos; cuando la historia informa la primera ejecución limpia, pasa a Conocida y entra en la Crónica. Un lorebook complementario, *Mushoku Tensei - Sword Techniques (Mazaki)*, da un rango a cada técnica de los estilos Sword God, Water God y North God, y añade el Estilo Greyrat creado por Ars Greyrat (añadido de fan).

### Habilidades
Tus poderes, habilidades y atributos, leídos del HUD.

### Misiones
- **La trama**: dónde está la historia y sus hilos abiertos.
- **🔫 Detalles sembrados** (el arma de Chéjov): cosas pequeñas que la historia sembró y que deberían tener consecuencias después. Los **maduros** pueden pasar ya. Uno con 🔒 espera una hora, una persona o una condición. Pulsa ✕ para quitar uno que no encaja.
- **Objetivos**: lo que intentas hacer ahora. Puedes añadir los tuyos. Los tuyos nunca se envían al modelo.
- **Misiones** del HUD, con el objetivo, quién la dio, dónde, la recompensa y el tiempo restante.
- **Tus notas** nunca se envían al modelo.
- Si una misión sale del HUD estando aún activa, pulsa **Devolver**. Si el bot solo dejó de listarla porque terminó, pulsa **Ya terminó**.

### Crónica
La línea temporal de la historia: momentos clave, hitos, lo que la gente llegó a sentir por ti y puntos de la trama.
Fíltrala, marca una entrada con estrella, oculta una o añade la tuya.
Las respuestas asentadas se escriben en el Memory Cortex. Ver la parte 9.

### Capítulos
Resúmenes de partes de la historia. Pulsa **Terminar capítulo y resumir** cuando termine una parte.
Los resúmenes van con cada mensaje, además del chat.

### Guía OOC
Hazle una pregunta a la guía del bot. Ver la parte 8.

### Crítico
Una franja roja para peligro real: salud cerca de cero, una condición en su peor grado, una herida en carne viva demasiado tiempo.

### El seguimiento de combate
Durante un combate inmersivo: el HP, MP y Stamina de todos, efectos, lo que acaba de hacer cada luchador y un registro del combate.

### Combates

| Tipo | Cómo funciona |
| --- | --- |
| **Combate inmersivo** | Sin ventana. Luchas escribiendo en el chat. El panel sigue cuerpos, efectos y movimientos. Los enemigos guardan planes ocultos. **Estudia** a un enemigo para conocer sus puntos débiles. Las reglas del bot deciden quién gana. |
| **Combate por turnos** | Una ventana de D&D: iniciativa, tiradas de ataque, dados de daño, tiradas de salvación. La extensión tira los dados. Al terminar, el desenlace se publica en el chat como una respuesta normal, con el HUD. |
| **Ventana narrativa** | La ventana de combate antigua. Oculta salvo que la actives en Ajustes → Combates → Antiguo. |

### En el propio chat

- **La tarjeta del HUD.** El HUD dibujado como una tarjeta limpia con los colores del bot. La respuesta guardada conserva su texto plano. **Mostrar el HUD como texto** abre la versión simple.
- **Estados internos** bajo cada respuesta: pestañas de Escena, Personas, Mentes, Vínculos, Trama y Mapa. **Mentes** muestra lo que se movió por dentro de cada persona en esa respuesta.
- **Visualización del diálogo** (empieza apagada): un emoji para el sentimiento de quien habla, un color por hablante o su nombre. **Tono de voz** dibuja una frase susurrada en cursiva y una cortante en negrita.

### Zona de pruebas
Un chat de práctica dentro de la extensión. Ejecuta el mismo código que un chat real y no toca ninguno de tus chats.
**Demo** juega turnos guionizados para cada mundo y no cuesta nada. **En vivo** usa tu modelo.

---

## 7. Mentes (de FrankenSIM)

**Mentes** es cómo sienten, piensan y actúan las personas de la historia. Viene de **FrankenSIM 4 Mini, de Wireless (Ryah)**, con permiso. **TFDY** (Ternura, Furia, Pavor, Anhelo) es de **Pyropia**. Gracias a los dos.

### Cómo funciona

1. El modelo escribe la historia como siempre.
2. En el bloque oculto dice solo **lo que se movió** dentro de cada persona en esta respuesta, y por qué.
3. La extensión hace las cuentas: guarda cada número, limita cada paso, deja que los sentimientos viejos se enfríen, y recuerda.
4. Antes de la respuesta siguiente, devuelve el estado al modelo como memoria.

El bot sigue mandando. Las tarjetas de los personajes dicen quién es alguien. Las Mentes solo recuerdan lo que la historia mostró.

### Por dentro de una persona

| Parte | Qué significa |
| --- | --- |
| **Sentimiento** | Lo que siente ahora, nombrado por hacia dónde lleva (la lista de Parrott: amor, alegría, sorpresa, ira, tristeza, miedo), y hacia quién. |
| **TFDY** | Su ánimo de fondo: 💗 Ternura, 🔥 Furia, 😰 Pavor, 🌙 Anhelo, de 0 a 4. Cada uno descansa en un nivel que fija su temperamento. |
| **Muestra** | Cuán cálida se muestra por fuera: ❄️ gélida, fría, templada, cálida, 🔥 ferviente. Puede ser distinto de lo que siente. |
| **Máscara** | La cara que lleva: firme, agrietándose o caída. |
| **Sus lados** | Cinco a siete lados sacados de su tarjeta. Uno lidera cada vez. Si el mismo lidera tres respuestas seguidas, el panel lo dice. |
| **Todavía carga** | Un sentimiento fuerte de las últimas respuestas que no se ha ido. |

### Hacia ti (y entre ellos)

Doce sentimientos, cada uno de 1 a 20:

| Cálido | Su espejo |
| --- | --- |
| 🌶️ Deseo | 😠 Odio |
| 🎲 Juego | 🥊 Discordia |
| 🤝 Amistad | ❄️ Enemistad |
| 🛠️ Alianza | 🪨 Estancado |
| 🏠 Pertenencia | 🌫️ Indiferencia |
| 🕊️ Cuidado | 🐍 Envidia |

- **Un muro** (⚠️): un sentimiento y su espejo están los dos altos (10 o más), como deseo y odio. Sale de lado.
- **Puerta** 🚪: cuánto se permite sentir: dormida, atenta, consciente, anhelante, abierta. Se mueve un paso cada vez, y solo por un acontecimiento.
- **Lo muestra / Lo dice**: si el sentimiento sale en lo que hace y en lo que dice.
- **Filtros**: lo que frena el sentimiento (social, valores, encaje, lazos). Cada uno puede agrietarse paso a paso. Abierto nunca se vuelve a cerrar.
- **Deuda** ⚖️: un daño que le hicieron. Queda hasta que se repara.
- **Modo**: desconocido, cálido, tenso, hostil, amantes y más.

### Las cuentas que hace la extensión

| Regla | Qué significa para ti |
| --- | --- |
| **Lo máximo que un sentimiento se mueve en una respuesta: 2** | Una escena no le da la vuelta a una persona. |
| **Enfriarse: un paso cada 3 respuestas quietas** | Un sentimiento que nada alimenta vuelve a donde descansa. Los grandes se enfrían un poco más rápido. |
| **Asentarse** | Un sentimiento empujado en la misma dirección tres veces pasa a ser parte de quién es esa persona para ti. |
| **Nunca 0** | Nadie no siente nada. Un primer encuentro empieza en 3 o más. |
| **Menores y familia** | Nunca deseo, nunca un modo romántico, diga lo que diga el modelo. |
| **Return by Death** | Cuando el tiempo vuelve atrás, todos olvidan el bucle deshecho: sus sentimientos, lo que aprendieron en él y sus planes. Los detalles sembrados se quedan, porque tú los viste. |

Puedes cambiar el tamaño del paso y la velocidad a la que se enfrían en Ajustes → **Mentes**.

### Rutinas, conocimiento y detalles sembrados

- **Rutinas** 📍 (FrankenSIM las llama agendas): qué está haciendo cada persona, dónde y hasta cuándo, aquí o en otra parte. Cuando pasa la hora, el panel dice **terminó**. Nadie salta de un sitio a otro. No la confundas con tu **Agenda**, que son tus propias citas.
- **Quién sabe qué**: cada hecho que una persona descubrió, y cómo: 👁️ lo vio, 👂 lo oyó a escondidas, 🗣️ se lo contaron, 🔎 pruebas, ✉️ mensaje, 🌐 lo sabe todo el mundo, 💬 chisme, 🤔 lo dedujo. Una **creencia falsa** se subraya en rojo. Pulsa ✕ si alguien no debería saber algo. Quien conoce un secreto tuyo (tarjeta Secretos) también lo muestra aquí, con 🔒.
- **Detalles sembrados** 🔫 (el arma de Chéjov): en la tarjeta Misiones. La historia decide cuándo se cumple uno. Se guardan hasta 20. Los viejos y ligeros se desvanecen.
- **Mapas de edificios**: en la tarjeta Mapa, a partir de las salas que dibujó la historia.
- **El bloque del propio bot**: algunos bots (el de Re:Zero, por ejemplo) piden al modelo su propio bloque `side_panel` en la respuesta. La extensión lo lee en estas mismas tarjetas, lo quita de la respuesta guardada y deja de pedir las partes que el bot ya escribe, para que nada se escriba dos veces.

### Encender y apagar partes

Ajustes → **Módulos** → **Mentes (de FrankenSIM)** tiene cinco interruptores: Mentes y sentimientos, Rutinas, Quién sabe qué, El arma de Chéjov, Mapas de edificios. Ajustes → **Mentes** tiene los detalles. **Deshacer mis correcciones** recupera hechos y detalles que quitaste.

**Coste:** con todo encendido, unos 1.000 tokens de instrucciones y 300 a 600 tokens de estado por respuesta, más lo que el modelo escribe en su bloque oculto. Con los demás módulos, la respuesta del tracker se alarga: si el estado dice que se cortó, sube el max tokens de la conexión o apaga lo que no uses.

---

## 8. Preguntar fuera del personaje (OOC)

Cada bot tiene un personaje guía que responde preguntas sobre el mundo, las reglas y los comandos.

| Bot | Guía | Disparador |
| --- | --- | --- |
| Re:Zero | Echidna | `[OOC: tu pregunta]` |
| Mushoku Tensei | Roxy | `OOC guide: tu pregunta` |
| Overlord | Demiurge | `OOC guide: tu pregunta` |
| Classroom of the Elite | Arisu Sakayanagi | `OOC guide: tu pregunta` (también `[OOC:` u `OOC:`) |

### Dos formas de preguntar

1. **En el panel**: abre la tarjeta **Guía OOC**, escribe tu pregunta y pulsa **Preguntar**. La respuesta se queda en el panel. La historia nunca la ve. Cuesta una llamada al modelo.
2. **En el chat**: pulsa **Preguntar en la historia**, o escribe tú el disparador.

Puedes nombrar otra guía en la casilla **Guía**, si el bot lo permite.

### Qué pasa en un turno OOC

- Sin HUD, sin historia, y no pasa el tiempo.
- La extensión no añade nada a ese turno y no lee la respuesta como historia.
- Tu siguiente mensaje normal retoma la historia.

---

## 9. Memoria: qué recuerda qué

| Ayudante | Parte | Qué guarda | ¿Llega al modelo? |
| --- | --- | --- | --- |
| **Crónica** | Extensión | La línea temporal: momentos, hitos, vínculos, trama | Sí, a través del Memory Cortex |
| **Capítulos** | Extensión | Resúmenes de partes de la historia; loops en Re:Zero | Sí, como "la historia hasta ahora", una vez resumidos |
| **Banco de mapas** | Extensión | Cada sala dibujada, por mundo | Solo un plano corto de la sala cuando hace falta |
| **Memory Cortex** y **Chat Memory** | Lumiverse | Personas, lugares, vínculos entre ellos, pasajes antiguos | Sí, a través del bloque Memory del preset |
| **Loom Summary** | Lumiverse | Un resumen de la historia | Solo si activas su bloque en el preset |
| **Mentes** | Extensión | Sentimientos, rutinas, quién sabe qué, detalles sembrados | Sí, como el estado de las mentes antes de cada respuesta |

### La Crónica y el Memory Cortex

- Una respuesta se escribe en el Cortex solo después de que la contestes. Así un swipe nunca deja un recuerdo equivocado.
- Cada entrada se convierte en un hecho sobre las personas a las que se refiere, con una etiqueta de importancia.
- Elige cuánto se escribe: Ajustes → **Crónica** → Escribir en el Memory Cortex. **Momentos clave, vínculos, trama e hitos** es lo predeterminado.
- **Escribir ahora** escribe al momento. **Volver a escribirlo todo** es para después de reconstruir el Cortex. Nada se escribe dos veces.
- En Re:Zero, un loop deshecho por Return by Death se escribe como deshecho.

### Consejo

Usa los **Capítulos** o el **Loom Summary**, no ambos. Los dos enviarían un resumen de la misma historia.

---

## 10. Ajustes, sección por sección

Los Ajustes se abren como una lista de secciones. Haz clic en una para abrirla. Cada interruptor tiene una nota corta debajo.

| Sección | Qué contiene |
| --- | --- |
| **Estilo de juego** | Presets de mundo (un clic por bot), estilos de juego (HMS Narrativo, D&D, Escala de poder, Narrativa pura, Supervivencia dura, Social y romance), tus presets guardados, el tema del panel, la densidad y el tamaño del texto. |
| **Módulos** | Cada función en una lista. Apaga lo que no uses: sale del panel y del prompt, y no cuesta tokens. |
| **Motor HMS** | Modo HMS (automático, siempre, apagado), el bloque oculto, recuperar un bloque olvidado, la guardia de líneas perdidas, el recordatorio de los fijados. |
| **Sistemas HMS** | Cómo se lee el HUD: recursos y medidores, heridas y condiciones, habilidades y atributos, personas y sus barras, agenda, propiedades, equipo, finanzas, facciones, secretos y familia, el teléfono, el grupo, el reloj de supervivencia, heridas, experiencia. |
| **Mentes (de FrankenSIM)** | Sentimientos (los doce sentimientos o las barras clásicas), también entre los demás, el tamaño del paso, la velocidad a la que se enfrían, devolver el estado al modelo, rutinas, quién sabe qué, el arma de Chéjov, mapas de edificios, y los créditos. |
| **Misiones** | La tarjeta Misiones, los detalles de las misiones, la trama, los objetivos, el diario de misiones, etiquetas y estados de las misiones. |
| **Capítulos** | Capítulos automáticos por loops, arcos, días o meses; resúmenes; si van con cada mensaje y con los combates. |
| **Crónica** | Activada o apagada, pedir a la historia sus momentos clave y cuánto va al Memory Cortex. |
| **Contexto de lorebook** | Qué llamadas propias de la extensión reciben tus lorebooks, y qué envió la última llamada. |
| **Núcleo del motor y memoria** | Si los combates usan el motor del bot, y cuánta memoria a largo plazo recuperan. |
| **General** | El interruptor general, el idioma, Modo conjunto o separado, la conexión para las llamadas de la extensión y los tiempos límite. |
| **Paneles** | Qué paneles clásicos se muestran, y los colores de las barras. |
| **Extras del chat y del panel** | Estados internos bajo cada respuesta, el mapa y el banco de mapas, la tarjeta del HUD, emoji, colores y nombres en el diálogo, efectos de clima, retratos. |
| **Configuración de personajes** | Qué se pide de cada personaje en la escena: detalles, pensamientos, barras de personaje. |
| **Combates** | Dificultad, cómo se resuelven los combates inmersivos, dados del destino, efectos, movimientos, planes ocultos, la ventana antigua. |
| **D&D** | La tarjeta de D&D, el lanzador, las puntuaciones del HUD, los combates por turnos. |
| **Extras de la historia** | Extras del RPG Companion original: HTML inmersivo, color en los diálogos, etiquetas de engaño, el filtro de omnisciencia, elige tu propia aventura (apagado en chats HMS), sugerencias de canciones. |
| **Presets de campos del tracker** | Guarda y carga configuraciones completas del tracker, sobre todo para chats clásicos. Vincula una a un personaje. |
| **Prompts personalizados** | Cada prompt que envía la extensión, editable. Vacío usa el incorporado. |
| **Ayuda e informe de error** | **Abrir la guía**, y **Copiar informe de error** para Discord. Nada de texto del chat salvo que marques la casilla. |
| **Restablecer** | Borrar los trackers de este chat, o restablecer todos los ajustes. |

**¿Conjunto o separado?** Conjunto (lo predeterminado) recibe los datos del panel lateral en la misma respuesta: una llamada. Separado hace una segunda llamada tras cada respuesta. Usa Separado solo si tu modelo olvida a menudo el bloque oculto.

---

## 11. Cuando algo sale mal

| Problema | Qué hacer |
| --- | --- |
| La tarjeta World State está vacía. | Dice por qué. A menudo el modelo escribió el HUD dentro de su razonamiento. Pulsa **Volver a leer**. La extensión también saca por sí sola un HUD del razonamiento. |
| Una tarjeta no se actualizó. | Pulsa **Volver a leer**. Es gratis. |
| "La última respuesta omitió el bloque del panel lateral." | La extensión lo recupera con una segunda llamada rápida. Si pasa a menudo, usa el **Modo separado** (Ajustes → General). |
| Desapareció una línea del HUD. | Pulsa **Restaurar** en la tarjeta World State. Fija la línea si sigue pasando. |
| La respuesta no tiene HUD en absoluto. | Pulsa **Devolver el último HUD**, o haz swipe para una respuesta nueva. |
| El encabezado del HUD aparece dos veces. | La extensión deja uno por sí sola. Si sigue pasando, pon el control del encabezado del HUD del preset en **Never**. |
| "La línea de Arc no carga ninguna entrada de arco." | Pulsa **Usar** para poner la grafía del libro. |
| Una respuesta OOC volvió con HUD o historia. | Comprueba que el disparador esté justo al principio de tu mensaje, como `[OOC: ...]`. |
| No hay emoji ni colores de diálogo. | Empiezan apagados: Ajustes → Extras del chat y del panel → Diálogo. |
| La tarjeta Nueva partida no aparece. | Solo aparece en un chat nuevo cuyo primer mensaje tiene páginas de catálogo. |
| La tarjeta de D&D aparece en una partida sin dados. | Usa el preset de tu mundo, o apaga D&D en Ajustes → Módulos. |
| "Tu proveedor solo permite una petición a la vez." | Espera a que termine la respuesta y luego pulsa **Actualizar**, o **Volver a leer** (gratis). |
| Los pensamientos y resúmenes llegan en inglés. | Ajustes → General → activa **Pedir el texto del panel en este idioma**. |
| Alguien sabe algo que no podría saber. | Abre su tarjeta → Por dentro, sentimientos y lo que sabe → pulsa ✕ en el hecho. |
| Un detalle sembrado no encaja en la historia. | Tarjeta Misiones → Detalles sembrados → pulsa ✕. |
| Los sentimientos de alguien parecen equivocados. | Se mueven como mucho 2 por respuesta; dale unas respuestas a la historia. Si la relación en sí está mal, usa **Fijar el vínculo**. |
| Demasiados tokens. | Apaga partes de las Mentes en Ajustes → Módulos. |
| Falta un permiso. | Concédelo en el panel Extensions. La parte que lo necesita dice cuál. |
| Otra cosa. | Ajustes → **Ayuda e informe de error** → **Copiar informe de error**, y pégalo en el Discord. |

### Cuánto cuesta

- La petición del bloque oculto cuesta unos 1.000 a 1.700 tokens por respuesta, según lo que esté activado.
- Los módulos apagados no cuestan nada.
- Las Mentes añaden unos 1.000 tokens de instrucciones y 300 a 600 tokens de estado por respuesta. Apaga partes para ahorrar.
- Los combates, la guía OOC y los resúmenes de capítulo hacen cada uno su propia llamada cuando los usas.

---

## 12. Palabras usadas en esta guía

| Palabra | Significado |
| --- | --- |
| **HMS** | El motor de juego dentro de la tarjeta del bot. |
| **HUD** (WORLD STATE) | El bloque al principio de cada respuesta: hora, lugar, arco, poderes y más. |
| **El muro** | La línea `***` bajo el HUD. La historia empieza tras ella. |
| **STATE IS GOD** | La regla de los bots: el HUD es verdad, y la historia debe estar de acuerdo con él. |
| **Línea portadora** | Una línea del HUD cuyas palabras mantienen cargada una entrada de lorebook, como la línea Arc. |
| **Start handler** | La línea de inicio del bot, como `ReZero_Start_Handler`. Tu primer mensaje empieza con ella. |
| **Catálogo** | Las páginas del primer mensaje del bot: cómo empezar y todos los comandos. |
| **Canvas** | La página casi vacía del catálogo bajo la que escribes tu inicio. |
| **OOC** | Fuera del personaje: una pregunta a la guía del bot, fuera de la historia. |
| **Bloque oculto** | El pequeño dato `<rpg_companion>` tras la historia. La extensión lo lee y lo elimina. |
| **Fijar** | Mantener una línea del HUD exactamente igual. |
| **Guardia** | La comprobación de líneas del HUD que desaparecieron. |
| **Swipe** | Otra versión de una respuesta. La extensión sigue el swipe que conservas. |
| **Lorebook** | Las entradas del mundo del bot. Una palabra clave en el chat carga una entrada. |
| **Memory Cortex** | La memoria de Lumiverse sobre personas, lugares y sus vínculos. |
| **Preset** | La receta de prompt que Lumiverse envía al modelo. Aquí: HMS Reporter beta. |
| **Extensión** | Un complemento de Lumiverse. Aquí: RPG Companion HMS Edition. |
| **Conjunto / Separado** | Si los datos del panel lateral llegan en la misma respuesta o en una segunda llamada. |
| **Respuesta asentada** | Una respuesta que ya contestaste. Ya no se puede cambiar con un swipe. |
| **Mentes** | Cómo sienten, piensan y actúan las personas, de FrankenSIM. La extensión guarda los números. |
| **TFDY** | Ternura, Furia, Pavor, Anhelo: el ánimo de fondo de una persona, de 0 a 4. De Pyropia. |
| **Muestra (IW)** | Cuán cálida se muestra una persona por fuera. FrankenSIM lo llama Inner Weather. |
| **Los doce sentimientos** | Deseo, Juego, Amistad, Alianza, Pertenencia, Cuidado, y sus espejos Odio, Discordia, Enemistad, Estancado, Indiferencia, Envidia. |
| **Se asienta en** | Donde descansa un sentimiento. Se mueve despacio, cuando un sentimiento se empuja en la misma dirección una y otra vez. |
| **Muro** | Un sentimiento y su espejo altos a la vez. |
| **Puerta** | Cuánto se permite sentir una persona por alguien. |
| **Rutina** | Qué está haciendo una persona, dónde y hasta cuándo. |
| **El arma de Chéjov** | Un detalle que la historia sembró y que debería tener consecuencias después. |
