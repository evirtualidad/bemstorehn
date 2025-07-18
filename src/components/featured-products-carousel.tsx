
'use client';

import * as React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { ProductGridHomepage } from './product-grid-homepage';
import { Product } from '@/lib/products';

export function FeaturedProductsCarousel({ products }: { products: Product[] }) {
    if (products.length === 0) return null;

    const autoplayPlugin = React.useRef(
        Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
    );

    return (
        <section className="py-12 md:py-20 bg-gradient-to-b from-primary-light to-background">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-12 text-primary">Nuestras Mejores Ofertas</h2>
                <Carousel
                    opts={{
                        align: 'start',
                        loop: products.length > 4,
                    }}
                    plugins={[autoplayPlugin.current]}
                    className="w-full"
                >
                    <CarouselContent>
                        {products.map((product) => (
                            <CarouselItem key={product.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
                                <ProductGridHomepage.Card product={product} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
}
