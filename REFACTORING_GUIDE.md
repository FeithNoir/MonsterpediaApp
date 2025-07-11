### **Guía de Refactorización de Componentes**

El objetivo es alinear el componente con el sistema de diseño establecido, usando `styles.css` para los colores y animaciones base, y TailwindCSS para la estructura y responsividad.

**1. Análisis y Limpieza del HTML del Componente (`*.component.html`)**

*   **Eliminar Estilos "Hardcodeados":** Quitar cualquier clase de Tailwind que defina colores explícitamente (ej. `bg-[#A1887F]`, `text-white`, `border-[#5D4037]`).
*   **Eliminar Clases de Animación de Tailwind:** Quitar clases de transición y duración (ej. `transition`, `duration-200`). La animación base se gestionará en `styles.css`.
*   **Eliminar Clases CSS Personalizadas Antiguas:** Borrar cualquier clase que no pertenezca al nuevo sistema de diseño (ej. `font-title-main`, `content-wrapper`).

**2. Aplicación del Sistema de Diseño (Clases de `styles.css`)**

*   **Usar Clases de Utilidad Globales:** Reemplazar los estilos eliminados con las clases predefinidas en `styles.css`.
    *   Para fondos: `.bg-primary`, `.bg-secondary`, `.bg-surface`.
    *   Para texto: `.text-main`, `.text-muted`, `.text-on-primary`.
    *   Para bordes: `.border-primary`, `.border-secondary`.
*   **Aplicar Estilos de Enlace Correctos:**
    *   Usar `.link-primary` para enlaces sobre fondos claros.
    *   Usar `.link-on-primary` para enlaces sobre fondos oscuros (como en el header).

**3. Implementación de Layout y Responsividad (Clases de TailwindCSS)**

*   **Estructura con Flexbox/Grid:** Utilizar las clases de Tailwind para organizar el layout (ej. `flex`, `justify-between`, `items-center`, `grid`).
*   **Diseño Responsive:**
    *   Usar los prefijos de Tailwind (`sm:`, `md:`, `lg:`) para adaptar el diseño a diferentes tamaños de pantalla.
    *   Para la navegación, ocultar los enlaces en móvil (`hidden`) y mostrarlos a partir de un breakpoint (`md:flex`).
*   **Menú Móvil (si es necesario):**
    *   **HTML:** Añadir un botón de hamburguesa (`<button>`) visible solo en móviles (`md:hidden`) y un contenedor para el menú que se mostrará/ocultará.
    *   **TypeScript (`*.component.ts`):** Añadir una propiedad booleana (ej. `isMenuOpen = false`) y un método para cambiar su estado (ej. `toggleMenu()`).
    *   **Conexión:** Vincular la visibilidad del menú en el HTML a la propiedad del `ts` usando `[class.hidden]="!isMenuOpen"`.

**4. Estilos Específicos del Componente (`*.component.css`)**

*   **Encapsular Estilos Únicos:** Si el componente necesita un estilo visual que no será reutilizado en ningún otro lugar (como el efecto de hover que ocupa toda la altura del header), crearlo en su propio archivo CSS.
*   **Crear Clases Específicas:** Definir una clase con un nombre claro (ej. `.nav-link`) y aplicar en ella los estilos necesarios.
*   **Aplicar la Clase en el HTML:** Añadir la nueva clase a los elementos correspondientes en el archivo `.html`.
