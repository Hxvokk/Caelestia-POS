import { router } from "expo-router";
import {
  HomeActionCard,
  HomeErrorState,
  HomeFrame,
  HomeSectionTitle,
} from "../components/HomeDashboardUI";
import { DashboardScreen } from "./DashboardScreen";
import { useAdministratorAccess } from "../hooks/useAdministratorAccess";

export function HomeScreen() {
  const { error, isAdministrator, retry } = useAdministratorAccess();

  if (isAdministrator) {
    return <DashboardScreen asHome />;
  }

  return (
    <HomeFrame>
      {error ? (
        <HomeErrorState message={error} onRetry={() => void retry()} />
      ) : (
        <>
          <HomeSectionTitle>Acciones del día</HomeSectionTitle>
          <HomeActionCard
            icon="cart-outline"
            title="Nueva venta"
            description="Inicia una venta de laptops"
            onPress={() => router.push("/inventory")}
          />
        </>
      )}
    </HomeFrame>
  );
}
