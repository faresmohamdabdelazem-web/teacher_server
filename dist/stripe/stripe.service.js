"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const stripe_1 = __importDefault(require("stripe"));
const config_1 = require("@nestjs/config");
let StripeService = class StripeService {
    constructor(apiKey, configService) {
        this.apiKey = apiKey;
        this.configService = configService;
        this.stripe = new stripe_1.default(apiKey);
    }
    async createStripeAccount(stripDto) {
        try {
            const { email, country, ip, firstName, lastName, address, postalCode, city, phone, dob, } = stripDto;
            let service_agreement = undefined;
            country !== 'us' && country !== 'US'
                ? (service_agreement = 'recipient')
                : (service_agreement = 'full');
            let product_description = this.configService.get('PRODUCT_DES_US') || 'test test test';
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
        }
        catch (error) {
            throw error;
        }
    }
    async getStripeAccount(accountId) {
        try {
            return await this.stripe.accounts.retrieve(accountId);
        }
        catch (error) {
            throw error;
        }
    }
    async isHaveExternalBackAccount(accountId) {
        try {
            const account = await this.stripe.accounts.retrieve(accountId);
            return account.external_accounts.data.length > 0;
        }
        catch (error) {
            throw error;
        }
    }
    async deleteStripeAccount(accountId) {
        return await this.stripe.accounts.del(accountId);
    }
    async createPaymentIntent(amount, customerEmail, currency, destinationAccountId, appFees) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency,
                receipt_email: customerEmail,
                application_fee_amount: Math.round(appFees * 100),
                transfer_data: {
                    destination: destinationAccountId,
                },
                payment_method_types: ['card'],
                capture_method: 'manual',
                automatic_payment_methods: {
                    enabled: false,
                },
            });
            return paymentIntent;
        }
        catch (error) {
            common_1.Logger.error(`Error creating payment intent`);
            throw error;
        }
    }
    async getPaymentIntent(paymentIntentId) {
        try {
            return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        }
        catch (error) {
            common_1.Logger.error(`Error getting payment intent`);
            throw error;
        }
    }
    async completePayment(paymentIntentId) {
        try {
            return await this.stripe.paymentIntents.capture(paymentIntentId);
        }
        catch (error) {
            common_1.Logger.error(`Error completing payment and transferring funds: ${error}`);
            throw error;
        }
    }
    async createExternalAccount(account) {
        try {
            const { stripeId, fullName, country, currency, routingNumber, accountNumber, } = account;
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
        }
        catch (error) {
            throw error;
        }
    }
    async getExternalAccount(accountId) {
        try {
            const externalAccounts = await this.stripe.accounts.listExternalAccounts(accountId);
            return externalAccounts.data[0];
        }
        catch (error) {
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
    async checkEvent(body, sig, endpointSecret) {
        try {
            return this.stripe.webhooks.constructEvent(body, sig, endpointSecret);
        }
        catch (error) {
            common_1.Logger.error('Error in stripe webhook', error);
            throw new common_1.InternalServerErrorException('Error in stripe webhook');
        }
    }
    async deleteExternalAccount(stripeId) {
        const account = await this.stripe.accounts.retrieve(stripeId);
        if (!account.external_accounts.data.length) {
            throw new common_1.ConflictException('No external account found for the given account');
        }
        return await this.stripe.accounts.deleteExternalAccount(stripeId, account.external_accounts.data[0].id);
    }
    async updateDefaultCurrency(stripId, newCurrency) {
        return await this.stripe.accounts.update(stripId, {
            default_currency: newCurrency,
        });
    }
    async refundPayment(paymentIntentId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            if (!paymentIntent) {
                throw new common_1.BadRequestException('Payment intent not found');
            }
            if (paymentIntent.status !== 'succeeded') {
                throw new common_1.BadRequestException('Payment must be successful to be refunded');
            }
            return await this.stripe.refunds.create({
                payment_intent: paymentIntentId,
            });
        }
        catch (error) {
            common_1.Logger.error(`Error refunding payment: ${error}`);
            throw error;
        }
    }
    async listRefunds(limit = 10, startingAfter) {
        try {
            const refunds = await this.stripe.refunds.list({
                limit,
                starting_after: startingAfter,
            });
            return refunds;
        }
        catch (error) {
            common_1.Logger.error('Error listing refunds:', error);
            throw new common_1.InternalServerErrorException('Failed to list refunds');
        }
    }
    async getRefundDetails(refundId) {
        try {
            const refund = await this.stripe.refunds.retrieve(refundId);
            return refund;
        }
        catch (error) {
            common_1.Logger.error('Error retrieving refund details:', error);
            throw new common_1.InternalServerErrorException('Failed to retrieve refund details');
        }
    }
    async uploadPassportPhoto(accountId, passportPhotoBuffer, fileName = 'passport_photo.jpg') {
        try {
            const file = await this.stripe.files.create({
                file: {
                    data: passportPhotoBuffer,
                    name: fileName,
                    type: 'image/jpeg',
                },
                purpose: 'identity_document',
            });
            await this.stripe.accounts.update(accountId, {
                individual: {
                    verification: {
                        document: {
                            front: file.id,
                        },
                    },
                },
            });
            common_1.Logger.log(`Passport photo uploaded successfully for account ${accountId}`);
            return file;
        }
        catch (error) {
            common_1.Logger.error(`Error uploading passport photo to Stripe: ${error}`);
            throw new common_1.InternalServerErrorException('Failed to upload passport photo to Stripe');
        }
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('STRIPE_API_KEY')),
    __metadata("design:paramtypes", [String, config_1.ConfigService])
], StripeService);
//# sourceMappingURL=stripe.service.js.map