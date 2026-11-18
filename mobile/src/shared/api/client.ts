import { create, isAxiosError } from "axios";
import { appEnvironment } from "../config/env";
import { supabase } from "../auth/supabase";

export const apiClient = create({
  baseURL: appEnvironment.apiUrl,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (!supabase) {
    throw new Error("Configura Supabase para iniciar sesión.");
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.access_token) {
    throw new Error("La sesión expiró. Inicia sesión de nuevo.");
  }

  config.headers.set("Authorization", `Bearer ${data.session.access_token}`);
  return config;
});

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const title =
      error.response?.data?.title ??
      error.response?.data?.message;

    if (status === 401) return "La sesión ya no es válida. Inicia sesión de nuevo.";
    if (status === 403) return "Tu cuenta no tiene permiso para consultar el inventario.";
    if (status === 404) return "No se encontró la información solicitada.";
    if (status && status >= 500) return "El servidor tuvo un problema. Intenta de nuevo.";
    if (typeof title === "string") return title;
    if (!error.response) {
      return "No se pudo conectar con la API. Revisa que esté activa y que la dirección local sea correcta.";
    }
  }

  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}
