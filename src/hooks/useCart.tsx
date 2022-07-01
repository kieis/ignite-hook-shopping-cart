import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storageCart = localStorage.getItem('@RocketShoes:cart');

    if (storageCart) {
      return JSON.parse(storageCart);
    }

    return [];
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);

  const addProduct = async (productId: number) => {
    try {
      const inStock = stock.find((s: Stock) => (s.id === productId && s.amount > 0));
      if(inStock !== undefined) {
        const inCartProduct = cart.find((product: Product) => product.id === productId);
        if(inCartProduct !== undefined) {
          setCart(cart.map((product: Product) => {
            if(product.id === productId) {
              if(product.amount < inStock.amount){
                product.amount++;
              }else{
                toast.error('Quantidade solicitada fora de estoque');
              }
            }
            return product;
          }));
        }else {
          const product = products.find((product: Product) => product.id === productId);
          if(product !== undefined) {
            setCart([...cart, {...product, amount: 1}]);
          }
        }
      }else {
        toast.error('Quantidade solicitada fora de estoque');
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart(cart.filter((product: Product) => product.id !== productId));

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        return;
      }

      const inStock = stock.find((s: Stock) => (s.id === productId && s.amount > 0));
      if(inStock !== undefined) {
        const updated = cart.map((product: Product) => {
          if(product.id === productId) {
            if(amount <= inStock.amount) {
              product.amount = amount;
            }else{
              toast.error('Quantidade solicitada fora de estoque');
            }
          }
          return product;
        })
        setCart(updated);
      }else {
        toast.error('Quantidade solicitada fora de estoque');
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  useEffect(() => {
    async function loadStock() {
      const response = await api.get('/stock');
      setStock(response.data);
    }
    async function loadProducts() {
      const response = await api.get('/products');
      setProducts(response.data);
    }

    loadStock();
    loadProducts();
  }, []);

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
