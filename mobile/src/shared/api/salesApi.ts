import { isAxiosError } from "axios";
import { apiClient } from "./client";

export type SalePaymentMethod = "efectivo" | "debito" | "credito";
export type SimulatedCardResult = "aprobado" | "rechazado";

export type CreateSaleRequest = {
  unitIds: number[];
  paymentMethod: SalePaymentMethod;
  amountReceived: number | null;
  simulatedCardResult: SimulatedCardResult | null;
};

export type SaleResponse = {
  id: number;
  userId: string;
  date: string;
  total: number;
  status: string;
  paymentMethod: SalePaymentMethod;
  amountReceived: number | null;
  change: number;
  isSimulated: boolean;
  items: {
    unitId: number;
    serialNumber: string;
    brandName: string;
    modelName: string;
    unitPrice: number;
  }[];
};

export class PaymentRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentRejectedError";
  }
}

export async function createSale(request: CreateSaleRequest): Promise<SaleResponse> {
  try {
    const response = await apiClient.post<SaleResponse>("/api/sales", request);
    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 422) {
      const body = error.response.data as {
        code?: unknown;
        extensions?: { code?: unknown };
        title?: unknown;
      };
      const resultCode = body.code ?? body.extensions?.code;

      if (resultCode === "PAYMENT_REJECTED") {
        throw new PaymentRejectedError(
          typeof body.title === "string"
            ? body.title
            : "El pago fue rechazado. No se registró la venta ni se modificó el inventario.",
        );
      }
    }

    throw error;
  }
}
