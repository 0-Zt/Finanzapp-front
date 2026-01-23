import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TransactionEventsService {
  private readonly transactionCreated = new Subject<void>();
  private readonly transactionUpdated = new Subject<void>();

  readonly transactionCreated$ = this.transactionCreated.asObservable();
  readonly transactionUpdated$ = this.transactionUpdated.asObservable();

  emitTransactionCreated(): void {
    this.transactionCreated.next();
  }

  emitTransactionUpdated(): void {
    this.transactionUpdated.next();
  }
}
