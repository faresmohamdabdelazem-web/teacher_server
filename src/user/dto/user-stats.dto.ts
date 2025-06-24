export class UserStatsDto {
  // Progress distributions
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

  // Counts
  counts: {
    activeShipments: number;
    completedTrips: number;
    totalDeals: number;
  };

  // Ratings
  ratings: {
    averageRating: number;
    totalReviews: number;
  };
} 