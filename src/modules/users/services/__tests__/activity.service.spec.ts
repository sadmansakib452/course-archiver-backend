import { Test } from '@nestjs/testing';
import { UserActivityService } from '../activity.service';

describe('UserActivityService', () => {
  let service: UserActivityService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserActivityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserActivityService>(UserActivityService);
  });

  describe('getUserActivities', () => {
    it('should filter activities correctly', async () => {
      // Test implementation
    });
  });
});
