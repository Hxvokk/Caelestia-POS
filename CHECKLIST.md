# Checklist de Caelestia POS

Guía de avance basada únicamente en [Caelestia POS - Documentación](Documentacio%CC%81n%20y%20contexto/Caelestia%20POS%20-%20Documentacio%CC%81n.md). Marca una casilla solo cuando la función esté implementada y verificada en el alcance indicado; tener un endpoint no significa que el flujo móvil esté terminado.

**Estados:** `[x]` terminado y verificado · `[ ]` pendiente · **Parcial** = existe una parte, falta completar o probar el flujo.

## Resumen

- [x] Estructura separada: aplicación móvil en `mobile/` y backend en `api/`.
- [x] Inicio/cierre de sesión y lectura del rol validado por la API para mostrar administración solo al administrador.
- [ ] Completar la aplicación móvil definida en el documento. Catálogo, administración, ventas, historial, dashboard y asesor están implementados; falta adjuntar imágenes y realizar la ronda final de pruebas manuales.
- [ ] Completar la integración de imagen adjunta y la verificación final de todos los flujos.
- [ ] Probar la aplicación en Android conectada a la API local y a Supabase.

## Semana 1 — Definición y planeación

- [x] Definir objetivos, alcance, roles, requerimientos y casos de uso.
- [x] Definir arquitectura móvil, backend y base de datos.
- [x] Preparar wireframes de los flujos principales.

## Semana 2 — Acceso e inventario

### Acceso y cuentas

- [x] **RF-01** Iniciar y cerrar sesión con correo y contraseña mediante Supabase Auth en la app.
- [x] Guardar y restaurar la sesión móvil con almacenamiento seguro.
- [x] **RF-02** Validar en el backend el JWT, el perfil activo y el rol del usuario.
- [x] Crear/verificar en Supabase las cuentas iniciales de administrador y vendedor con sus perfiles activos; el administrador inicial se aprovisiona manualmente.
- [x] Aplicar navegación y opciones de inventario distintas según el rol; la API vuelve a verificar permisos.
- [x] **RF-18** Permitir al administrador listar y crear vendedores, y activar/desactivar sus cuentas sin borrar su historial.
- [x] **RF-19** Permitir al usuario cambiar voluntariamente su contraseña desde Mi perfil mediante Supabase Auth.
- [x] Configurar `Supabase:ServiceRoleKey` en User Secrets y probar la creación/activación de vendedores en el proyecto Supabase.
- [x] Probar el cambio de contraseña desde la app con una cuenta Supabase real.

### Marcas, modelos y unidades

- [x] **RF-03** Consultar y administrar marcas desde móvil; la API impide eliminarlas cuando tienen modelos asociados.
- [x] **RF-04** Consultar, crear, modificar y eliminar modelos desde móvil; la API impide borrar modelos con unidades.
- [x] **RF-05** Registrar unidades desde móvil con un número de serie único validado por la API.
- [x] **RF-06** Modificar y eliminar unidades disponibles desde móvil; la API protege unidades vendidas o con historial.
- [x] **RF-07** Mostrar catálogo, detalle, búsqueda y números de serie disponibles, incluidos modelos sin unidades disponibles.
- [x] **RF-07** Filtrar por marca, precio, procesador/chip, memoria mínima y disponibilidad.
- [x] **RF-03–RF-06** Proporcionar pantallas móviles de administración para marcas, modelos y unidades; los permisos se validan también en backend.
- [ ] **RF-21** Permitir adjuntar un archivo de imagen del dispositivo al crear o editar un modelo.
- [x] Probar en Android catálogo, administración de inventario/vendedores y perfil, conectados a Supabase y la API con registros reales mediante Expo Go.
- [ ] Verificar en móvil que los datos opcionales no publicados o no aplicables queden sin especificar y no se inventen.
- [x] Probar con modelos y números de serie reales y verificados; no usar unidades ficticias.

## Semana 3 — Ventas, pagos e historial

- [x] **RF-09, RF-12** Calcular en backend el total a partir de las unidades y precios registrados; registrar ventas aprobadas, detalles, pago e inventario de forma transaccional.
- [x] **RF-10** Calcular en backend el cambio para pagos en efectivo.
- **Parcial** — **RF-11** El backend y la app ya admiten escenarios aprobados/rechazados para débito y crédito sin datos bancarios; falta verificar el flujo completo en Expo Go.
- **Parcial** — **RF-12** Las ventas aprobadas se persisten transaccionalmente y el rechazo del backend no escribe datos; falta verificar rechazo e inventario sin cambios desde la app.
- **Parcial** — **RF-08** La API y el carrito móvil admiten varias unidades; falta verificar agregar/quitar unidades y completar el recorrido en Expo Go.
- [ ] **RF-08** Verificar en Expo Go el carrito móvil para agregar y quitar una o varias unidades disponibles.
- [ ] **RF-10** Verificar en Expo Go el pago en efectivo y la captura del monto recibido.
- [ ] **RF-11** Verificar en Expo Go la selección de aprobación/rechazo para débito y crédito, sin solicitar datos bancarios.
- [x] **RF-11** Implementar en backend el escenario de tarjeta rechazada y asegurar que no cree venta, pago ni cambie inventario.
- [ ] **RF-12** Verificar en Expo Go el resultado de venta aprobada o pago rechazado.
- **Parcial** — **RF-13** API de historial/detalle e interfaz móvil implementadas; pruebas de rol, compilación y análisis estático aprobados. Falta la prueba manual final en Expo Go.
- [ ] **RF-13** Verificar en Expo Go historial y detalle: administrador ve todas las ventas; vendedor solo las propias.
- [ ] **RF-12, RF-13** Verificar que pagos rechazados no aparezcan en el historial ni cambien inventario.

