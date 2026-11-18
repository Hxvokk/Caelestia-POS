import { router } from "expo-router";
import { Text } from "react-native";
import {
  AdminCard,
  AdminGuard,
  AdminHelperText,
  AdminPage,
  AdminSecondaryButton,
} from "../components/AdminAccess";

export function InventoryAdminScreen() {
  return (
    <AdminGuard>
      <AdminPage title="Administrar inventario">
        <AdminHelperText>
          Las operaciones se validan nuevamente en la API y solo están disponibles para el administrador.
        </AdminHelperText>
        <AdminCard>
          <Text>Gestiona las marcas del catálogo.</Text>
          <AdminSecondaryButton
            label="Administrar marcas"
            onPress={() => router.push("/admin/brands")}
          />
        </AdminCard>
        <AdminCard>
          <Text>Registra y actualiza modelos y especificaciones.</Text>
          <AdminSecondaryButton
            label="Administrar modelos"
            onPress={() => router.push("/admin/models")}
          />
        </AdminCard>
        <AdminCard>
          <Text>Registra equipos físicos mediante su número de serie.</Text>
          <AdminSecondaryButton
            label="Administrar unidades"
            onPress={() => router.push("/admin/units")}
          />
        </AdminCard>
      </AdminPage>
    </AdminGuard>
  );
}
