"use client";

import * as React from 'react';
import Image from 'next/image';
import { getProductRecommendations, type ProductRecommendationsInput, type ProductRecommendationsOutput } from '@/ai/flows/product-recommendations';
import type { Product } from '@/lib/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ShoppingBag, Eye, Bot, ThumbsUp } from 'lucide-react';

interface ProductRecommendationsProps {
  allProducts: Product[];
}

export function ProductRecommendations({ allProducts }: ProductRecommendationsProps) {
  const [viewedProductIds, setViewedProductIds] = React.useState<Set<string>>(new Set());
  const [purchasedProductIds, setPurchasedProductIds] = React.useState<Set<string>>(new Set());
  const [recommendations, setRecommendations] = React.useState<ProductRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleCheckboxChange = (
    productId: string,
    type: 'viewed' | 'purchased'
  ) => {
    const updater = type === 'viewed' ? setViewedProductIds : setPurchasedProductIds;
    updater(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setRecommendations(null);

    const input: ProductRecommendationsInput = {
      userProfile: {
        viewedProducts: allProducts.filter(p => viewedProductIds.has(p.id)).map(({ name, category, description }) => ({ name, category, description })),
        purchasedProducts: allProducts.filter(p => purchasedProductIds.has(p.id)).map(({ name, category, description }) => ({ name, category, description })),
      },
      availableProducts: allProducts.map(({ name, category, description }) => ({ name, category, description })),
      numberOfRecommendations: 3,
    };

    try {
      const result = await getProductRecommendations(input);
      setRecommendations(result);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast({
        title: "Error",
        description: "Could not fetch recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-accent" />
          <div>
            <CardTitle className="font-headline text-2xl md:text-3xl text-primary">AI Concierge</CardTitle>
            <CardDescription className="mt-1">Select products you've used to get personalized suggestions.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-headline text-lg mb-2 flex items-center gap-2"><Eye className="w-5 h-5" /> I've Viewed...</h3>
            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="space-y-2 p-2">
                {allProducts.map(product => (
                  <div key={`viewed-${product.id}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`viewed-${product.id}`}
                      onCheckedChange={() => handleCheckboxChange(product.id, 'viewed')}
                    />
                    <Label htmlFor={`viewed-${product.id}`} className="font-normal">{product.name}</Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div>
            <h3 className="font-headline text-lg mb-2 flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> I've Purchased...</h3>
            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="space-y-2 p-2">
                {allProducts.map(product => (
                  <div key={`purchased-${product.id}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`purchased-${product.id}`}
                      onCheckedChange={() => handleCheckboxChange(product.id, 'purchased')}
                    />
                    <Label htmlFor={`purchased-${product.id}`} className="font-normal">{product.name}</Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={handleGetRecommendations} disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Bot className="mr-2 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <ThumbsUp className="mr-2" />
                Get Recommendations
              </>
            )}
          </Button>
        </div>

        {isLoading && (
          <div className="mt-8">
            <h3 className="text-2xl font-headline mb-4 text-center">Finding your perfect match...</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader><Skeleton className="h-32 w-full" /></CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {recommendations?.recommendations && recommendations.recommendations.length > 0 && (
          <div className="mt-8">
            <h3 className="text-2xl md:text-3xl font-headline mb-6 text-center">Specially For You</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.recommendations.map((rec, index) => {
                const fullProduct = allProducts.find(p => p.name === rec.product.name);
                return (
                  <Card key={index} className="flex flex-col animate-in fade-in-0 slide-in-from-bottom-5 duration-500">
                    <CardHeader className="p-0 border-b">
                      {fullProduct && <Image src={fullProduct.image} alt={rec.product.name} width={200} height={200} className="w-full h-auto object-cover aspect-square" />}
                    </CardHeader>
                    <CardContent className="p-4 flex-grow">
                      <h4 className="font-headline text-lg">{rec.product.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{rec.product.category}</p>
                      <div className="space-y-1">
                         <Label className="text-xs">Match Score: {Math.round(rec.matchScore * 100)}%</Label>
                         <Progress value={rec.matchScore * 100} className="h-2" />
                      </div>
                    </CardContent>
                    <Accordion type="single" collapsible className="w-full px-4 pb-4">
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-sm">Why you'll love it</AccordionTrigger>
                        <AccordionContent className="text-sm">{rec.reason}</AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
