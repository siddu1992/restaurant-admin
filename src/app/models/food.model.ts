export interface Food {
  _id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  available?: boolean;
  restaurant: string;
  quantity?: number;
}

export interface CreateFoodRequest {
  name: string;
  description: string;
  price: number;
  image?: string;
  available?: boolean;
  restaurant: string;
  category: string;
}

export interface UpdateFoodRequest {
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  available?: boolean;
  category?: string;
  restaurant?: string;
}
