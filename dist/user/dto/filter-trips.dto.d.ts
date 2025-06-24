import { TripStatus } from 'src/shared/trip-status.enum';
export declare class FilterTripsDto {
    status?: TripStatus;
    page?: number;
    take?: number;
}
