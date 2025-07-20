
import type { Banner } from '@/hooks/use-banners';

export let initialBanners: Banner[] = [
    {
      id: 'banner-1',
      title: 'Colección Verano Radiante',
      description: 'Descubre nuestros nuevos iluminadores y bronzers para un look de verano perfecto.',
      image: 'https://placehold.co/1200x600.png',
      aiHint: 'summer cosmetics',
    },
    {
      id: 'banner-2',
      title: 'Cuidado de la Piel Natural',
      description: 'Ingredientes puros para una piel sana y luminosa. ¡Explora nuestra línea de skincare!',
      image: 'https://placehold.co/1200x600.png',
      aiHint: 'natural skincare',
    },
    {
      id: 'banner-3',
      title: 'Labiales que Enamoran',
      description: 'Nuevos tonos mate y gloss para cada ocasión. Larga duración y colores vibrantes.',
      image: 'https://placehold.co/1200x600.png',
      aiHint: 'lipstick collection',
    },
];
