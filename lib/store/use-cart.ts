import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  variantId: string;
  productId: string;
  modelName: string;
  brand: string;
  colorName: string;
  colorHex: string;
  storage: string;
  condition: string; // "NEW" | "USED"
  price: number;
  image: string;
  quantity: number;
  maxStock?: number;
}

export interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalCount: () => number;
  getTotalPrice: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(
          (i) => i.variantId === item.variantId
        );

        if (existingIndex > -1) {
          const updatedItems = [...currentItems];
          const existingItem = updatedItems[existingIndex];
          const newQty = existingItem.quantity + quantity;
          const max = existingItem.maxStock ?? Infinity;
          updatedItems[existingIndex] = {
            ...existingItem,
            quantity: Math.min(newQty, max),
          };
          set({ items: updatedItems });
        } else {
          const max = item.maxStock ?? Infinity;
          set({
            items: [
              ...currentItems,
              {
                ...item,
                quantity: Math.min(Math.max(1, quantity), max),
              },
            ],
          });
        }
      },

      removeItem: (variantId: string) => {
        set({
          items: get().items.filter((i) => i.variantId !== variantId),
        });
      },

      updateQuantity: (variantId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        set({
          items: get().items.map((i) => {
            if (i.variantId === variantId) {
              const max = i.maxStock ?? Infinity;
              return {
                ...i,
                quantity: Math.min(quantity, max),
              };
            }
            return i;
          }),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "aloshop-cart",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
