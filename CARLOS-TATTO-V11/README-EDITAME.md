# CARLOS TATTO — EXPERIENCE V11

**Práctica de Aplicaciones Web — tema: estudio de tatuajes.**  
**Funcionalidad extra A: modo oscuro con un botón.**

## Cómo abrirla

Desde la carpeta del proyecto:

```bash
python3 -m http.server 8000
```

Entra en `http://localhost:8000/` desde tu navegador. No necesitas instalar paquetes, ni Node ni React. Si se abre con doble clic, casi todo funciona, pero es mejor usar un servidor local para cargar las imágenes del montaje.

## Cómo funciona esta versión

La web se presenta como **CARLOS TATTO**. El montaje de la máquina dispone de **96 fotogramas WebP locales**, ensamblados a partir de una única composición para conservar el eje y las uniones. El scroll avanza hacia la máquina montada y permite retroceder para desmontarla. El montaje tiene sombras que desaparecen al acoplar cada parte. **Es una simulación visual con imágenes**, no un modelo CAD o WebGL físicamente exacto.

### Nuevo atelier: dibuja tu propio boceto

1. Entra en **ATELIER → DIBUJA TU IDEA**.
2. Dibuja sobre el lienzo con ratón, dedo o lápiz táctil. Puedes elegir **Lápiz/Goma**, grosor, **Deshacer**, **Rehacer** y **Limpiar**.
3. Pulsa **Guardar PNG** para descargar el boceto sin enviarlo a ningún servidor.
4. En **EXPLORA DISEÑOS** puedes volver a las tres ilustraciones (botánica, órbita, serpiente) y comparar boceto/tinta con el deslizador. Cuando vuelves al lienzo, tu dibujo anterior se conserva.
5. Al bajar a **TU IDEA**, el ticket de la izquierda muestra el dibujo si estás en modo libre; si usas el catálogo, muestra el diseño elegido.

### Ticket con fotos reales elegidas

En el formulario, selecciona hasta **5 imágenes JPG/PNG/WEBP** (máximo 6 MB por archivo). Verás miniaturas tanto bajo el selector como **dentro del ticket**. Al eliminar una referencia, desaparece de ambos sitios. El texto, el estilo y el número de referencias también se reflejan al momento.

**Importante:** esto es un proyecto exclusivamente frontend. El formulario **valida y simula la solicitud**, pero no envía datos a un estudio real ni guarda fotografías en un servidor. Los trazos del lienzo permanecen durante la sesión; guárdalos como PNG si quieres conservarlos.

## Archivos y dónde editar

```text
CARLOS-TATTO-V11/
├── index.html                # HTML semántico y textos
├── css/styles.css            # Diseño, variables, responsive y animaciones
├── js/script.js              # Modo oscuro, menú, máquina, galería, form, boceto
├── assets/img/machine/frames/# 96 fotogramas locales de la máquina
├── assets/img/atelier/       # Diseños SVG opcionales
├── assets/img/gallery/       # Imágenes de reserva
├── assets/img/hero/          # Imagen protagonista
├── bitacora.md               # Rellénala con tus palabras
├── VERSION.txt
└── README-EDITAME.md
```

Usa las etiquetas en los archivos:

| Quiero tocar | Busca exactamente |
|---|---|
| Frase del hero | `TODO-CARLOS-01` o `.hero-intro` |
| Nombre y navegación | `[01-HEADER]` en `index.html` |
| Cómo dibujar | `[V11-CARLOS-01]` a `[V11-CARLOS-05]` en `script.js` |
| Ticket con boceto/fotos | `[V11-CARLOS-06]` y `[V11-CARLOS-TICKET]` |
| Aspecto del lienzo y ticket | `[CARLOS-V11]` en la parte final de `styles.css` |
| Máquina | `[05-MÁQUINA]`, `[04] MÁQUINA`, `.machine-scroll` |
| Fotos del carrusel | `[06-GALERÍA]` y `coverflow-card` |
| Formulario y errores | `[07-FORMULARIO]`, `[08] FORMULARIO` |
| Modo oscuro (letra A) | `[01] TEMA`, `themeToggle`, `body.dark-mode` |
| Menú mostrar/ocultar | `[02] MENÚ`, `menuToggle` |
| Móvil y tablet | `@media` de `styles.css` |
| Frase final | `TODO-CARLOS-03`, `.footer-hook` |

### Lo que te dejo expresamente para hacer tú

- **TODO-CARLOS-01:** cambia la frase de portada sin modificar las etiquetas HTML.
- **TODO-CARLOS-02:** cambia al menos una imagen de galería y escribe un `alt` propio. Usa una foto autorizada.
- **TODO-CARLOS-03:** escribe una frase final corta, tuya.
- **TODO-CARLOS-04:** prueba un acento distinto cambiando `--accent` en `:root` y, si hace falta, en modo oscuro.
- **TODO-CARLOS-05:** modifica ligeramente `OPTIONS.galleryTilt` en el principio de `script.js`.
- **TODO-CARLOS-06:** personaliza el mensaje de éxito del formulario.
- **TODO-CARLOS-07:** cambia el texto de introducción del atelier.
- Escribe **tú mismo** comentarios explicativos sobre CSS y JS: las etiquetas de referencia no son la explicación personal que exige la profesora.
- Completa `bitacora.md` con problemas y cambios reales y realiza **3 commits auténticos** en GitHub.

## Checklist de la práctica

- HTML semántico: `header`, `nav`, `main`, varias `section`, `article`, `footer`, `form`, `label` y `dialog`.
- CSS y JS separados en carpetas; diseño responsive con `@media`; Flexbox/Grid.
- Formulario con nombre, email y mensaje, validación por JS y error escrito visible (sin `alert`).
- Menú móvil mostrar/ocultar; **A: modo oscuro con `classList.toggle`**.
- Accesibilidad: enfoque visible, botones etiquetados, no transmitir errores solo por color, `prefers-reduced-motion`. El modo libre es con puntero/tacto; para quienes solo usan teclado, hay diseños y controles alternativos.

## Qué no hace esta web

No se ha conectado un backend ni un envío de correo. Las fotografías de Pexels son referencias y no obras atribuidas a CARLOS TATTO; debes reemplazarlas por imágenes con derechos adecuados si publicas el proyecto. El visor de galería usa perspectiva CSS (como portadas de álbumes), no una reconstrucción 3D del cuerpo humano. La máquina usa una secuencia de montaje visual realista, **no un modelo 3D CAD**.
