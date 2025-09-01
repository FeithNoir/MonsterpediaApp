# Estructura del Proyecto

Este documento describe la estructura del proyecto MonsterpediaApp.

## Directorio Raíz

- **.angular/**: Contiene archivos en caché que la CLI de Angular utiliza para mejorar el rendimiento de la compilación.
- **.git/**: Contiene el historial y la configuración del control de versiones de Git.
- **.vscode/**: Contiene la configuración específica del proyecto para Visual Studio Code, como las extensiones recomendadas, las configuraciones de inicio para la depuración y otras opciones del editor.
- **node_modules/**: Almacena todas las bibliotecas y dependencias de terceros necesarias para la ejecución del proyecto. Este directorio es administrado por npm o yarn.
- **public/**: Contiene recursos estáticos de acceso público, como `favicon.ico` e imágenes como `lamia.jpg`.
- **src/**: Aquí reside el código fuente principal de la aplicación.

## Archivos Raíz

- **.editorconfig**: Garantiza la coherencia de los estilos de codificación en diferentes editores e IDE. - **.gitignore**: Especifica qué archivos y directorios Git debe ignorar.
- **.postcssrc.json**: Archivo de configuración para PostCSS, una herramienta para transformar CSS con plugins de JavaScript.
- **angular.json**: El archivo de configuración principal de la CLI de Angular. Define la configuración del proyecto, las configuraciones de compilación y más.
- **LICENSE**: Contiene la información de la licencia del proyecto.
- **package-lock.json**: Registra las versiones exactas de las dependencias del proyecto, lo que garantiza que se pueda replicar el mismo entorno.
- **package.json**: Enumera las dependencias del proyecto, los scripts para ejecutar tareas (como compilación o pruebas) y otros metadatos.
- **README.md**: La documentación principal del proyecto, que ofrece una descripción general e instrucciones.
- **REFACTORING_GUIDE.md**: Una guía con instrucciones y buenas prácticas para refactorizar el código base. - **tsconfig.app.json**: Configuración de TypeScript específica para el código de la aplicación.
- **tsconfig.json**: Configuración base de TypeScript para el proyecto.
- **tsconfig.spec.json**: Configuración de TypeScript para los archivos de prueba.

## Directorio `src`

- **index.html**: El archivo HTML principal que se entrega al usuario. La aplicación Angular se inicia en este archivo.
- **main.ts**: El punto de entrada de la aplicación. Compila la aplicación y arranca el módulo raíz.
- **styles.css**: Hoja de estilos global para la aplicación.

## Directorio `app`

Este directorio contiene el núcleo de la aplicación Angular, incluyendo todos los componentes, servicios y configuración de enrutamiento.

- **app.component.ts**: El componente raíz de la aplicación.
- **app.config.ts**: Contiene la configuración de la aplicación, como proveedores y otros ajustes. - **app.routes.ts**: Define las rutas principales de la aplicación.

#### Subdirectorios

- **auth/**: Contiene componentes relacionados con la autenticación de usuarios, como el inicio de sesión y el restablecimiento de contraseña.
- **core/**: Contiene la lógica principal de la aplicación, incluyendo guardias, interceptores, interfaces y servicios.
- **guards/**: Contiene guardias de ruta para proteger las rutas del acceso no autorizado.
- **interceptors/**: Contiene interceptores HTTP para modificar solicitudes y respuestas.
- **interfaces/**: Define las estructuras de datos utilizadas en toda la aplicación.
- **services/**: Contiene los servicios de la aplicación, que gestionan la lógica de negocio y la obtención de datos.
- **pages/**: Contiene las diferentes páginas de la aplicación, como la página de inicio y los detalles de la entrada.
- **entry/**: Componente para mostrar una única entrada de Monster.
- **home/**: La página principal de la aplicación, que incluye un tablón de anuncios y artículos de Monster. - **layout/**: Componente que define el diseño general de la aplicación.
- **shared/**: Contiene componentes compartidos que se utilizan en varias partes de la aplicación, como las secciones de encabezado y hero.

### Directorio `environments`

- **environment.template.ts**: Una plantilla para crear archivos de configuración específicos del entorno (por ejemplo, para desarrollo y producción).
