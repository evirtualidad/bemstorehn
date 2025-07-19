'use client';

import * as React from 'react';
import Image from 'next/image';
import { type Product, type Category, type Banner } from '@/lib/types';
import { ProductCard } from './product-card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChevronRight, Search } from 'lucide-react';
import { Card } from '../ui/card';
import Link from 'next/link';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency } from '@/lib/utils';

const FilterIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="7" r="2" fill="white"/>
        <circle cx="12" cy="17" r="2" fill="white"/>
    </svg>
);


interface HomePageContentProps {
  banners: Banner[];
  products: Product[];
  featuredProducts: Product[];
  categories: Category[];
}

export function HomePageContent({ 
    products, 
    categories 
}: HomePageContentProps) {
    const [selectedCategory, setSelectedCategory] = React.useState('all');
    const { currency } = useCurrencyStore();

    const featuredItem = products.find(p => p.id === 'prod_2'); // Let's use a different featured item for variety

    const filteredProducts = React.useMemo(() => {
        if (selectedCategory === 'all') return products;
        return products.filter(p => p.category === selectedCategory);
    }, [products, selectedCategory]);

    return (
        <main className="px-4 pt-6 pb-24 space-y-8">
            <div className="fade-in">
                <h1 className="text-4xl font-extrabold tracking-tight">Welcome,</h1>
                <p className="text-xl text-muted-foreground font-bold">Our Fashions App</p>
            </div>

            <div className="flex items-center gap-2 fade-in" style={{ animationDelay: '100ms' }}>
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search..." className="bg-secondary rounded-full h-14 pl-12 text-base border-none" />
                </div>
                <Button size="icon" className="w-14 h-14 rounded-full bg-primary text-primary-foreground shrink-0">
                    <FilterIcon />
                </Button>
            </div>
            
            {featuredItem && (
                 <Card className="p-4 flex items-center gap-4 rounded-2xl shadow-sm bg-secondary border-none fade-in" style={{ animationDelay: '200ms' }}>
                    <Image src={'https://placehold.co/96x96.png'} alt={featuredItem.name} width={64} height={64} className="rounded-lg bg-background aspect-square object-cover" data-ai-hint={"sneakers"}/>
                    <div className="flex-1">
                        <p className="font-bold">Axel Arigato</p>
                        <p className="text-sm text-muted-foreground">Clean 90 Triple Sneakers</p>
                        <p className="font-bold mt-1">{formatCurrency(245, currency.code)}</p>
                    </div>
                    <Link href={`/product/${featuredItem.id}`} className="bg-primary text-primary-foreground rounded-full p-2">
                        <ChevronRight className="h-5 w-5"/>
                    </Link>
                </Card>
            )}

            <div className="space-y-3 fade-in" style={{ animationDelay: '300ms' }}>
                <h2 className="text-xl font-bold">Categories</h2>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                     <Button 
                        onClick={() => setSelectedCategory('all')} 
                        variant={selectedCategory === 'all' ? 'default' : 'secondary'}
                        className={`rounded-full px-6 h-11 whitespace-nowrap text-base font-bold ${selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                    >
                        Dresses
                    </Button>
                    {categories.map((cat) => (
                        <Button 
                            key={cat.id} 
                            onClick={() => setSelectedCategory(cat.name)}
                            variant={selectedCategory === cat.name ? 'default' : 'secondary'}
                            className={`rounded-full px-6 h-11 whitespace-nowrap text-base font-bold ${selectedCategory === cat.name ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                        >
                            {cat.label}
                        </Button>
                    ))}
                </div>
            </div>
            
            <div className="space-y-3 fade-in" style={{ animationDelay: '400ms' }}>
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Top Dresses</h2>
                    <Link href="#" className="text-sm font-semibold text-muted-foreground">View All</Link>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     {filteredProducts.slice(0, 4).map((product) => (
                        <ProductCard key={product.id} product={product} />
                     ))}
                 </div>
            </div>
        </main>
    );
}
