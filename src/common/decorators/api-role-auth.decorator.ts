import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiSecurity,
  ApiHeader,
  ApiResponse,
} from '@nestjs/swagger';
import { AUTH_DESCRIPTIONS } from '../constants/auth-descriptions';
import { UserRole } from '@prisma/client';

export function ApiRoleAuth(role: keyof typeof UserRole, tag: string) {
  return applyDecorators(
    ApiTags(tag),
    ApiBearerAuth(),
    ApiSecurity('bearer'),
    ApiHeader({
      name: 'Authorization',
      description: `Bearer token for ${role} authentication`,
      required: true,
    }),
    ApiResponse({
      status: 401,
      description: AUTH_DESCRIPTIONS.ERRORS.UNAUTHORIZED,
      schema: {
        example: {
          statusCode: 401,
          message: 'Unauthorized',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: `${AUTH_DESCRIPTIONS.ERRORS.FORBIDDEN}\nRequired Role: ${role}\n\n${
        AUTH_DESCRIPTIONS.ROLES[role].description
      }\n\nPermissions:\n${AUTH_DESCRIPTIONS.ROLES[role].permissions
        .map((p) => `- ${p}`)
        .join('\n')}`,
      schema: {
        example: {
          statusCode: 403,
          message: 'Forbidden resource',
          error: 'Forbidden',
        },
      },
    }),
  );
}
