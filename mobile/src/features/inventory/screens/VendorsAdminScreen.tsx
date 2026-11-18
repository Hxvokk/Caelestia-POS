import { useCallback, useEffect, useState } from "react";
import { Alert, Text } from "react-native";
import { getApiErrorMessage } from "../../../shared/api/client";
import {
  createVendor,
  getVendors,
  setVendorActive,
} from "../../../shared/api/usersApi";
import type { VendorAccount } from "../../../shared/api/types";
import { colors } from "../../../shared/config/theme";
import {
  AdminCard,
  AdminField,
  AdminGuard,
  AdminHelperText,
  AdminPage,
  AdminPrimaryButton,
} from "../components/AdminAccess";

export function VendorsAdminScreen() {
  const [vendors, setVendors] = useState<VendorAccount[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadVendors = useCallback(async () => {
    setIsLoading(true);
    try {
      setVendors(await getVendors());
      setError(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadVendors);
  }, [loadVendors]);

  const addVendor = async () => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedName) {
      setError("Escribe el nombre del vendedor.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Escribe un correo válido.");
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError("La contraseña inicial debe tener entre 8 y 128 caracteres.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      await createVendor({
        name: normalizedName,
        email: normalizedEmail,
        password,
      });
      setName("");
      setEmail("");
      setPassword("");
      setNotice("Cuenta creada. Comparte la contraseña inicial por un canal seguro.");
      await loadVendors();
    } catch (createError) {
      setError(getApiErrorMessage(createError));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmStatusChange = (vendor: VendorAccount) => {
    const nextIsActive = !vendor.isActive;
    Alert.alert(
      nextIsActive ? "Activar vendedor" : "Desactivar vendedor",
      nextIsActive
        ? `¿Permitir nuevamente el acceso de ${vendor.name}?`
        : `¿Bloquear el acceso de ${vendor.name}? Sus ventas históricas se conservarán.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: nextIsActive ? "Activar" : "Desactivar",
          style: nextIsActive ? "default" : "destructive",
          onPress: () => {
            setError(null);
            void setVendorActive(vendor.id, nextIsActive)
              .then(loadVendors)
              .catch((statusError: unknown) => setError(getApiErrorMessage(statusError)));
          },
        },
      ],
    );
  };

  return (
    <AdminGuard>
      <AdminPage title="Vendedores">
        <AdminCard>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
            Crear cuenta de vendedor
          </Text>
          <AdminField
            label="Nombre"
            onChangeText={setName}
            placeholder="Nombre del vendedor"
            value={name}
          />
          <AdminField
            label="Correo electrónico"
            onChangeText={setEmail}
            placeholder="vendedor@tienda.com"
            value={email}
          />
          <AdminField
            label="Contraseña inicial"
            onChangeText={setPassword}
            placeholder="Mínimo 8 caracteres"
            secureTextEntry
            value={password}
          />
          <AdminHelperText>
            La API crea la cuenta en Supabase Auth y su perfil local como vendedor activo. No se ofrece registro público.
          </AdminHelperText>
          {error ? (
            <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>
          ) : null}
          {notice ? (
            <Text accessibilityRole="status" style={{ color: colors.success }}>{notice}</Text>
          ) : null}
          <AdminPrimaryButton
            disabled={isSaving}
            label={isSaving ? "Creando cuenta…" : "Crear vendedor"}
            onPress={() => void addVendor()}
          />
        </AdminCard>

        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
          Cuentas registradas
        </Text>
        {isLoading ? <AdminHelperText>Cargando vendedores…</AdminHelperText> : null}
        {!isLoading && vendors.length === 0 ? (
          <AdminHelperText>No hay cuentas de vendedor registradas.</AdminHelperText>
        ) : null}
        {vendors.map((vendor) => (
          <AdminCard key={vendor.id}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
              {vendor.name}
            </Text>
            <Text style={{ color: colors.muted }}>{vendor.email}</Text>
            <Text
              style={{
                color: vendor.isActive ? colors.success : colors.danger,
                fontWeight: "700",
              }}
            >
              {vendor.isActive ? "Activo" : "Inactivo"}
            </Text>
            <AdminPrimaryButton
              label={vendor.isActive ? "Desactivar acceso" : "Activar acceso"}
              onPress={() => confirmStatusChange(vendor)}
            />
          </AdminCard>
        ))}
      </AdminPage>
    </AdminGuard>
  );
}
