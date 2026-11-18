#!/usr/bin/env python3
"""Sign in locally and verify the API accepts the user's Supabase JWT."""

from __future__ import annotations

import getpass
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path


def load_supabase_url() -> str:
    repository_root = Path(__file__).resolve().parents[1]
    project_file = repository_root / "api" / "Api.csproj"
    project = ET.parse(project_file).getroot()
    secrets_id = project.findtext(".//UserSecretsId")
    if not secrets_id:
        raise RuntimeError("No se encontró UserSecretsId en el proyecto API.")

    secrets_file = Path.home() / ".microsoft" / "usersecrets" / secrets_id / "secrets.json"
    if not secrets_file.exists():
        raise RuntimeError("No se encontró el archivo local de User Secrets de la API.")

    secrets = json.loads(secrets_file.read_text(encoding="utf-8-sig"))
    supabase_url = secrets.get("Supabase:Url", "").strip().rstrip("/")
    if not supabase_url.startswith("https://"):
        raise RuntimeError("Supabase:Url debe ser una URL HTTPS guardada en User Secrets.")
    return supabase_url


def request_json(url: str, headers: dict[str, str], payload: dict | None = None) -> tuple[int, dict]:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        url,
        data=data,
        headers=headers,
        method="POST" if payload is not None else "GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            return response.status, json.loads(response.read())
    except urllib.error.HTTPError as error:
        return error.code, {}


def main() -> int:
    try:
        supabase_url = load_supabase_url()
    except (OSError, RuntimeError, ET.ParseError, json.JSONDecodeError) as error:
        print(f"Configuración incompleta: {error}")
        return 1

    publishable_key = getpass.getpass("Clave Publishable/anon de Supabase: ").strip()
    email = input("Correo de la cuenta Auth: ").strip()
    password = getpass.getpass("Contraseña de la cuenta: ")
    api_url = os.environ.get("CAELESTIA_API_URL", "http://localhost:5141").rstrip("/")
    if not publishable_key or not email or not password:
        print("La clave, el correo y la contraseña son necesarios para la prueba.")
        return 1

    login_url = f"{supabase_url}/auth/v1/token?{urllib.parse.urlencode({'grant_type': 'password'})}"
    try:
        login_status, session = request_json(
            login_url,
            {
                "apikey": publishable_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            {"email": email, "password": password},
        )
    except (urllib.error.URLError, TimeoutError):
        print("No se pudo conectar con Supabase Auth desde este equipo.")
        return 1
    if login_status != 200 or not session.get("access_token"):
        print(f"El inicio de sesión en Supabase falló (HTTP {login_status}).")
        print("Revisa la URL, la clave Publishable/anon, las credenciales y la confirmación del correo.")
        return 1

    try:
        status, units = request_json(
            f"{api_url}/api/units",
            {
                "Authorization": f"Bearer {session['access_token']}",
                "Accept": "application/json",
            },
        )
    except (urllib.error.URLError, TimeoutError):
        print("No se pudo conectar con la API local.")
        print("Confirma que la API esté ejecutándose y que CAELESTIA_API_URL tenga el puerto correcto.")
        return 1
    if status == 200 and isinstance(units, list):
        print("Autenticación y perfil/rol: correctos.")
        print(f"Unidades reales registradas: {len(units)}.")
    elif status == 401:
        print("Supabase inició sesión, pero la API rechazó el JWT (HTTP 401).")
        print("Verifica Supabase:Url, el issuer OIDC/JWKS y que el perfil esté activo.")
        return 1
    elif status == 403:
        print("JWT válido, pero el rol del perfil no permite consultar unidades (HTTP 403).")
        print("El rol debe ser administrador o vendedor y el perfil debe estar activo.")
        return 1
    else:
        print(f"No se pudo verificar el endpoint local (HTTP {status}).")
        print(f"Confirma que la API esté ejecutándose en {api_url}.")
        return 1

    try:
        sale_status, _ = request_json(
            f"{api_url}/api/sales",
            {
                "Authorization": f"Bearer {session['access_token']}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            {
                "unitIds": [0],
                "paymentMethod": "credito",
            },
        )
    except (urllib.error.URLError, TimeoutError):
        print("No se pudo conectar con el endpoint de ventas.")
        return 1

    if sale_status == 400:
        print("Endpoint de ventas y autorización: correctos.")
        print("La prueba usó un ID inválido, rechazado antes de iniciar una transacción.")
        print("No se creó una venta ni se modificó la base de datos.")
        print("No se imprimió el token.")
        return 0
    if sale_status == 401:
        print("Supabase inició sesión, pero la API rechazó el JWT (HTTP 401).")
        print("Verifica Supabase:Url, el issuer OIDC/JWKS y que el perfil esté activo.")
    elif sale_status == 403:
        print("JWT válido, pero el rol del perfil no permite registrar ventas (HTTP 403).")
        print("El rol debe ser administrador o vendedor y el perfil debe estar activo.")
    else:
        print(f"El endpoint de ventas respondió HTTP {sale_status}; no se esperaba ese resultado para un ID inválido.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
