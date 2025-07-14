
'use client';

import * as React from 'react';
import { useProductsStore } from '@/hooks/use-products';
import { Input } from '@/components/ui/input';
import { type Product } from '@/lib/products';
import Image from 'next/image';
import { Search } from 'lucide-react';

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
}

export function ProductSearch({ onProductSelect }: ProductSearchProps) {
  const { products } = useProductsStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<Product[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(lowerCaseQuery)
      );
      setResults(filteredProducts);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [searchQuery, products]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  const handleSelect = (product: Product) => {
    onProductSelect(product);
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={searchContainerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar producto por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setIsOpen(true)}
          className="pl-10"
        />
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
          <ul className="max-h-60 overflow-y-auto">
            {results.map((product) => (
              <li
                key={product.id}
                className="flex items-center gap-4 p-2 cursor-pointer hover:bg-accent"
                onClick={() => handleSelect(product)}
              >
                <div className="relative h-10 w-10 flex-shrink-0">
                  <Image
                    src={product.image || 'https://placehold.co/100x100.png'}
                    alt={product.name}
                    fill
                    className="object-cover rounded-sm"
                  />
                </div>
                <div className="flex-grow">
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ${product.price.toFixed(2)} - Stock: {product.stock}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

    