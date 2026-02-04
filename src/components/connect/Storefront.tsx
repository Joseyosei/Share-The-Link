/**
 * Storefront Component
 * 
 * Public-facing storefront for a connected account.
 * Displays products and allows customers to make purchases.
 * 
 * TODO: In production, use a different identifier (like username)
 * instead of the Stripe account ID in the URL.
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShoppingCart, Store, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description?: string;
  images?: string[];
  priceId: string;
  priceAmount: number;
  currency: string;
  formattedPrice: string;
}

interface StoreInfo {
  name: string;
  accountId: string;
}

export const Storefront = () => {
  // TODO: Replace with username lookup in production
  const { accountId } = useParams<{ accountId: string }>();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch store products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!accountId) return;

      try {
        const { data, error: invokeError } = await supabase.functions.invoke(
          "list-connect-products",
          {
            body: { accountId },
          }
        );

        if (invokeError) throw new Error(invokeError.message);
        if (data.error) throw new Error(data.error);

        setStore(data.store);
        setProducts(data.products || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load store";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [accountId]);

  // Handle purchasing a product
  const handlePurchase = async (product: Product) => {
    setCheckoutLoading(product.id);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-connect-checkout",
        {
          body: {
            accountId,
            priceId: product.priceId,
            productName: product.name,
            quantity: 1,
          },
        }
      );

      if (invokeError) throw new Error(invokeError.message);
      if (data.error) throw new Error(data.error);

      // Redirect to checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start checkout";
      toast.error(message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Store Not Found</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Store Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{store?.name || "Store"}</h1>
              <p className="text-muted-foreground">Browse products and shop securely</p>
            </div>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="container mx-auto px-6 py-12">
        {products.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Products Yet</h2>
              <p className="text-muted-foreground">
                This store hasn't added any products yet. Check back soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden flex flex-col">
                {/* Product Image Placeholder */}
                {product.images?.[0] ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="h-48 bg-muted flex items-center justify-center">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1">
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </CardContent>
                
                <CardFooter className="flex items-center justify-between border-t pt-4">
                  <span className="text-xl font-bold">{product.formattedPrice}</span>
                  <Button
                    onClick={() => handlePurchase(product)}
                    disabled={checkoutLoading === product.id}
                  >
                    {checkoutLoading === product.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4 mr-2" />
                    )}
                    Buy Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-12">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Powered by Share The Link • Secure payments by Stripe</p>
        </div>
      </footer>
    </div>
  );
};
