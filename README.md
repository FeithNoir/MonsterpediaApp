# Monsterpedia

Una enciclopedia de criaturas fantásticas presentada como un cuaderno de historia innatural: una lámina, una ficha y las notas de un naturalista. Desarrollada por **Feith Noir**. [Licencia MIT](LICENSE).

## Qué funciona en esta rama

- Lectura pública en `/article/:id`, índice con búsqueda enlazable (`?q=`) y una criatura del día estable por fecha UTC.
- Cuenta con correo/contraseña, recuperación de acceso, verificación de correo y nombre público editable.
- Personas verificadas crean fichas y editan las propias; administración puede editar cualquier ficha y eliminar. La lectura no requiere cuenta.
- Láminas reales en Storage (JPG, PNG, WebP o GIF; **5 MiB** por archivo, **4 láminas** por ficha).
- Revisiones inmutables de cada edición y detección de conflictos. Las cinco revisiones más recientes se pueden leer en la ficha.
- Un solo menú adaptable, pergamino claro y fuentes locales; sin barra lateral permanente ni tarjetas aleatorias duplicadas.

La aprobación editorial y la gestión de cuentas **no están implementadas**. `editors/{uid}` es una etiqueta opcional de rol, no permiso para modificar fichas ajenas.

## Desarrollo

Requisitos: **Node 24.12 o posterior de la línea 24**, npm y **Java 21** para los emuladores.

```bash
npm ci
npm start
npm run build
npm test
```

Angular **21.2**, AngularFire **21.0** y Firebase JS **12.19**. AngularFire 21 declara Angular 21 y depende de Firebase 12; no se fuerza una combinación Angular 22/Firebase 13 sin soporte publicado. PrimeNG, Tailwind y las bibliotecas visuales duplicadas ya no son necesarias.

Los archivos `environment.ts` y `environment.development.ts` incluyen la configuración **pública del cliente** de `mosterpedia`. No contienen una cuenta de servicio. Las reglas son el control de acceso, no esconder la API key. Nunca subas claves privadas, tokens ni credenciales administrativas.

### Verificación local, sin tocar producción

```bash
npm run test:rules
npx playwright install --with-deps chromium
npm run test:e2e
```

Los scripts usan `firebase emulators:exec --project mosterpedia` con puertos Auth **9099**, Firestore **8080** y Storage **9199**. Playwright compila exclusivamente `--configuration emulator`, ejecuta Chromium aislado a **1440×1050** y **390×844**, y crea sus cuentas y fichas ficticias solo en los emuladores. Ese servidor está en `http://127.0.0.1:4302`. Ningún parámetro de URL puede activar emuladores en el build de producción.

Para explorar a mano, inicia en terminales separadas:

```bash
npx firebase emulators:start --project mosterpedia --only auth,firestore,storage
npm start -- --configuration emulator --host 127.0.0.1 --port 4302
```

CI (`.github/workflows/ci.yml`) construye y ejecuta pruebas unitarias, reglas y flujos de navegador. **No despliega**.

## Seguridad y datos

- `admins/{uid}` y `editors/{uid}` solo se gestionan desde una herramienta administrativa de confianza. Ningún cliente, ni siquiera uno administrador, puede escribir esos documentos.
- Las entradas públicas contienen `authorId` y `displayName`, **nunca un objeto de usuario ni un correo de autor**. No escribas datos personales dentro del texto libre.
- El esquema limita los textos, las listas (**5 cadenas de 80 caracteres** por lista), las imágenes y la amenaza (**entero de 0 a 10**).
- Creación y edición requieren correo verificado. Autoría y fecha de creación no cambian. Cada edición debe guardar la versión anterior en la misma transacción.
- Storage solo permite escribir al dueño verificado bajo `users/{uid}/entries/{entryId}/{fileId}`; las imágenes son públicas. Se valida MIME y tamaño; el análisis antivirus/contenido no está implementado.
- Eliminar una ficha retira su lectura pública y la del historial, pero no borra físicamente subcolecciones ni objetos de Storage. La limpieza administrativa de huérfanos queda pendiente.

