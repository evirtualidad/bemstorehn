
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Banner {
  id: string;
  title: string;
  description: string;
  image: string;
  aiHint?: string;
}

const initialBanners: Banner[] = [
    {
      id: 'banner_1',
      title: 'Belleza en su Forma más Pura',
      description: 'Descubre nuestra colección exclusiva de cosméticos, elaborados con los mejores ingredientes naturales.',
      image: 'https://placehold.co/1200x600.png',
      aiHint: 'cosmetics flatlay',
    },
    {
      id: 'banner_2',
      title: 'Novedades de Skincare',
      description: 'Renueva tu piel con nuestros últimos lanzamientos. Fórmulas potentes para resultados visibles.',
      image: 'https://placehold.co/1200x600.png',
      aiHint: 'skincare products',
    },
    {
      id: 'banner_3',
      title: 'Esenciales de Maquillaje',
      description: 'Colores vibrantes y texturas que te encantarán. Encuentra tus nuevos favoritos.',
      image: 'https://placehold.co/1200x600.png',
      aiHint: 'makeup collection',
    },
];

type BannersState = {
  banners: Banner[];
  addBanner: (banner: Banner) => void;
  updateBanner: (banner: Banner) => void;
  deleteBanner: (bannerId: string) => void;
};

export const useBannersStore = create<BannersState>()(
  persist(
    (set) => ({
      banners: initialBanners,
      addBanner: (banner) => {
        set((state) => ({ banners: [banner, ...state.banners] }));
      },
      updateBanner: (banner) => {
        set((state) => ({
          banners: state.banners.map((b) =>
            b.id === banner.id ? banner : b
          ),
        }));
      },
      deleteBanner: (bannerId) => {
        set((state) => ({
          banners: state.banners.filter((b) => b.id !== bannerId),
        }));
      },
    }),
    {
      name: 'banners-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
