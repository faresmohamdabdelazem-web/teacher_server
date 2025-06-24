import { Controller, Get, Query } from '@nestjs/common';
import { AssetsService } from './assets.service';
import path from 'path';
import { FilterAssetsDto } from './filter-assets.dto';
import { readFile } from 'fs/promises';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  async getCountries(@Query() paginatedRequestDto: FilterAssetsDto) {
    const { withStates, iso2 } = paginatedRequestDto;
    const filePath = path.resolve(__dirname, '..', '..', 'countries.json');
    const file = await readFile(filePath, { encoding: 'utf-8' });

    const countries = JSON.parse(file);

    if (iso2) {
      const targetCountry = countries.find(
        (country: any) => country.iso2 === iso2,
      );

      if (!withStates) {
        delete targetCountry.states;
      }

      return { targetCountry };
    }

    if (!withStates) {
      countries.forEach((country: any) => delete country.states);
    }

    return { countries };
  }
}
