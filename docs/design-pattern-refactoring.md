# Design Pattern Refactoring Report

## Summary

Initial architecture assessment completed before code changes.

Applied patterns planned for this codebase:

- Factory Method: payment gateway creation in the payment module.
- Builder: order creation payload construction shared by direct order and cart checkout flows.
- Strategy: seller report time-range and revenue grouping rules.
- State: order status transition and cancellation rules.
- Observer/Event: notification side effects emitted from order and payment workflows.

The backend is a NestJS application using Prisma directly from services. Most controllers are CRUD wrappers and should not receive extra pattern layers. The valuable refactoring targets are concentrated in `order`, `payment`, `notification`, and `sellerReport`.

## Factory Method

### Reason

The payment module has a hardcoded VNPAY client inside `PaymentService`. Payment methods are already modeled as runtime values (`COD`, `VIETQR`, `VNPAY`), so gateway creation should be isolated behind a factory before additional providers add service-level branching.

### Files Modified

Planned:

- `src/payment/payment-gateway.interface.ts`
- `src/payment/vnpay-payment.gateway.ts`
- `src/payment/payment-gateway.factory.ts`
- `src/payment/payment.service.ts`
- `src/payment/payment.module.ts`
- `src/payment/payment-gateway.factory.spec.ts`

### Before

`PaymentService` directly constructed the VNPay SDK client in its constructor and owned provider-specific URL building and callback verification.

### After

Planned: provider-specific gateway creation will move to a factory. `PaymentService` remains the public API and delegates provider behavior to the selected gateway.

## Builder

### Reason

Order creation constructs Prisma order data in multiple places, repeating fields such as buyer/seller/contact/payment/status/total. The object has several optional fields and default values (`postalCode`, `paymentMethod`, initial statuses), making a small builder useful.

### Files Modified

Planned:

- `src/order/builders/order-draft.builder.ts`
- `src/order/order.service.ts`
- `src/order/builders/order-draft.builder.spec.ts`

### Before

Direct order creation and cart checkout both assembled Prisma order payloads inline.

### After

Planned: both flows will use a shared builder that preserves the existing defaults and output shape.

## Strategy

### Reason

`SellerReportService` contains switch statements for time range selection and period grouping. These are business algorithms selected by runtime values and are good Strategy candidates.

### Files Modified

Planned:

- `src/sellerReport/strategies/report-date-range.strategy.ts`
- `src/sellerReport/strategies/revenue-grouping.strategy.ts`
- `src/sellerReport/sellerReport.service.ts`
- `src/sellerReport/strategies/report-strategies.spec.ts`

### Before

Report date ranges and revenue period keys were selected with switch statements inside the service.

### After

Planned: strategies will encapsulate the algorithms and the service will select them by key.

## State

### Reason

Order behavior changes based on `OrderStatus`. `updateStatus` and `cancelOrder` encode this with conditional/switch logic that should live with explicit state objects.

### Files Modified

Planned:

- `src/order/state/order-state.interface.ts`
- `src/order/state/order-state.factory.ts`
- `src/order/order.service.ts`
- `src/order/state/order-state.factory.spec.ts`

### Before

`OrderService` switched on `order.status` to decide the next status and checked status combinations for cancellation.

### After

Planned: state classes will own transition and cancellation rules, and `OrderService` will delegate decisions.

## Observer/Event

### Reason

Order and payment workflows create notifications directly. Multiple side effects already react to the same business events: seller notification, customer order confirmation, status update, cancellation, and payment success. Moving these to observers reduces coupling while preserving synchronous behavior.

### Files Modified

Planned:

- `src/events/domain-event.interface.ts`
- `src/events/domain-event-publisher.service.ts`
- `src/events/events.module.ts`
- `src/notification/observers/order-notification.observer.ts`
- `src/notification/observers/payment-notification.observer.ts`
- `src/order/order.service.ts`
- `src/payment/payment.service.ts`
- `src/app.module.ts`
- `src/events/domain-event-publisher.service.spec.ts`

### Before

`OrderService` and `PaymentService` directly created notification rows as part of their workflows.

### After

Planned: services will publish domain events. Notification observers will subscribe and perform the same notification writes.

## Rejected Patterns

- Factory Method for every Prisma model service: rejected because CRUD service construction is not runtime-variable.
- Builder for simple DTOs such as address, review, and shipment: rejected because their construction is straightforward and schema validation already keeps it readable.
- Strategy for ordinary validation and exception handling: rejected because Zod schemas and Nest exceptions are already appropriate.
- State for seller approval status: rejected because current behavior only updates a stored value; there is no meaningful status-dependent behavior beyond equality checks.
- Observer/Event for reporting and read-only queries: rejected because there are no side effects to decouple.
- Repository pattern: rejected because Prisma is already used consistently as the data mapper and introducing repositories would be a broad compatibility risk without solving the identified problems.
