import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonApp, IonRouterOutlet, AlertController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WebSocketService, NewOrderEvent } from './services/websocket.service';
import { RestaurantContextService } from './core/restaurant-context.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  private subs = new Subscription();

  constructor(
    private readonly wsService: WebSocketService,
    private readonly restaurantContext: RestaurantContextService,
    private readonly alertController: AlertController,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.subs.add(
      this.restaurantContext.restaurant$.subscribe((restaurant) => {
        if (restaurant?._id) {
          this.wsService.joinRestaurantRoom(restaurant._id);
        }
      })
    );

    const activeRest = this.restaurantContext.selectedRestaurant;
    if (activeRest?._id) {
      this.wsService.joinRestaurantRoom(activeRest._id);
    }

    this.subs.add(
      this.wsService.getNewOrderUpdates().subscribe((order) => {
        void this.handleNewOrderAlert(order);
      })
    );
  }
 
  ngOnDestroy() {
    this.subs.unsubscribe();
    console.log('AppComponent destroyed, unsubscribed from all subscriptions.');
  }

  private async handleNewOrderAlert(order: NewOrderEvent) {
    this.playChimeSound();

    const orderNum = (order._id || order.id || '').slice(-6).toUpperCase();
    const amountStr = order.totalAmount ? `₹${order.totalAmount}` : '';
    const itemCount = order.items?.length || 1;

    const alert = await this.alertController.create({
      header: '🔔 NEW ORDER RECEIVED!',
      subHeader: `Order #${orderNum} ${amountStr ? '• ' + amountStr : ''}`,
      message: `A customer has just placed a new order containing ${itemCount} item(s). Click 'View Orders' to start preparing!`,
      cssClass: 'new-order-alert',
      backdropDismiss: false,
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel',
        },
        {
          text: 'View Orders ➔',
          handler: () => {
            void this.router.navigate(['/orders']);
          },
        },
      ],
    });

    await alert.present();
  }

  private playChimeSound() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Note 1: E5
      const osc1 = audioCtx.createOscillator();
      const g1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      g1.gain.setValueAtTime(0.3, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(g1);
      g1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Note 2: G#5
      const osc2 = audioCtx.createOscillator();
      const g2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(830.61, now + 0.15);
      g2.gain.setValueAtTime(0.4, now + 0.15);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(g2);
      g2.connect(audioCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.log('Chime sound error:', e);
    }
  }
}
