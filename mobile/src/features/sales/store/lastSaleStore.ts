import { create } from "zustand";
import type { CartItem } from "./cartStore";

type LastSaleStore = {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
};

/** Keeps the articles of the last approved sale so the result screen can list them. */
export const useLastSaleStore = create<LastSaleStore>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
}));
