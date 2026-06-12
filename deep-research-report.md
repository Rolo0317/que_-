# Planificación del proyecto **que_-**

Este documento describe las fases de desarrollo de un dashboard analítico para un *call center BPO*, usando React con Vite y Tailwind CSS en el frontend, y un backend en Node.js/Express. Se emplearán buenas prácticas de código (Clean Code, DRY, SOLID). La arquitectura propuesta incluye dos carpetas principales (`/frontend` y `/backend`) gestionadas en un solo repositorio (monorepo) para simplificar dependencias y CI/CD. Todo el sistema vivirá dentro de contenedores Docker (posiblemente orquestados con Docker Compose) para asegurar consistencia entre entornos.

## Fase 1: Preparación del entorno y repositorio

- **Estructura inicial:** Crear el repositorio con dos carpetas principales: `frontend/` y `backend/`. Cada una tendrá su propio `package.json`. Opcionalmente usar *npm workspaces* para gestionarlos juntos. Esto ofrece una *fuente única de la verdad*, instala dependencias con un solo comando y unifica el flujo de CI/CD.  
- **Versionamiento y ramas:** Inicializar Git en local y en GitHub. Definir ramas principales (`main` para producción, `develop` para integraciones) y convenciones de commits claras. Documentar estilos de código y reglas en el README.  
- **Buenas prácticas de código:** Establecer linters y formateo (p.ej. ESLint, Prettier) según Clean Code. Acordar la regla “no repetir código” (DRY) evitando duplicaciones innecesarias. Aplicar los principios SOLID para la arquitectura backend (responsabilidad única, extensibilidad, etc.) y componentes frontend mantenibles. Definir variables globales o de entorno para configuraciones (URLs de API, parámetros de estilos, etc.) de modo centralizado.  

## Fase 2: Configuración del Frontend

- **Proyecto con Vite y React:** Inicializar la app con Vite (`npm create vite@latest`) usando plantilla React. Instalar y configurar Tailwind CSS siguiendo la guía oficial. Esto incluye crear el `tailwind.config.js`, integrar los *@tailwind* directives, y ejecutar `npm install tailwindcss postcss autoprefixer`.  
- **Componentes y estilos:** Diseñar la interfaz con Tailwind CSS (menú lateral, cabecera, etc.). Usar componentes funcionales de React (Hooks) para mantener el código limpio y modular. Preparar componentes para **tarjetas de KPI** (indicadores) y **gráficos**. Se pueden usar bibliotecas de UI y gráficos compatibles con Tailwind, como Tremor (basado en Recharts) o directamente Recharts o Chart.js. Por ejemplo, **Recharts** es popular para dashboards React por su API simple, y `react-chartjs-2` facilita usar Chart.js con React.  
- **Carga y parseo de Excel:** Implementar un componente para cargar archivos Excel (`<input type="file" />`). Usar `xlsx` (SheetJS) en el cliente para leer el archivo y convertirlo a JSON. Por ejemplo, con `XLSX.read` y `sheet_to_json` se obtiene un arreglo de objetos JavaScript. Los datos resultantes se guardan en el estado de React (e.g. con `useState`) y alimentan los gráficos y tarjetas.  
- **Módulo “Arma tu informe”:** Diseñar una sección donde el usuario seleccione qué gráficas y métricas ver. Por ejemplo, checkboxes o dropdown para activar/desactivar cada gráfico. Esto se puede lograr manteniendo un estado con la lista de visualizaciones seleccionadas. Cada cambio en la selección activa/desactiva dinámicamente los componentes gráficos correspondientes.  

## Fase 3: Configuración del Backend

- **Servidor y API:** En la carpeta `backend/`, inicializar un proyecto Node.js con Express (u otro framework ligero). Este servicio REST proveerá datos a la app. Dependiendo de requisitos, puede exponer endpoints para cargar archivos o procesar datos. Por ejemplo, un endpoint `POST /api/upload` para recibir el Excel (usando `multer` o similar) y devolver los datos parseados.  
- **Arquitectura limpia:** Aplicar principios SOLID. Definir capas o módulos (rutas, controladores, servicios, modelos) para mantener bajo acoplamiento y permitir extensión. Cada archivo/clase debe tener responsabilidad única. Evitar repeticiones de lógica moviendo funciones comunes a utilerías o servicios compartidos (DRY).  
- **Base de datos (opcional):** Si es necesario guardar datos, configurar base de datos (por ejemplo PostgreSQL o MongoDB) en el contenedor de backend. Diseñar esquemas de datos según necesidades del call center (clientes, llamadas, métricas). Documentar en el README cómo inicializar y migrar la base de datos.  
- **Variables de entorno:** Definir variables globales (en un `.env` o similar) para puertos, URLs externos, credenciales, etc. Cargar estas variables en la aplicación (p. ej. con `dotenv`) y referenciarlas en el código. Esto permite cambiar configuración sin modificar el código fuente.  

## Fase 4: Contenedorización con Docker

