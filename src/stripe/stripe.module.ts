import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';

export const STRIPE_API_KEY = 'STRIPE_API_KEY';

const stripeProvider = {
  provide: STRIPE_API_KEY,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) =>
    configService.get('STRIPE_API_KEY'),
};

@Module({
  providers: [StripeService, stripeProvider],
  exports: [StripeService],
})
export class StripeModule {}
