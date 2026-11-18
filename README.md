# Caelestia POS

Aplicación móvil de punto de venta para una tienda de laptops. El backend se desarrolla localmente y se conecta a PostgreSQL en Supabase.

Consulta el [checklist de avance](CHECKLIST.md) para ver lo completado y lo pendiente según el documento de planeación.

## Backend

Requisitos: .NET SDK 11.

### Configurar Supabase

1. En el panel de Supabase, abrí **Connect** y copiá los datos de **Session pooler**. Ese endpoint funciona sobre IPv4; usá el host y el usuario exactos que muestra tu proyecto.
2. Desde `api`, guardá la cadena localmente con .NET User Secrets:

   ```sh
   dotnet user-secrets set "ConnectionStrings:Caelestia" "Host=HOST_DEL_POOLER;Port=5432;Database=postgres;Username=USUARIO_DEL_POOLER;Password=TU_PASSWORD;SSL Mode=Require"
   ```

   Reemplazá los valores con los que muestra Supabase. No compartas la contraseña ni la guardes en archivos versionados.
3. Guarda la URL pública del proyecto para validar los access tokens de Supabase:

   ```sh
   dotnet user-secrets set "Supabase:Url" "https://PROJECT_REF.supabase.co"
   ```

   Reemplaza `PROJECT_REF` con el identificador de tu proyecto. La API verifica la firma del JWT mediante OpenID Connect/JWKS y consulta `usuarios` para validar que el perfil esté activo y tomar su rol.
4. Para que el administrador gestione vendedores, guarda una clave secreta de servidor en User Secrets:

   ```sh
   dotnet user-secrets set "Supabase:ServiceRoleKey" "TU_SECRET_KEY_DE_SUPABASE"
   ```

   Usá la secret/service-role key del proyecto solo en el backend local. Nunca la pongas en `mobile/`, `.env.local`, código fuente o Git. Sin esta configuración, los endpoints administrativos de usuarios responden `503`.

### Ejecutar y comprobar

Desde la raíz del repositorio:

```sh
dotnet run --project api/Api.csproj
```

Abrí la dirección local que aparece en la terminal y agregá `/swagger`. En Swagger:

- `GET /health` comprueba que la API está activa.
- `GET /health/database` comprueba la conexión con PostgreSQL sin mostrar credenciales.
- `GET /api/users/me` devuelve el identificador y rol del usuario autenticado para ajustar la navegación móvil.
- `GET /api/users`, `POST /api/users` y `PATCH /api/users/{id}/status` requieren rol `administrador`; crean vendedores en Supabase Auth y activan o bloquean su acceso sin borrar sus ventas.
- Desde **Mi perfil**, cualquier usuario autenticado puede cambiar su contraseña actualizando su cuenta en Supabase Auth.
- `GET /api/brands` consulta marcas con sesión; `POST`, `PUT` y `DELETE /api/brands` requieren rol `administrador` y respetan las relaciones con modelos.
- `/api/laptops` permite consultar, filtrar, registrar, modificar y eliminar modelos sin unidades asociadas.
- `/api/units` permite consultar, registrar, modificar y eliminar unidades por número de serie; las unidades vendidas o con historial no se pueden modificar ni eliminar.
- `POST /api/sales` registra una venta de una o más unidades existentes con pago simulado, conserva el precio vendido y marca las unidades como vendidas en una transacción.

El cliente móvil consume `/api/laptops` y `/api/units` después de iniciar sesión. El catálogo muestra la foto, marca, SKU, precio y especificaciones disponibles cuando esos datos existen.

Las consultas del catálogo requieren sesión. Las escrituras de marcas, modelos y unidades requieren rol `administrador`; las consultas de unidades y el registro de ventas aceptan `administrador` o `vendedor`. El perfil del administrador inicial se aprovisiona manualmente en Supabase Auth y `usuarios`; después, el administrador puede crear vendedores desde la app.

Las ventas y pagos de esta primera versión son simulados; no se conecta una pasarela de pago. Ejecuta el backend solo en desarrollo local mientras no se configure y verifique la autenticación del cliente.

El cliente obtiene el `access_token` mediante Supabase Auth y lo envía como `Authorization: Bearer <token>`; la API no recibe contraseñas. En Swagger de desarrollo puedes usar **Authorize** para probar endpoints protegidos.

Para comprobar el inicio de sesión y el perfil sin copiar el token a Swagger, inicia la API con `dotnet run --project api/Api.csproj --launch-profile http` y, en otra terminal, ejecuta `python3 scripts/verify_supabase_auth.py`. El script pide la clave Publishable/anon y la contraseña de forma oculta, solo consulta `GET /api/units` y no imprime el token ni modifica datos. Si usas otro puerto local, define `CAELESTIA_API_URL` antes de ejecutarlo.

Las pruebas se ejecutan desde la raíz con `dotnet test CaelestiaPOS.sln`.

### Esquema inicial de Supabase

`database/schema.sql` contiene el esquema comercial inicial definido para el proyecto. Antes de ejecutarlo en Supabase, confirma que las tablas no existan y que Supabase Auth esté habilitado: `usuarios.id` referencia `auth.users(id)`. Ejecuta el archivo desde el SQL Editor de Supabase solo después de verificar el esquema actual. No incluye usuarios de demostración ni contraseñas; las identidades se crean primero en Supabase Auth y luego se asocian con un perfil en `usuarios`.

Las imágenes del catálogo se muestran desde URL externas; no se descargan ni se copian al repositorio.

Si `database/schema.sql` ya fue ejecutado, no vuelvas a correrlo para añadir cambios. Cada cambio incremental tiene su propio archivo en `database/migrations/`; aplica el archivo correspondiente una sola vez en Supabase SQL Editor antes de ejecutar una versión de la API que lo requiera.
