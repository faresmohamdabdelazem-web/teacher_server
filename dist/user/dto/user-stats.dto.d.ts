export declare class UserStatsDto {
    shipments: {
        pending: number;
        inProgress: number;
        completed: number;
        total: number;
    };
    trips: {
        pending: number;
        inProgress: number;
        completed: number;
        total: number;
    };
    deals: {
        pending: number;
        inProgress: number;
        completed: number;
        total: number;
    };
    counts: {
        activeShipments: number;
        completedTrips: number;
        totalDeals: number;
    };
    ratings: {
        averageRating: number;
        totalReviews: number;
    };
}
