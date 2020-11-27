import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStoraged = await AsyncStorage.getItem('@products');
      if (productsStoraged) setProducts(JSON.parse(productsStoraged));
      else setProducts([]);
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      setProducts(productsInCart =>
        productsInCart.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity + 1 }
            : product,
        ),
      );
      await AsyncStorage.setItem('@products', JSON.stringify(products));
    },
    [products],
  );
  const addToCart = useCallback(
    async product => {
      const productExists = products.find(
        productInCart => productInCart.id === product.id,
      );

      if (productExists) {
        setProducts(
          products.map(productInCart =>
            productInCart.id === product.id
              ? { ...productInCart, quantity: productInCart.quantity + 1 }
              : productInCart,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }
      await AsyncStorage.setItem('@products', JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productExists = products.find(
        productInCart => productInCart.id === id,
      );
      if (productExists) {
        if (productExists?.quantity > 1) {
          setProducts(productsInCart =>
            productsInCart.map(product =>
              product.id === id
                ? { ...product, quantity: product.quantity - 1 }
                : product,
            ),
          );
        } else {
          setProducts(prod => prod.filter(product => product.id !== id));
        }
      }
      await AsyncStorage.setItem('@products', JSON.stringify(products));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
