-- Apply once to a database where database/schema.sql has already been executed.
-- Adds catalog identifiers, price provenance, and external image references.

BEGIN;

ALTER TABLE public.modelos_laptop
    ADD COLUMN codigo_sku VARCHAR(120),
    ADD COLUMN fuente_precio TEXT,
    ADD COLUMN fecha_consulta_precio DATE,
    ADD COLUMN imagen_url TEXT,
    ADD COLUMN fuente_imagen_url TEXT,
    ADD COLUMN terminos_imagen_url TEXT,
    ADD COLUMN estado_permiso_imagen VARCHAR(30) NOT NULL DEFAULT 'no_confirmado',
    ADD CONSTRAINT ck_modelos_laptop_estado_permiso_imagen
        CHECK (estado_permiso_imagen IN ('no_confirmado', 'permiso_confirmado', 'licencia_abierta'));

CREATE UNIQUE INDEX ux_modelos_laptop_marca_codigo_sku
    ON public.modelos_laptop (marca_id, codigo_sku)
    WHERE codigo_sku IS NOT NULL;

COMMIT;
