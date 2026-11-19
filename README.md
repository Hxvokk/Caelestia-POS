# Caelestia POS

Aplicación móvil de punto de venta para una tienda de computadoras portátiles. El backend se ejecuta localmente y se conecta a PostgreSQL en Supabase.

El [checklist de avance](CHECKLIST.md) resume las funciones implementadas y las tareas pendientes según el documento de planeación.

## Backend

Requisitos: .NET SDK 11.

### Configurar Supabase

1. En el panel de Supabase, abrir **Connect** y copiar los datos de **Session pooler**. Este endpoint funciona sobre IPv4; utilizar el host y el usuario indicados para el proyecto.
2. Desde el directorio `api`, guardar la cadena de conexión localmente con .NET User Secrets:

   ```sh
   dotnet user-secrets set "ConnectionStrings:Caelestia" "Host=HOST_DEL_POOLER;Port=5432;Database=postgres;Username=USUARIO_DEL_POOLER;Password=TU_PASSWORD;SSL Mode=Require"
   ```

   Sustituir los valores de ejemplo por los datos proporcionados por Supabase. No compartir la contraseña ni almacenarla en archivos versionados.
3. Guardar la URL pública del proyecto para validar los tokens de acceso de Supabase:

   ```sh
   dotnet user-secrets set "Supabase:Url" "https://PROJECT_REF.supabase.co"
   ```

   Sustituir `PROJECT_REF` por el identificador del proyecto. La API verifica la firma del JWT mediante OpenID Connect/JWKS y consulta `usuarios` para comprobar que el perfil esté activo y obtener su rol.
4. Para habilitar la administración de vendedores, guardar una clave secreta de servidor en User Secrets:

   ```sh
   dotnet user-secrets set "Supabase:ServiceRoleKey" "TU_SECRET_KEY_DE_SUPABASE"
   ```

   La clave secreta o `service_role` debe utilizarse únicamente en el backend. No incluirla en `mobile/`, `.env.local`, el código fuente ni Git. Sin esta configuración, los endpoints administrativos de usuarios responden `503`.

5. Para adjuntar imágenes a modelos, crear en **Storage** un bucket público llamado `catalog-images`. El backend lo usa para guardar imágenes JPEG, PNG o WebP de hasta 5 MB. La clave `Supabase:ServiceRoleKey` se utiliza solo desde el backend; no incluirla en la app móvil. La carga requiere que la URL del proyecto y la clave de servicio estén configuradas.

### Ejecutar y comprobar

Desde la raíz del repositorio:

```sh
dotnet run --project api/Api.csproj
```

Abrir la dirección local que aparece en la terminal y añadir `/swagger`. Desde Swagger:

- `GET /health` comprueba que la API está activa.
- `GET /health/database` comprueba la conexión con PostgreSQL sin mostrar credenciales.
- `GET /api/users/me` devuelve el identificador y rol del usuario autenticado para ajustar la navegación móvil.
- `GET /api/users`, `POST /api/users` y `PATCH /api/users/{id}/status` requieren rol `administrador`; crean vendedores en Supabase Auth y activan o bloquean su acceso sin borrar sus ventas.
- Desde **Mi perfil**, cualquier usuario autenticado puede cambiar su contraseña actualizando su cuenta en Supabase Auth.
- `GET /api/brands` consulta marcas con sesión; `POST`, `PUT` y `DELETE /api/brands` requieren rol `administrador` y respetan las relaciones con modelos.
- `/api/laptops` permite consultar, filtrar, registrar, modificar y eliminar modelos sin unidades asociadas.
- `/api/units` permite consultar, registrar, modificar y eliminar unidades por número de serie; las unidades vendidas o con historial no se pueden modificar ni eliminar.
- `POST /api/sales` registra una venta de una o más unidades existentes con pago simulado, conserva el precio vendido y marca las unidades como vendidas en una transacción.
- `POST /api/laptops/{id}/image` adjunta una imagen al modelo indicado; requiere rol `administrador` y el bucket público `catalog-images`.

El cliente móvil consulta `/api/laptops` y `/api/units` después de iniciar sesión. El catálogo muestra la imagen, la marca, el SKU, el precio y las especificaciones disponibles.

Las consultas del catálogo requieren sesión. Las escrituras de marcas, modelos y unidades requieren rol `administrador`; las consultas de unidades y el registro de ventas aceptan `administrador` o `vendedor`. El perfil del administrador inicial se aprovisiona manualmente en Supabase Auth y `usuarios`; después, el administrador puede crear vendedores desde la app.

Las ventas y los pagos de esta versión son simulados; no se conecta una pasarela de pago. Ejecutar el backend únicamente en un entorno local de desarrollo hasta configurar y verificar la autenticación del cliente.

El cliente obtiene el `access_token` mediante Supabase Auth y lo envía como `Authorization: Bearer <token>`; la API no recibe contraseñas. En Swagger, durante el desarrollo, se puede utilizar **Authorize** para probar los endpoints protegidos.

Para comprobar el inicio de sesión y el perfil sin copiar el token en Swagger, iniciar la API con `dotnet run --project api/Api.csproj --launch-profile http` y, en otra terminal, ejecutar `python3 scripts/verify_supabase_auth.py`. El script solicita la clave Publishable/anon y la contraseña de forma oculta; solo consulta `GET /api/units` y no imprime el token ni modifica datos. Para utilizar otro puerto local, definir `CAELESTIA_API_URL` antes de ejecutarlo.

Las pruebas se ejecutan desde la raíz con `dotnet test CaelestiaPOS.sln`.

### Esquema inicial de Supabase

`database/schema.sql` contiene el esquema comercial inicial del proyecto. Antes de ejecutarlo en Supabase, comprobar que las tablas no existan y que Supabase Auth esté habilitado: `usuarios.id` referencia `auth.users(id)`. Ejecutar el archivo desde el SQL Editor de Supabase únicamente después de verificar el esquema actual. No incluye usuarios de demostración ni contraseñas; las identidades se crean primero en Supabase Auth y luego se asocian con un perfil en `usuarios`.

Las imágenes del catálogo se muestran desde URL externas; no se descargan ni se copian al repositorio.

Si `database/schema.sql` ya se ejecutó, no volver a ejecutarlo para incorporar cambios. Cada cambio incremental tiene su propio archivo en `database/migrations/`; aplicar el archivo correspondiente una sola vez en el SQL Editor de Supabase antes de ejecutar una versión de la API que lo requiera.
