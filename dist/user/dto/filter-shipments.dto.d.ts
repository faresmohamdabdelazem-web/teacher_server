import { ShipmentStatus } from 'src/shared/shipment-status.enum';
export declare class FilterShipmentsDto {
    status?: ShipmentStatus;
    page?: number;
    take?: number;
}
