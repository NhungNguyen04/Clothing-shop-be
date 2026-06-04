import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';

type OrderDraftInput = {
  userId: string;
  sellerId: string;
  phoneNumber: string;
  address: string;
  postalCode?: string | null;
  paymentMethod?: PaymentMethod | string;
  totalPrice: number;
};

export class OrderDraftBuilder {
  private draft: Partial<Prisma.OrderUncheckedCreateInput> = {
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
  };

  static from(input: OrderDraftInput): OrderDraftBuilder {
    return new OrderDraftBuilder()
      .forCustomer(input.userId)
      .forSeller(input.sellerId)
      .withContact(input.phoneNumber, input.address, input.postalCode)
      .withPaymentMethod(input.paymentMethod)
      .withTotalPrice(input.totalPrice);
  }

  forCustomer(userId: string): this {
    this.draft.userId = userId;
    return this;
  }

  forSeller(sellerId: string): this {
    this.draft.sellerId = sellerId;
    return this;
  }

  withContact(phoneNumber: string, address: string, postalCode?: string | null): this {
    this.draft.phoneNumber = phoneNumber;
    this.draft.address = address;
    this.draft.postalCode = postalCode ?? undefined;
    return this;
  }

  withPaymentMethod(paymentMethod?: PaymentMethod | string): this {
    this.draft.paymentMethod = (paymentMethod ?? PaymentMethod.COD) as PaymentMethod;
    return this;
  }

  withTotalPrice(totalPrice: number): this {
    this.draft.totalPrice = totalPrice;
    return this;
  }

  build(): Prisma.OrderUncheckedCreateInput {
    const requiredFields: Array<keyof Prisma.OrderUncheckedCreateInput> = [
      'userId',
      'sellerId',
      'phoneNumber',
      'address',
      'paymentMethod',
      'totalPrice',
      'status',
      'paymentStatus',
    ];

    const missingField = requiredFields.find((field) => this.draft[field] === undefined);
    if (missingField) {
      throw new Error(`Cannot build order draft without ${String(missingField)}`);
    }

    return this.draft as Prisma.OrderUncheckedCreateInput;
  }
}
