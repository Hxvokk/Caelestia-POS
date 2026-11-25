import type { SalePaymentMethod } from "../../../shared/api/salesApi";

const labels: Record<SalePaymentMethod, string> = {
  efectivo: "Efectivo",
  debito: "Débito simulado",
  credito: "Crédito simulado",
};

export function paymentMethodLabel(method: SalePaymentMethod): string {
  return labels[method] ?? String(method);
}
