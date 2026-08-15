import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly baseUrl = environment.apiBaseUrl || environment.baseUrl;

  constructor(private readonly http: HttpClient) {}

  async uploadRestaurantImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await firstValueFrom(
      this.http.post<{ url: string }>(`${this.baseUrl}/upload/restaurant-image`, formData),
    );
    return response.url;
  }

  async uploadFoodImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await firstValueFrom(
      this.http.post<{ url: string }>(`${this.baseUrl}/upload/food-image`, formData),
    );
    return response.url;
  }
}
