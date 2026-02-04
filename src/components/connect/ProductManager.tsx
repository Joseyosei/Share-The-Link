/**
 * Product Manager Component
 * 
 * Allows connected account owners to:
 * - View their products
 * - Create new products
 * - Manage product listings
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { Plus, Package, Loader2, PoundSterling } from "lucide-react";

export const ProductManager = () => {
  const { accountStatus, products, createProduct, fetchMyProducts, loading } = useStripeConnect();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
  });

  // Fetch products when account is ready
  useEffect(() => {
    if (accountStatus?.readyToProcessPayments) {
      fetchMyProducts();
    }
  }, [accountStatus?.readyToProcessPayments, fetchMyProducts]);

  // Handle creating a new product
  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;

    const priceInCents = Math.round(parseFloat(newProduct.price) * 100);
    
    try {
      await createProduct(newProduct.name, newProduct.description, priceInCents);
      setIsCreateOpen(false);
      setNewProduct({ name: "", description: "", price: "" });
      fetchMyProducts();
    } catch (err) {
      // Error handled in hook
    }
  };

  // If not ready to process payments
  if (!accountStatus?.readyToProcessPayments) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Complete your seller onboarding to start adding products
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Your Products
            </CardTitle>
            <CardDescription>
              Manage products for your storefront
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    placeholder="e.g., Premium Template"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productDescription">Description</Label>
                  <Textarea
                    id="productDescription"
                    placeholder="Describe your product..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productPrice">Price (£)</Label>
                  <div className="relative">
                    <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="productPrice"
                      type="number"
                      step="0.01"
                      min="0.50"
                      placeholder="9.99"
                      className="pl-9"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum price is £0.50</p>
                </div>
                <Button 
                  onClick={handleCreateProduct} 
                  disabled={loading || !newProduct.name || !newProduct.price}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Product
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No products yet. Create your first product to start selling!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <h4 className="font-semibold truncate">{product.name}</h4>
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  )}
                  <p className="text-lg font-bold mt-2">
                    £{(product.priceInCents / 100).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
