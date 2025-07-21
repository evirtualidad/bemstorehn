
'use client';

import * as React from 'react';
import Image from 'next/image';
import { type Product, type Category } from '@/lib/types';
import { ProductCard } from './product-card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChevronRight, Search } from 'lucide-react';
import { Card } from '../ui/card';
import Link from 'next/link';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const FilterIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 6L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M4 6L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 18L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M20 18L14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="6" r="2" transform="rotate(90 12 6)" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="18" r="2" transform="rotate(90 12 18)" stroke="currentColor" strokeWidth="2"/>
    </svg>
);


interface HomePageContentProps {
  products: Product[];
  categories: Category[];
}

export function HomePageContent({ 
    products, 
    categories 
}: HomePageContentProps) {
    const [selectedCategory, setSelectedCategory] = React.useState('all');

    const filteredProducts = React.useMemo(() => {
        if (selectedCategory === 'all') return products;
        return products.filter(p => p.category === selectedCategory);
    }, [products, selectedCategory]);

    return (
        <main className="px-4 pt-4 pb-8 space-y-8">
            <div className="flex items-center gap-2 fade-in" style={{ animationDelay: '100ms' }}>
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search..." className="bg-secondary rounded-full h-14 pl-12 text-base border-none" />
                </div>
                <Button size="icon" className="w-14 h-14 rounded-full bg-primary text-primary-foreground shrink-0">
                    <FilterIcon />
                </Button>
            </div>
            
            <Card className="p-4 flex flex-col sm:flex-row items-center gap-4 rounded-3xl shadow-sm bg-accent border-none fade-in" style={{ animationDelay: '200ms' }}>
                <div className="relative w-40 h-32 sm:w-48 sm:h-40 flex-shrink-0 -mt-10 sm:-ml-8">
                    <Image 
                        src={'https://placehold.co/300x200.png'} 
                        alt={"Special Offer"} 
                        fill
                        className="object-contain"
                        data-ai-hint={"sneakers"}
                    />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <p className="font-bold text-lg">Good regulation</p>
                    <p className="text-sm">For Jan 2025</p>
                    <p className="font-extrabold text-4xl text-red-500 mt-1">50<span className='text-sm'>% OFF</span></p>
                    <Button className="rounded-full mt-2 bg-primary text-primary-foreground">I discover</Button>
                </div>
            </Card>

            <div className="space-y-4 fade-in" style={{ animationDelay: '300ms' }}>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Categories</h2>
                    <Link href="#" className="text-sm font-semibold text-muted-foreground">See all</Link>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                     <Button 
                        onClick={() => setSelectedCategory('all')} 
                        variant={selectedCategory === 'all' ? 'default' : 'secondary'}
                        className={cn(
                            'rounded-full px-5 h-11 whitespace-nowrap text-base font-bold',
                            selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                        )}
                    >
                        All
                    </Button>
                    {categories.map((cat) => (
                        <Button 
                            key={cat.id} 
                            onClick={() => setSelectedCategory(cat.name)}
                            variant={selectedCategory === cat.name ? 'default' : 'secondary'}
                            className={cn(
                                'rounded-full px-5 h-11 whitespace-nowrap text-base font-bold',
                                selectedCategory === cat.name ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                            )}
                        >
                            {cat.label}
                        </Button>
                    ))}
                </div>
            </div>
            
            <div className="space-y-4 fade-in" style={{ animationDelay: '400ms' }}>
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">New Catalogs</h2>
                    <Link href="#" className="text-sm font-semibold text-muted-foreground">See all</Link>
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
