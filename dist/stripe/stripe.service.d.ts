import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
type StripeData = {
    email: string;
    country: string;
    ip: string;
    firstName: string;
    lastName: string;
    address: string;
    postalCode: string;
    city: string;
    phone: string;
    dob: {
        day: number;
        month: number;
        year: number;
    };
};
type ExternalAccountType = {
    stripeId: string;
    fullName: string;
    country: string;
    currency: string;
    routingNumber: string;
    accountNumber: string;
};
export declare class StripeService {
    private readonly apiKey;
    private configService;
    stripe: Stripe;
    constructor(apiKey: string, configService: ConfigService);
    createStripeAccount(stripDto: StripeData): Promise<Stripe.Response<Stripe.Account>>;
    getStripeAccount(accountId: string): Promise<Stripe.Response<Stripe.Account>>;
    isHaveExternalBackAccount(accountId: string): Promise<boolean>;
    deleteStripeAccount(accountId: string): Promise<Stripe.Response<Stripe.DeletedAccount>>;
    createPaymentIntent(amount: number, customerEmail: string, currency: string, destinationAccountId: string, appFees: number): Promise<Stripe.Response<Stripe.PaymentIntent>>;
    getPaymentIntent(paymentIntentId: string): Promise<Stripe.Response<Stripe.PaymentIntent>>;
    completePayment(paymentIntentId: string): Promise<Stripe.Response<Stripe.PaymentIntent>>;
    createExternalAccount(account: ExternalAccountType): Promise<Stripe.Response<Stripe.ExternalAccount>>;
    getExternalAccount(accountId: string): Promise<Stripe.ExternalAccount>;
    deleteAllStripeAccount(): Promise<void[]>;
    checkEvent(body: string | Buffer, sig: string | string[], endpointSecret: string): Promise<Stripe.Event>;
    deleteExternalAccount(stripeId: string): Promise<Stripe.Response<Stripe.DeletedExternalAccount>>;
    updateDefaultCurrency(stripId: string, newCurrency: any): Promise<Stripe.Response<Stripe.Account>>;
    refundPayment(paymentIntentId: string): Promise<Stripe.Response<Stripe.Refund>>;
    listRefunds(limit?: number, startingAfter?: string): Promise<Stripe.Response<Stripe.ApiList<Stripe.Refund>>>;
    getRefundDetails(refundId: string): Promise<Stripe.Response<Stripe.Refund>>;
    uploadPassportPhoto(accountId: string, passportPhotoBuffer: Buffer, fileName?: string): Promise<Stripe.Response<Stripe.File>>;
}
export {};