Las reglas son un **prototipo probado**, no una garantía absoluta de seguridad. Revisa `firestore.rules`, `storage.rules` y la matriz de ataques antes de abrir la aplicación a un público amplio.

### Antes de cualquier despliegue: migrar la autoría antigua

**La implementación no se ha desplegado ni ha ejecutado esta migración.** Las reglas que estaban en vivo permitían editar y borrar fichas ajenas. Las entradas antiguas podrían contener correos públicamente legibles. No publiques el nuevo catálogo sobre documentos sin revisar.

1. Obtén un respaldo administrativo y trabaja en una ventana sin ediciones concurrentes.
2. En un equipo confiable con **Application Default Credentials** del Admin SDK (el login de Firebase CLI no las sustituye), revisa primero:

   ```bash
   node scripts/migrate-author-privacy.mjs --project mosterpedia
   ```

3. El modo predeterminado **no escribe**. Revisa cada aviso de intervención manual: UID o fecha ausentes, listas demasiado largas o imágenes antiguas que necesitan subirse a Storage. No se imprimen valores privados.
4. Solo después del respaldo y la aprobación, aplica y vuelve a revisar:

   ```bash
   node scripts/migrate-author-privacy.mjs --project mosterpedia --apply
   node scripts/migrate-author-privacy.mjs --project mosterpedia
   ```

El script reemplaza el documento con un esquema permitido, elimina el usuario/correo incrustado, revisa snapshots del historial y conserva contenido válido. Usa una transacción y comprueba la fecha de la lectura para no pisar una edición concurrente. Es idempotente: la segunda revisión debe informar cero cambios y cero intervenciones pendientes. No publiques si queda algún documento sin migrar; revisa también el texto libre manualmente para evitar datos personales.

### Paso manual: habilitar la administración de Hugo

En **Firebase Console → proyecto `mosterpedia` → Authentication**, copia el **UID** de la cuenta de Hugo (no su correo). En Firestore `(default)`, crea el documento:

```text
admins/{HugoUid}
  enabled: true
```

Su existencia concede el rol; `enabled` es informativo, no un interruptor. Para revocarlo, elimina el documento con una herramienta administrativa y vuelve a iniciar sesión para actualizar la interfaz. El correo debe estar verificado. No se usan custom claims. Para crear `editors/{uid}`, aplica el mismo procedimiento; no otorga edición sobre autoría ajena.

### Comandos exactos de despliegue, SOLO después de revisión y merge

Verifica primero el proveedor Email/Password y el dominio de Auth autorizado, la base STANDARD `(default)` existente y la disponibilidad real del bucket `mosterpedia.firebasestorage.app`. La configuración del SDK por sí sola no prueba que Storage esté provisionado. Restringe la API key para los servicios y dominios que correspondan sin romper Auth.

```bash
npm ci
npm test
npm run test:rules
npm run build
npx firebase deploy --project mosterpedia --only firestore:rules,firestore:indexes,storage
npx firebase deploy --project mosterpedia --only hosting
```

`.firebaserc` apunta a **mosterpedia**, con esa escritura exacta. Hosting publica `dist/monsterpedia-app/browser` y reescribe las rutas de la SPA a `index.html`. Los antiguos enlaces `/#/ruta` se convierten a rutas limpias al arrancar. No se ha hecho ningún deploy, merge ni escritura de datos de producción durante esta implementación.

## Documentación y evidencia

- [Plan y estado de las fases](docs/files/improvement-plan.md)
- [Arquitectura actual](docs/files/architecture.md)
- [Diseño y decisiones](docs/files/design.md)
- [Verificación y límites conocidos](docs/files/verification.md)
- [Auditoría original](docs/files/audit.md) — evidencia anterior a los cambios
- [Capturas](docs/screenshots) — las nuevas empiezan por `after-`

Pendientes: aprobación de publicaciones, paginación/búsqueda remota, SSR para vistas previas sociales, favoritos, comentarios moderados, i18n, modo oscuro y exportación PDF. El aviso de bundle inicial de 500 kB sigue visible; no se elevó el presupuesto para ocultarlo. Las dependencias administrativas/CLI conservan avisos moderados que se detallan en la verificación.
