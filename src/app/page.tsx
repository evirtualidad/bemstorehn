import { Header } from '@/components/header';
import { ProductRecommendations } from '@/components/product-recommendations';
import { ProductCard } from '@/components/product-card';
import { products, type Product } from '@/lib/products';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const productsByCategory = products.reduce((acc, product) => {
    const { category } = product;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <ProductRecommendations allProducts={products} />
        
        <Separator className="my-12 md:my-16 bg-border/40" />
        
        <section>
          <h2 className="text-4xl md:text-5xl font-headline text-center mb-8 md:mb-12">Our Products</h2>
          {Object.entries(productsByCategory).map(([category, items]) => (
            <div key={category} className="mb-12">
              <h3 className="text-3xl md:text-4xl font-headline mb-6 text-primary">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {items.map((product, index) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
      <footer className="py-6 border-t border-border/40">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 Cosmetica Catalog. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
