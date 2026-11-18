import contextlib
import importlib.util
import io
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "verify_supabase_auth.py"
SPEC = importlib.util.spec_from_file_location("verify_supabase_auth", SCRIPT)
VERIFY_AUTH = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VERIFY_AUTH)


class VerifySupabaseAuthTests(unittest.TestCase):
    def run_probe(self, api_status, units):
        output = io.StringIO()
        responses = [
            (200, {"access_token": "do-not-print-this-token"}),
            (api_status, units),
            (400, {}),
        ]
        with (
            patch.object(VERIFY_AUTH, "load_supabase_url", return_value="https://project.supabase.co"),
            patch.object(VERIFY_AUTH.getpass, "getpass", side_effect=["publishable-key", "test-password"]),
            patch("builtins.input", side_effect=["test@example.com", ""]),
            patch.object(VERIFY_AUTH, "request_json", side_effect=responses) as request,
            contextlib.redirect_stdout(output),
        ):
            result = VERIFY_AUTH.main()
        return result, output.getvalue(), request

    def test_success_checks_units_and_does_not_print_access_token(self):
        result, output, request = self.run_probe(200, [])

        self.assertEqual(result, 0)
        self.assertIn("Autenticación y perfil/rol: correctos.", output)
        self.assertIn("Unidades reales registradas: 0.", output)
        self.assertNotIn("do-not-print-this-token", output)
        self.assertEqual(
            request.call_args_list[1].args[1]["Authorization"],
            "Bearer do-not-print-this-token",
        )
        self.assertEqual(
            request.call_args_list[2].args[2],
            {"unitIds": [0], "paymentMethod": "credito"},
        )
        self.assertEqual(request.call_args_list[2].args[0], "http://localhost:5141/api/sales")
        self.assertIn("No se creó una venta", output)

    def test_rejected_token_is_reported_without_printing_it(self):
        result, output, _ = self.run_probe(401, {})

        self.assertEqual(result, 1)
        self.assertIn("la API rechazó el JWT", output)
        self.assertNotIn("do-not-print-this-token", output)


if __name__ == "__main__":
    unittest.main()