- **Dockerfile multi-stage (frontend):** Crear un `Dockerfile` en `/frontend` que use un *build stage* con Node.js para compilar la app React (por ejemplo, multi-stage: Node para build y Nginx para servir estáticos). Ejemplo: copiar `package.json`, correr `npm ci`, copiar código y ejecutar `npm run build`, luego copiar el resultado `dist/` a un contenedor ligero (Nginx). Esto genera una imagen optimizada para producción.  
- **Dockerfile para backend:** Crear un `Dockerfile` en `/backend` basado en Node.js. Instalar dependencias (`npm ci`) y exponer el puerto de la API (p.ej. 3000). Incluir un comando CMD para iniciar el servidor (`npm start`).  
- **Docker Compose:** Configurar un `docker-compose.yml` en la raíz que levante ambos servicios (frontend y backend) juntos. Asignar nombres de servicio (`frontend`, `backend`), puertos mapeados (p.ej. `"3000:3000"` y `"80:80"`), y volúmenes para desarrollo (hot-reload si es deseado). Si se usa base de datos, agregar el contenedor correspondiente. Este setup permite iniciar todo el stack con `docker-compose up --build`.  
- **Vercel (despliegue frontend):** Aunque usamos Docker local, el frontend se puede desplegar en Vercel para revisión rápida. Vercel no ejecuta contenedores, sino que construye la app directamente. Podemos usar Docker para desarrollo local, pero para producción en Vercel basta con subir el código (sin imagen) y Vercel hará el build automáticamente. Documentar en el README el procedimiento de deploy (branch de GitHub vinculado a Vercel, variables de entorno en Vercel, etc.).  
- **Despliegue backend:** El backend Dockerizado se puede desplegar en un servicio de nube (DigitalOcean, AWS, etc.) o contenedores gestionados. En documentación, incluir instrucciones para construir la imagen (`docker build`) y ejecutar el contenedor. 

## Fase 5: Desarrollo de funcionalidades clave

- **Dashboard principal:** Integrar los componentes gráficos y de tarjetas en una vista central. Incluir filtros de fecha u otras variables según requisitos. Asegurarse de que la interfaz sea responsiva y accesible. Usar flexbox/grid con Tailwind para el layout.  
- **Indicadores en tarjetas:** Calcular métricas relevantes (p. ej. número total de llamadas inbound/outbound, tiempo medio de llamada, tasa de abandono). Mostrar cada métrica en una tarjeta destacada con etiqueta clara. Estos datos provendrán de los objetos JSON del Excel o de la API, dependiendo de dónde se procesen.  
- **Gráficos dinámicos:** Usar una librería de gráficos (como Recharts o Chart.js) para crear gráficas de barras, líneas, pastel, etc. por ejemplo, llamadas por hora, proporción inbound/outbound, calificaciones de llamadas, etc. Hacer que estos componentes sean reutilizables y configurables vía props. Aplicar *hooks* y estados locales para manejar los datos.  
- **Selección Inbound/Outbound:** Incluir en la UI un interruptor o dropdown que permita filtrar por **línea Inbound o Outbound**. Esta opción ajusta qué datos se muestran. En call centers, las llamadas inbound son entrantes de clientes (soporte, info) y las outbound son salientes de agentes para ventas o encuestas. Según la selección, el backend o frontend debe filtrar los datos JSON para mostrar solo las métricas del tipo correspondiente.  

## Fase 6: Pruebas y Documentación

- **Pruebas:** Implementar pruebas unitarias para lógica crítica (p.ej. procesamiento de datos) y tests de integración básicos. Por ejemplo, simular la carga de un archivo Excel de prueba y verificar que las gráficas muestran datos correctos. Las pruebas se ejecutarán antes de cada build (pueden documentarse en un workflow CI de GitHub).  
- **Revisión de código:** Organizar revisiones de pull requests entre los desarrolladores (aunque sea IA, recomendamos validaciones manuales periódicas). Usar linters para mantener Clean Code (nombres claros, funciones cortas, comentarios donde sea necesario). Evitar código duplicado identificando patrones repetidos (DRY).  
- **Documentación:** Redactar un `README.md` detallado en la raíz. Debe contener:
  - Descripción del proyecto y su propósito.
  - Guía de instalación paso a paso (clonar repos, instalar dependencias).
  - Instrucciones para correr en Docker (`docker-compose up`).
  - Instrucciones para despliegue en Vercel (frontend) y en servidor (backend).
  - Explicación de la estructura de carpetas y principales scripts.
  - Breve descripción de las tecnologías usadas y por qué (citar buenas prácticas).
  - **planning.md**: este documento con fases y metas.  
  Incluir comentarios en el código fuente sólo en partes complejas; no usar emojis.  

## Entregables por fase

1. **Fase 1:** Repositorios iniciales con estructura de carpetas y configuraciones de linters. Documento de planificación (`planning.md`) y README inicial.
2. **Fase 2:** App React básica corriendo con Vite+Tailwind. Componente de carga de Excel funcionando.
3. **Fase 3:** API en Node.js corriendo, capaz de recibir datos (p.ej. endpoint `/api/data` que retorna el JSON procesado).
4. **Fase 4:** Archivos Dockerfile y docker-compose validados (imagen de front y back levantan correctamente). Frontend desplegable en Vercel.
5. **Fase 5:** Interfaz completa con tarjetas e indicadores, gráficas funcionales y filtro inbound/outbound.
6. **Fase 6:** Pruebas unitarias, CI configurado (p.ej. GitHub Actions), documentación finalizada en README y `planning.md`. 

Cada fase debe finalizar con un commit y, opcionalmente, un release o tag. De esta forma el proceso es incremental y facilita la revisión y despliegue continuo. 

**Referencias:** Se han consultado fuentes sobre React/Vite/Tailwind y Docker, mejores prácticas de código, visualización de datos en React, y conceptos de call center inbound/outbound para fundamentar este plan.

