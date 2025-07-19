
'use client';

import * as React from 'react';
import Image from 'next/image';
import { type Product, type Category, type Banner } from '@/lib/types';
import { ProductCard } from './product-card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChevronRight, Filter, Search } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import Link from 'next/link';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '../ui/badge';


interface HomePageContentProps {
  banners: Banner[];
  products: Product[];
  featuredProducts: Product[];
  categories: Category[];
}

export function HomePageContent({ 
    banners,
    products, 
    featuredProducts, 
    categories 
}: HomePageContentProps) {
    const [selectedCategory, setSelectedCategory] = React.useState('all');
    const { currency } = useCurrencyStore();

    const specialOffer = banners.length > 0 ? banners[0] : null;
    const popularProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4);
    const featuredItem = products.find(p => p.id === 'prod_1');

    return (
        <main className="px-4 pt-6 pb-24 space-y-8">
            {/* Welcome Message */}
            <div className="fade-in">
                <h1 className="text-4xl font-bold font-heading tracking-tight">Bienvenido,</h1>
                <p className="text-xl text-muted-foreground font-heading">a nuestra App de Moda</p>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2 fade-in" style={{ animationDelay: '100ms' }}>
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Buscar..." className="bg-secondary rounded-full h-12 pl-10 text-base" />
                </div>
                <Button size="icon" className="w-12 h-12 rounded-full bg-foreground text-background shrink-0">
                    <Filter className="h-5 w-5" />
                </Button>
            </div>
            
            {/* Featured Item */}
            {featuredItem && (
                 <Card className="p-4 flex items-center gap-4 rounded-2xl shadow-sm fade-in" style={{ animationDelay: '200ms' }}>
                    <Image src={featuredItem.image} alt={featuredItem.name} width={64} height={64} className="rounded-lg bg-secondary aspect-square object-cover" data-ai-hint={featuredItem.aiHint || "product"}/>
                    <div className="flex-1">
                        <p className="font-bold font-heading">{featuredItem.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{featuredItem.description}</p>
                        <p className="font-bold mt-1">{formatCurrency(featuredItem.price, currency.code)}</p>
                    </div>
                    <Link href={`/product/${featuredItem.id}`} className="bg-foreground text-background rounded-full p-2">
                        <ChevronRight className="h-5 w-5"/>
                    </Link>
                </Card>
            )}

            {/* Categories */}
            <div className="space-y-3 fade-in" style={{ animationDelay: '300ms' }}>
                <h2 className="text-xl font-bold font-heading">Categorías</h2>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                     <Button 
                        onClick={() => setSelectedCategory('all')} 
                        variant={selectedCategory === 'all' ? 'default' : 'secondary'}
                        className={`rounded-full px-5 h-10 whitespace-nowrap ${selectedCategory === 'all' ? 'bg-foreground text-background' : 'bg-secondary'}`}
                    >
                        Todos
                    </Button>
                    {categories.map((cat) => (
                        <Button 
                            key={cat.id} 
                            onClick={() => setSelectedCategory(cat.name)}
                            variant={selectedCategory === cat.name ? 'default' : 'secondary'}
                            className={`rounded-full px-5 h-10 whitespace-nowrap ${selectedCategory === cat.name ? 'bg-foreground text-background' : 'bg-secondary'}`}
                        >
                            {cat.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Special Offer */}
            {specialOffer && (
                <div className="space-y-3 fade-in" style={{ animationDelay: '400ms' }}>
                    <h2 className="text-xl font-bold font-heading">Ofertas Especiales</h2>
                     <Card className="relative aspect-video rounded-2xl overflow-hidden shadow-lg group">
                         <Image src={specialOffer.image} alt={specialOffer.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint={specialOffer.aiHint || 'fashion sale'}/>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                         <div className="absolute bottom-0 left-0 p-6 text-white">
                             <h3 className="text-2xl font-bold font-heading">{specialOffer.title}</h3>
                             <p>{specialOffer.description}</p>
                         </div>
                         <Button asChild className="absolute bottom-6 right-6 rounded-full bg-white/90 text-black backdrop-blur-sm hover:bg-white">
                            <Link href="#">Ver Ahora</Link>
                         </Button>
                     </Card>
                </div>
            )}
            
            {/* Popular Products */}
            <div className="space-y-3 fade-in" style={{ animationDelay: '500ms' }}>
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold font-heading">Vestidos Populares</h2>
                    <Link href="#" className="text-sm font-semibold text-primary">Ver Todos</Link>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     {popularProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                     ))}
                 </div>
            </div>
        </main>
    );
}
