export declare class StatusDistributionDto {
    pending: number;
    inProgress: number;
    completed: number;
    total: number;
}
export declare class UserProgressDto {
    shipments: StatusDistributionDto;
    trips: StatusDistributionDto;
    deals: StatusDistributionDto;
}
