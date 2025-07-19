
export type Product = {
  id: string;
  created_at?: string;
  name: string;
  image: string;
  aiHint?: string;
  price: number;
  original_price?: number;
  description: string;
  category: string; 
  stock: number;
  featured?: boolean;
}

// This type is used for form submissions, which might include a File object
// that is not part of the final Product type stored in the DB.
export type UploadProductData = Omit<Product, 'id' | 'created_at'> & {
  imageFile?: File;
};


// This file now only contains the type definition and initial data for local mode.
export const products: Product[] = [
    {
      "id": "prod_1",
      "name": "Suero Facial Hidratante con Ácido Hialurónico",
      "image": "https://placehold.co/400x400.png",
      "aiHint": "skincare serum",
      "price": 650,
      "original_price": 750,
      "description": "Un suero ligero que repone la hidratación y restaura la luminosidad para una piel de aspecto saludable.",
      "category": "skincare",
      "stock": 50,
      "featured": true
    },
    {
      "id": "prod_2",
      "name": "Base de Maquillaje Cobertura Total Mate",
      "image": "https://placehold.co/400x400.png",
      "aiHint": "makeup foundation",
      "price": 850,
      "description": "Fórmula de larga duración que proporciona un acabado mate impecable sin resecar la piel.",
      "category": "makeup",
      "stock": 30
    },
    {
      "id": "prod_3",
      "name": "Aceite Capilar Reparador con Argán",
      "image": "https://placehold.co/400x400.png",
      "aiHint": "hair oil",
      "price": 550,
      "description": "Nutre y repara el cabello dañado, dejándolo suave, brillante y sin frizz.",
      "category": "hair",
      "stock": 40
    },
    {
      "id": "prod_4",
      "name": "Crema Corporal Reafirmante con Colágeno",
      "image": "https://placehold.co/400x400.png",
      "aiHint": "body cream",
      "price": 720,
      "description": "Mejora la elasticidad y firmeza de la piel con esta crema de rápida absorción.",
      "category": "body",
      "stock": 60
    },
    {
      "id": "prod_5",
      "name": "Limpiador Facial Suave con Té Verde",
      "image": "https://placehold.co/400x400.png",
      "aiHint": "facial cleanser",
      "price": 480,
      "description": "Elimina impurezas sin alterar la barrera natural de la piel, ideal para todo tipo de piel.",
      "category": "skincare",
      "stock": 70,
       "featured": true
    },
    {
      "id": "prod_6",
      "name": "Paleta de Sombras 'Atardecer Dorado'",
      "image": "https://placehold.co/400x400.png",
      "aiHint": "eyeshadow palette",
      "price": 950,
      "original_price": 1100,
      "description": "12 tonos cálidos y vibrantes con acabados mate y satinado para looks espectaculares.",
      "category": "makeup",
      "stock": 25,
      "featured": true
    },
    {
      "id": "prod_7",
      "name": "Mascarilla Capilar Intensiva de Keratina",
      "image": "https://placehold.co/400x400.png",
      "aiHint": "hair mask",
      "price": 680,
      "description": "Tratamiento semanal para fortalecer y revitalizar el cabello débil y quebradizo.",
      "category": "hair",
      "stock": 35
    },
    {
      "id": "prod_8",
      "name": "Exfoliante Corporal de Azúcar y Café",
      "image": "https://placehold.co/400x400.png",
      "aiHint": "body scrub",
      "price": 520,
      "description": "Renueva tu piel, dejándola increíblemente suave y energizada.",
      "category": "body",
      "stock": 0
    }
];
