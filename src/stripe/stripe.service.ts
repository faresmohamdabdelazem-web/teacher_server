import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
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
  dob: { day: number; month: number; year: number };
};

type ExternalAccountType = {
  stripeId: string;
  fullName: string;
  country: string;
  currency: string;
  routingNumber: string;
  accountNumber: string;
};
@Injectable()
export class StripeService {
  stripe: Stripe;
  constructor(
    @Inject('STRIPE_API_KEY') private readonly apiKey: string,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(apiKey);
  }

  async createStripeAccount(stripDto: StripeData) {
    try {
      const {
        email,
        country,
        ip,
        firstName,
        lastName,
        address,
        postalCode,
        city,
        phone,
        dob,
      } = stripDto;
      let service_agreement = undefined;

      country !== 'us' && country !== 'US'
        ? (service_agreement = 'recipient')
        : (service_agreement = 'full');

      let product_description =
        this.configService.get<string>('PRODUCT_DES_US')! || 'test test test';

      country !== 'us' && country !== 'US'
        ? (product_description = undefined)
        : product_description;

      return await this.stripe.accounts.create({
        type: 'custom',
        email,
        country,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          name: firstName + ' ' + lastName,
          product_description,
        },
        tos_acceptance: {
          service_agreement,
          date: Math.ceil(Date.now() / 1000),
          ip,
        },
        individual: {
          first_name: firstName,
          last_name: lastName,
          address: {
            line1: address,
            postal_code: postalCode,
            city: city,
          },
          email,
          phone,
          dob,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async getStripeAccount(accountId: string) {
    try {
      return await this.stripe.accounts.retrieve(accountId);
    } catch (error) {
      throw error;
    }
  }

  async isHaveExternalBackAccount(accountId: string) {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return account.external_accounts.data.length > 0;
    } catch (error) {
      throw error;
    }
  }

  async deleteStripeAccount(accountId: string) {
    return await this.stripe.accounts.del(accountId);
  }

  /**
   * Creates a new payment intent using Stripe API.
   *
   * @param {number} amount - The amount to be charged, in the smallest currency unit (e.g., cents for USD).
   * @param {string} customerEmail - The email address of the customer.
   * @param {string} currency - The currency in which the payment is to be made (e.g., 'usd').
   * @param {string} destinationAccountId - The Stripe account ID of the destination account.
   * @param {number} appFees - The application fee amount to be charged, in the smallest currency unit.
   * @returns {Promise<Stripe.PaymentIntent>} - A promise that resolves to the created payment intent object.
   * @throws {Error} - Throws an error if the payment intent creation fails.
   */
  async createPaymentIntent(
    amount: number,
    customerEmail: string,
    currency: string,
    destinationAccountId: string,
    appFees: number,
  ) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        receipt_email: customerEmail,
        application_fee_amount: Math.round(appFees * 100),
        transfer_data: {
          destination: destinationAccountId,
        },
        payment_method_types: ['card'], // Only allow card payments
        capture_method: 'manual', // Hold funds without capturing immediately
        automatic_payment_methods: {
          enabled: false,
        },
      });
      return paymentIntent;
    } catch (error) {
      Logger.error(`Error creating payment intent`);
      throw error;
    }
  }

  async getPaymentIntent(paymentIntentId: string) {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      Logger.error(`Error getting payment intent`);
      throw error;
    }
  }

  /**
   * Completes the payment by capturing the held funds for the specified payment intent.
   *
   * @param paymentIntentId - The ID of the payment intent to capture.
   * @returns A promise that resolves with the captured payment intent details.
   * @throws Will throw an error if the payment capture fails.
   */
  async completePayment(paymentIntentId: string) {
    try {
      // Confirm the payment intent to capture the held funds
      return await this.stripe.paymentIntents.capture(paymentIntentId);
    } catch (error) {
      Logger.error(`Error completing payment and transferring funds: ${error}`);
      throw error;
    }
  }

  async createExternalAccount(account: ExternalAccountType) {
    try {
      const {
        stripeId,
        fullName,
        country,
        currency,
        routingNumber,
        accountNumber,
      } = account;

      return await this.stripe.accounts.createExternalAccount(stripeId, {
        external_account: {
          object: 'bank_account',
          country,
          currency,
          account_holder_name: fullName,
          account_holder_type: 'individual',
          routing_number: routingNumber,
          account_number: accountNumber,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async getExternalAccount(accountId: string) {
    try {
      const externalAccounts =
        await this.stripe.accounts.listExternalAccounts(accountId);
      return externalAccounts.data[0];
    } catch (error) {
      throw error;
    }
  }

  async deleteAllStripeAccount() {
    const accountList = await this.stripe.accounts.list();

    if (accountList.data.length == 0) {
      return;
    }

    const delPromises = accountList.data.map((acc) => {
      this.stripe.accounts.del(acc.id);
    });

    return await Promise.all(delPromises);
  }

  async checkEvent(
    body: string | Buffer,
    sig: string | string[],
    endpointSecret: string,
  ) {
    try {
      return this.stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (error) {
      Logger.error('Error in stripe webhook', error);
      throw new InternalServerErrorException('Error in stripe webhook');
    }
  }

  async deleteExternalAccount(stripeId: string) {
    const account = await this.stripe.accounts.retrieve(stripeId);
    if (!account.external_accounts.data.length) {
      throw new ConflictException(
        'No external account found for the given account',
      );
    }
    return await this.stripe.accounts.deleteExternalAccount(
      stripeId,
      account.external_accounts.data[0].id,
    );
  }
  async updateDefaultCurrency(stripId: string, newCurrency) {
    return await this.stripe.accounts.update(stripId, {
      default_currency: newCurrency,
    });
  }

  async refundPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (!paymentIntent) {
        throw new BadRequestException('Payment intent not found');
      }

      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException('Payment must be successful to be refunded');
      }

      return await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
      });
    } catch (error) {
      Logger.error(`Error refunding payment: ${error}`);
      throw error;
    }
  }

  async listRefunds(limit: number = 10, startingAfter?: string) {
    try {
      const refunds = await this.stripe.refunds.list({
        limit,
        starting_after: startingAfter,
      });
      return refunds;
    } catch (error) {
      Logger.error('Error listing refunds:', error);
      throw new InternalServerErrorException('Failed to list refunds');
    }
  }

  async getRefundDetails(refundId: string) {
    try {
      const refund = await this.stripe.refunds.retrieve(refundId);
      return refund;
    } catch (error) {
      Logger.error('Error retrieving refund details:', error);
      throw new InternalServerErrorException('Failed to retrieve refund details');
    }
  }

  /**
   * Uploads a passport photo to a Stripe account for identity verification.
   * 
   * @param accountId - The Stripe account ID
   * @param passportPhotoBuffer - The passport photo as a Buffer
   * @param fileName - The filename for the uploaded file
   * @returns A promise that resolves with the uploaded file details
   * @throws Will throw an error if the file upload fails
   */
  async uploadPassportPhoto(
    accountId: string,
    passportPhotoBuffer: Buffer,
    fileName: string = 'passport_photo.jpg'
  ) {
    try {
      // Create a file upload to Stripe
      const file = await this.stripe.files.create({
        file: {
          data: passportPhotoBuffer,
          name: fileName,
          type: 'image/jpeg',
        },
        purpose: 'identity_document',
      });

      // Attach the file to the account for identity verification
      await this.stripe.accounts.update(accountId, {
        individual: {
          verification: {
            document: {
              front: file.id,
            },
          },
        },
      });

      Logger.log(`Passport photo uploaded successfully for account ${accountId}`);
      return file;
    } catch (error) {
      Logger.error(`Error uploading passport photo to Stripe: ${error}`);
      throw new InternalServerErrorException('Failed to upload passport photo to Stripe');
    }
  }
}
