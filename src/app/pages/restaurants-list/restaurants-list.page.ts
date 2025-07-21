import { Component, OnInit } from '@angular/core';
import { ApiService, Restaurant } from '../../services/api.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-restaurants-list',
  templateUrl: './restaurants-list.page.html',
  styleUrls: ['./restaurants-list.page.scss'],
  standalone: true,
  providers: [ApiService],
  imports: [IonicModule, CommonModule, HttpClientModule]
})
export class RestaurantsListPage implements OnInit {
  restaurants: Restaurant[] = [];
  isLoading = true;

  constructor(private apiService: ApiService, public router: Router) {}

  ngOnInit() {
    const owner = JSON.parse(localStorage.getItem('authUser') || '{}');
    this.apiService.getRestaurantByOwner(owner.id).subscribe(restaurant => {
        if (restaurant && restaurant.length>0) {
          this.restaurants = restaurant;
        } else {
          this.router.navigate(['/add-restaurant']);
        }
      });
  }

  goToDashboard(restaurant: Restaurant) {
    localStorage.setItem('selectedRestaurant', JSON.stringify(restaurant));
    this.router.navigate(['/dashboard']);
  }
} 