export class StatusDistributionDto {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
}

export class UserProgressDto {
  shipments: StatusDistributionDto;
  trips: StatusDistributionDto;
  deals: StatusDistributionDto;
} 