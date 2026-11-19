# Checklist de Caelestia POS

Guía de avance basada únicamente en [Caelestia POS - Documentación](Documentacio%CC%81n%20y%20contexto/Caelestia%20POS%20-%20Documentacio%CC%81n.md). Marca una casilla solo cuando la función esté implementada y verificada en el alcance indicado; tener un endpoint no significa que el flujo móvil esté terminado.

**Estados:** `[x]` terminado y verificado · `[ ]` pendiente · **Parcial** = existe una parte, falta completar o probar el flujo.

## Resumen

- [x] Estructura separada: aplicación móvil en `mobile/` y backend en `api/`.
- [x] Inicio/cierre de sesión y lectura del rol validado por la API para mostrar administración solo al administrador.
- [ ] Completar la aplicación móvil definida en el documento. Catálogo, administración y flujos de venta están implementados; faltan historial, dashboard, asesor e imagen adjunta.
- [ ] Completar e integrar historial, dashboard, asesor e imagen adjunta a modelos.
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

- [ ] **RF-15** Crear en la app el formulario de presupuesto y descripción de necesidades.
- [ ] **RF-15** Permitir requisitos técnicos opcionales: software, resolución, RAM, almacenamiento y GPU.
- [ ] **RF-16, RF-17** Implementar en backend la consulta de modelos existentes con unidades disponibles y dentro del presupuesto.
- [ ] **RF-17** Integrar DeepSeek únicamente cuando el usuario solicite una recomendación.
- [ ] **RF-17** Validar la respuesta contra catálogo, disponibilidad, presupuesto y requisitos obligatorios.
- [ ] **RF-16** Mostrar hasta tres opciones con coincidencias y limitaciones, sin inventar precios ni especificaciones.
- [ ] **RF-17** Implementar alternativa por reglas o mensaje de información insuficiente cuando DeepSeek no responda o no haya candidatos.
- [ ] **RNF-11** Confirmar que no se envíen números de serie ni datos personales al asesor.

## Semana 5 — Dashboard, pruebas e integración

- [ ] **RF-14** Implementar el dashboard administrativo con ventas acumuladas completadas, unidades vendidas, unidades disponibles y modelos registrados.
- [ ] **RF-20** Permitir abrir el historial o listado relacionado desde cada métrica del dashboard.
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
- [ ] **RNF-11** Verificar que DeepSeek solo se invoque a petición y no reciba números de serie ni datos personales.
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

## Próximo paso

Continuar con RF-14: dashboard administrativo y navegación desde métricas a los listados relacionados. Mantener las pruebas manuales de todos los flujos para el cierre final.