## Semana 4 — Asesor de laptops

- **Parcial** — **RF-15** Formulario móvil de presupuesto y necesidades implementado; falta verificación manual final.
- **Parcial** — **RF-15** Requisitos opcionales de software, resolución, RAM, almacenamiento y GPU disponibles; los requisitos almacenados se validan y las especificaciones no registradas se señalan como limitaciones.
- **Parcial** — **RF-16, RF-17** El backend consulta únicamente modelos existentes con unidades disponibles y dentro del presupuesto; falta validar resultados con el entorno real.
- **Parcial** — **RF-17** DeepSeek se configura solo en el backend y solo se invoca al solicitar recomendaciones; falta prueba manual final con una clave configurada.
- **Parcial** — **RF-17** Los IDs se restringen a candidatos elegibles por presupuesto, disponibilidad y requisitos estructurados; falta validar el flujo completo.
- **Parcial** — **RF-16** Se presentan hasta tres modelos con datos del catálogo, coincidencias y limitaciones; falta revisión manual final.
- **Parcial** — **RF-17** Si DeepSeek no está configurado, falla o no produce opciones válidas, se usa un ordenamiento local; sin candidatos se informa que no hay resultados.
- **Parcial** — **RNF-11** No se envían identificadores de usuario ni números de serie; se redactan correos y teléfonos de los campos de texto antes del envío. Falta revisión manual de los datos enviados.

## Semana 5 — Dashboard, pruebas e integración

- **Parcial** — **RF-14** Dashboard administrativo implementado con las cuatro métricas y endpoint protegido; falta verificación manual final en Expo Go y revisar valores con datos del entorno.
- **Parcial** — **RF-20** Cada métrica navega al historial, unidades filtradas o lista de modelos; falta verificación manual final en Expo Go.
- [ ] Completar pruebas de API, reglas de negocio y permisos por rol.
- [ ] Verificar en Android los flujos completos de administrador y vendedor.
- [ ] Confirmar manejo controlado de errores de API, Supabase y DeepSeek.
- [ ] Preparar evidencias de ejecución y pruebas para la demostración final.

## Requisitos no funcionales y cierre

- **Parcial** — **RNF-05** La API organiza controllers, services y repositories para inventario; falta aplicar/verificar la estructura en los módulos restantes.
- **Parcial** — **RNF-04, RNF-08** La app tiene formularios validados, estados de carga y mensajes de error en los flujos existentes; falta cubrir las pantallas aún pendientes.
- [x] **RNF-03** Las contraseñas se gestionan con Supabase Auth y no se guardan en las tablas comerciales.
- [x] La API se ejecuta localmente durante el desarrollo; no desplegarla públicamente en esta etapa.
- [ ] **RNF-01** Medir tiempos de respuesta con hasta 500 unidades y comprobar el objetivo menor a tres segundos.
- [x] **RNF-02** Mantener la API local para esta etapa; si se prepara una demostración desplegada, exigir HTTPS.
- [ ] **RNF-06** Verificar con pruebas que la venta sea atómica y que una unidad no pueda venderse dos veces.
- [ ] **RNF-07** Confirmar que las credenciales de Supabase y DeepSeek no estén en el código móvil ni en el repositorio.
- [x] **RNF-09** Probar la aplicación en un dispositivo Android compatible con la versión de Expo utilizada.
- [ ] **RNF-10** Verificar que el asesor solo recomiende modelos elegibles y no invente precios ni especificaciones.
- **Parcial** — **RNF-11** Pruebas automatizadas verifican invocación bajo demanda y ausencia de números de serie en el payload; falta la verificación manual final de datos transmitidos.
- [ ] **RNF-12** Verificar que ninguna pantalla de pago solicite datos bancarios reales.
- [ ] Ejecutar y registrar las pruebas finales de backend y frontend después de completar cada módulo.

## Verificación técnica más reciente

Comprobaciones ejecutadas el 19-11-2026:

- [x] `npm run typecheck` y `npm run lint` en `mobile/`.
- [x] `dotnet test CaelestiaPOS.sln` — 40 pruebas aprobadas.
- [x] `python3 -m unittest discover -s tests` — 2 pruebas aprobadas.
- [x] `npx expo-doctor` — 20/20 comprobaciones.
- [x] `npx expo export --platform android`.
- [x] Prueba integrada en dispositivo Android mediante Expo Go: sesión de administrador, catálogo, gestión de vendedores, marcas, modelos y unidades, creación/activación de vendedor, cambio de contraseña y persistencia de sesión. Verificada el 19-11-2026.
- [x] Historial RF-13: `dotnet test CaelestiaPOS.sln` — 42 pruebas aprobadas; `npm run typecheck`, `npm run lint` y `npx expo export --platform android` aprobados. La advertencia restante de lint es solo para `.expo/types/router.d.ts`.
- [x] Asesor RF-15–RF-17: `dotnet test CaelestiaPOS.sln` — 47 pruebas aprobadas; `npm run typecheck`, `npm run lint` y `npx expo export --platform android` aprobados. La advertencia restante de lint es solo para `.expo/types/router.d.ts`.

## Próximo paso

Continuar con RF-21: permitir seleccionar y adjuntar una imagen al crear o editar un modelo. Mantener las pruebas manuales de todos los flujos para el cierre final.
