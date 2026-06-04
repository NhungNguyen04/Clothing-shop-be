# Design Pattern Refactoring Report

## Summary

Applied patterns:

- Factory Method for external payment gateway creation.
- Builder for shared order creation payload construction.
- Strategy for seller report date range and revenue grouping algorithms.
- State for order lifecycle transition and cancellation rules.
- Observer/Event for order and payment notification side effects.

Additional verification support:

- Added Jest alias mapping for the existing `@/...` TypeScript path alias.
- Updated affected Nest smoke specs with the minimal providers required by the refactored dependency graph.

## Factory Method

### Reason

`PaymentService` directly instantiated and used the VNPay SDK. Payment methods already vary at runtime through `PaymentMethod`, and more external gateways would have added branching to the service. A gateway factory keeps provider object creation isolated while preserving the existing public payment API.

### Files Modified

- `src/payment/payment-gateway.interface.ts`
- `src/payment/vnpay-payment.gateway.ts`
- `src/payment/payment-gateway.factory.ts`
- `src/payment/payment.service.ts`
- `src/payment/payment.module.ts`
- `src/payment/payment-gateway.factory.spec.ts`

### Before

`PaymentService` constructed `VNPay` in its constructor and embedded VNPay-specific URL building and callback verification directly in service methods.

### After

`PaymentGatewayFactory` creates a `PaymentGateway` for runtime payment methods. `VnpayPaymentGateway` owns VNPay SDK configuration, payment URL building, and callback verification. `PaymentService` remains the compatibility facade for existing controllers.

## Builder

### Reason

Direct order creation and cart checkout both assembled Prisma order create payloads inline. The payload has several defaulted or optional fields: payment method, payment status, order status, postal code, and total price. A focused builder removes duplication without changing the transaction workflow.

### Files Modified

- `src/order/builders/order-draft.builder.ts`
- `src/order/builders/order-draft.builder.spec.ts`
- `src/order/order.service.ts`

### Before

`OrderService.create` and `OrderService.createFromCart` repeated order data construction with the same default values.

### After

`OrderDraftBuilder` centralizes order draft construction and default values. Both order creation flows call the builder and continue to create order items, shipments, and stock updates as before.

## Strategy

### Reason

`SellerReportService` selected date range and revenue grouping behavior through switch statements. These are runtime-selected algorithms, so Strategy improves extension points without adding database or controller churn.

### Files Modified

- `src/sellerReport/strategies/report-date-range.strategy.ts`
- `src/sellerReport/strategies/revenue-grouping.strategy.ts`
- `src/sellerReport/strategies/report-strategies.spec.ts`
- `src/sellerReport/sellerReport.service.ts`

### Before

Report start dates, sampling intervals, and revenue period keys were calculated inside `SellerReportService` switch blocks.

### After

Report date range and grouping strategies encapsulate those algorithms. `SellerReportService` delegates to the selected strategy and keeps its response shape unchanged.

## State

### Reason

Order behavior changes according to `OrderStatus`: pending orders ship, shipped orders deliver, delivered/cancelled orders are terminal, and terminal orders cannot be cancelled. This status-dependent behavior belongs in explicit state objects.

### Files Modified

- `src/order/state/order-state.interface.ts`
- `src/order/state/order-state.factory.ts`
- `src/order/state/order-state.factory.spec.ts`
- `src/order/order.service.ts`

### Before

`OrderService.updateStatus` used a switch on `order.status`, and `cancelOrder` checked terminal statuses inline.

### After

`OrderStateFactory` resolves the current state object. State classes own transition and cancellation rules, while `OrderService` applies the returned decision inside the existing transaction flow.

## Observer/Event

### Reason

Order and payment workflows directly created notifications. Notifications are side effects of business events, and several workflows may eventually need more reactions such as email, analytics, or websocket broadcasts. A small synchronous domain event publisher decouples event emission from notification handling without adding a new dependency.

### Files Modified

- `src/events/domain-event.interface.ts`
- `src/events/domain-event-publisher.service.ts`
- `src/events/events.module.ts`
- `src/events/domain-event-publisher.service.spec.ts`
- `src/notification/observers/order-notification.observer.ts`
- `src/notification/observers/payment-notification.observer.ts`
- `src/notification/notification.module.ts`
- `src/order/order.module.ts`
- `src/order/order.service.ts`
- `src/payment/payment.module.ts`
- `src/payment/payment.service.ts`

### Before

`OrderService` and `PaymentService` called notification creation directly after order creation, status updates, cancellation, and successful payment callbacks.

### After

Services publish domain events such as `order.placed`, `order.confirmed`, `order.status.advanced`, `order.cancelled`, and `payment.succeeded`. Notification observers subscribe to those events and create the same notification messages as before.

## Rejected Patterns

- Factory Method for every Prisma service: rejected because CRUD service creation is static and Nest dependency injection already handles object creation.
- Builder for simple DTOs such as address, review, shipment, and notification: rejected because schemas and method calls are already clear.
- Strategy for validation: rejected because Zod schemas already express validation rules cleanly.
- State for seller approval: rejected because the current seller status behavior is just storage/equality checks, not state-specific behavior.
- Observer/Event for read-only reporting: rejected because reports have no side effects to decouple.
- Repository pattern: rejected because Prisma is already the data mapper, and introducing repositories would be broad churn unrelated to the identified pain points.

## Tests

- `npm test -- --runInBand`
- Result: 12 test suites passed, 20 tests passed.

## Risks Introduced

- The in-process event publisher is synchronous. This preserves existing behavior, but long-running observers would slow the originating request.
- Notification observers depend on Nest module initialization. If a new module publishes events without importing `EventsModule`, events will not be available for injection.
- Payment gateway support is intentionally limited to VNPAY because COD and VIETQR do not currently use external gateway clients.

## Future Refactoring Recommendations

- Move direct Prisma imports behind injectable data services only where testability or transaction boundaries require it.
- Replace placeholder/mock seller report history generation with persisted inventory and sales history tables.
- Add real integration tests for order checkout, payment callback, and notification observer flows.
- Consider `@nestjs/event-emitter` only if asynchronous or cross-module event handling grows beyond the current lightweight publisher.
