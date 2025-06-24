import { AssetsService } from './assets.service';
import { FilterAssetsDto } from './filter-assets.dto';
export declare class AssetsController {
    private readonly assetsService;
    constructor(assetsService: AssetsService);
    getCountries(paginatedRequestDto: FilterAssetsDto): Promise<{
        targetCountry: any;
        countries?: undefined;
    } | {
        countries: any;
        targetCountry?: undefined;
    }>;
}
