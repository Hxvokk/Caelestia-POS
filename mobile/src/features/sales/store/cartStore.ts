import { create } from "zustand";

export const MAX_CART_ITEMS = 20;

export type CartItem = {
  unitId: number;
  modelId: number;
  brandName: string;
  modelName: string;
  serialNumber: string;
  unitPrice: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (unitId: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      if (
        state.items.length >= MAX_CART_ITEMS ||
        state.items.some((current) => current.unitId === item.unitId)
      ) {
        return state;
      }

      return { items: [...state.items, item] };
    }),
  removeItem: (unitId) =>
    set((state) => ({
      items: state.items.filter((item) => item.unitId !== unitId),
    })),
  clear: () => set({ items: [] }),
}));
