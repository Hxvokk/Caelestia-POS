-- Initial Caelestia POS schema for Supabase PostgreSQL.
-- Review the existing project schema before running this script.
-- This script creates commercial tables only; Supabase Auth owns auth.users.

BEGIN;

CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY
        REFERENCES auth.users (id)
        ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    rol VARCHAR(20) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_usuarios_rol
        CHECK (rol IN ('administrador', 'vendedor'))
);

CREATE TABLE public.marcas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE public.modelos_laptop (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    marca_id BIGINT NOT NULL
        REFERENCES public.marcas (id)
        ON DELETE RESTRICT,
    codigo_sku VARCHAR(120),
    nombre VARCHAR(120) NOT NULL,
    procesador_o_chip VARCHAR(150) NOT NULL,
    nucleos_cpu INTEGER,
    hilos_cpu INTEGER,
    memoria_unificada_gb INTEGER,
    ram_gb INTEGER,
    almacenamiento_gb INTEGER NOT NULL,
    tipo_almacenamiento VARCHAR(20) NOT NULL,
    gpu VARCHAR(150),
    tipo_gpu VARCHAR(20),
    gpu_vram_gb NUMERIC(6, 2),
    nivel_cpu VARCHAR(20),
    nivel_gpu VARCHAR(20),
    precio NUMERIC(12, 2) NOT NULL,
    fuente_precio TEXT,
    fecha_consulta_precio DATE,
    fuente_especificaciones TEXT,
    imagen_url TEXT,
    fuente_imagen_url TEXT,
    terminos_imagen_url TEXT,
    estado_permiso_imagen VARCHAR(30) NOT NULL DEFAULT 'no_confirmado',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_modelos_laptop_nucleos_cpu
        CHECK (nucleos_cpu IS NULL OR nucleos_cpu > 0),
    CONSTRAINT ck_modelos_laptop_hilos_cpu
        CHECK (hilos_cpu IS NULL OR hilos_cpu > 0),
    CONSTRAINT ck_modelos_laptop_memoria_unificada
        CHECK (memoria_unificada_gb IS NULL OR memoria_unificada_gb > 0),
    CONSTRAINT ck_modelos_laptop_ram
        CHECK (ram_gb IS NULL OR ram_gb > 0),
    CONSTRAINT ck_modelos_laptop_almacenamiento
        CHECK (almacenamiento_gb > 0),
    CONSTRAINT ck_modelos_laptop_tipo_gpu
        CHECK (tipo_gpu IS NULL OR tipo_gpu IN ('integrada', 'dedicada', 'híbrida')),
    CONSTRAINT ck_modelos_laptop_gpu_vram
        CHECK (gpu_vram_gb IS NULL OR gpu_vram_gb > 0),
    CONSTRAINT ck_modelos_laptop_nivel_cpu
        CHECK (nivel_cpu IS NULL OR nivel_cpu IN ('básico', 'medio', 'alto')),
    CONSTRAINT ck_modelos_laptop_nivel_gpu
        CHECK (nivel_gpu IS NULL OR nivel_gpu IN ('básico', 'medio', 'alto')),
    CONSTRAINT ck_modelos_laptop_estado_permiso_imagen
        CHECK (estado_permiso_imagen IN ('no_confirmado', 'permiso_confirmado', 'licencia_abierta')),
    CONSTRAINT ck_modelos_laptop_precio
        CHECK (precio > 0)
);

CREATE TABLE public.unidades_laptop (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    modelo_id BIGINT NOT NULL
        REFERENCES public.modelos_laptop (id)
        ON DELETE RESTRICT,
    numero_serie VARCHAR(100) NOT NULL UNIQUE,
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible',
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_unidades_laptop_estado
        CHECK (estado IN ('disponible', 'vendida'))
);

CREATE TABLE public.ventas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id UUID NOT NULL
        REFERENCES public.usuarios (id)
        ON DELETE RESTRICT,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total NUMERIC(12, 2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'completada',
    CONSTRAINT ck_ventas_total
        CHECK (total > 0),
    CONSTRAINT ck_ventas_estado
        CHECK (estado = 'completada')
);

CREATE TABLE public.detalles_venta (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    venta_id BIGINT NOT NULL
        REFERENCES public.ventas (id)
        ON DELETE RESTRICT,
    unidad_id BIGINT NOT NULL UNIQUE
        REFERENCES public.unidades_laptop (id)
        ON DELETE RESTRICT,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    CONSTRAINT ck_detalles_venta_precio_unitario
        CHECK (precio_unitario > 0)
);

CREATE TABLE public.pagos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    venta_id BIGINT NOT NULL UNIQUE
        REFERENCES public.ventas (id)
        ON DELETE RESTRICT,
    metodo VARCHAR(20) NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    monto_recibido NUMERIC(12, 2),
    cambio NUMERIC(12, 2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'aprobado',
    referencia VARCHAR(60),
    es_simulado BOOLEAN NOT NULL DEFAULT TRUE,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_pagos_metodo
        CHECK (metodo IN ('efectivo', 'debito', 'credito')),
    CONSTRAINT ck_pagos_monto
        CHECK (monto > 0),
    CONSTRAINT ck_pagos_cambio
        CHECK (cambio >= 0),
    CONSTRAINT ck_pagos_estado
        CHECK (estado = 'aprobado'),
    CONSTRAINT ck_pagos_datos_efectivo
        CHECK (
            (metodo = 'efectivo'
                AND monto_recibido IS NOT NULL
                AND monto_recibido >= monto
                AND cambio = monto_recibido - monto)
            OR
            (metodo IN ('debito', 'credito')
                AND monto_recibido IS NULL
                AND cambio = 0)
        )
);

CREATE INDEX ix_modelos_laptop_marca_id
    ON public.modelos_laptop (marca_id);

CREATE UNIQUE INDEX ux_modelos_laptop_marca_codigo_sku
    ON public.modelos_laptop (marca_id, codigo_sku)
    WHERE codigo_sku IS NOT NULL;

CREATE INDEX ix_unidades_laptop_modelo_id_estado
    ON public.unidades_laptop (modelo_id, estado);

CREATE INDEX ix_ventas_usuario_id_fecha
    ON public.ventas (usuario_id, fecha DESC);

CREATE INDEX ix_detalles_venta_venta_id
    ON public.detalles_venta (venta_id);

-- The mobile app accesses commercial data through the backend API, not directly.
-- With no client policies, Supabase client roles cannot access these tables via
-- the Data API. The backend's database role must be configured separately.
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_laptop ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades_laptop ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalles_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

COMMIT;
