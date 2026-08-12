export interface Restaurant {
  _id: string;
  name: string;
  address: string;
  cuisine: string;
  image: string;
  rating: number;
  deliveryTime: string;
  minOrder: number;
  description?: string;
  owner: string;
  foodItems: string[];
  latitude: number;
  longitude: number;
  pincode?: string;
  available?: boolean;
  averagePrepTime?: number;
}

export interface CreateRestaurantRequest {
  name: string;
  address: string;
  cuisine: string;
  description?: string;
  deliveryTime: string;
  minOrder: number;
  latitude: number;
  longitude: number;
  pincode: string;
  owner: string;
  image?: string;
}

export interface UpdateRestaurantRequest {
  name?: string;
  address?: string;
  cuisine?: string;
  description?: string;
  deliveryTime?: string;
  minOrder?: number;
  latitude?: number | null;
  longitude?: number | null;
  pincode?: string;
  image?: string;
  available?: boolean;
}
