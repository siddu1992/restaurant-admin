import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface NewOrderEvent {
  _id: string;
  id?: string;
  totalAmount?: number;
  customer?: any;
  items?: any[];
  restaurant?: any;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket;
  private newOrders = new Subject<NewOrderEvent>();
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private joinedRestaurantId: string | null = null;

  constructor() {
    const url = environment.socketUrl || environment.apiBaseUrl || 'http://localhost:3000';

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Restaurant Admin connected to WebSocket server');
      this.connectionStatus.next(true);

      // Re-join restaurant room if we already had a restaurant ID
      if (this.joinedRestaurantId) {
        this.joinRestaurantRoom(this.joinedRestaurantId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Restaurant Admin disconnected from WebSocket server');
      this.connectionStatus.next(false);
    });

    this.socket.on('newOrder', (data: NewOrderEvent) => {
      console.log('🔔 New order event received via WebSocket:', data);
      this.newOrders.next(data);
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  joinRestaurantRoom(restaurantId: string) {
    if (!restaurantId) return;
    this.joinedRestaurantId = restaurantId;
    console.log(`🏬 Requesting room join for restaurant: ${restaurantId}`);
    this.socket.emit('joinRestaurant', restaurantId);
  }

  getNewOrderUpdates(): Observable<NewOrderEvent> {
    return this.newOrders.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  disconnect() {
    this.socket.disconnect();
  }
}
