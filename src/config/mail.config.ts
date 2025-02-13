import { registerAs } from '@nestjs/config';

export const mailConfig = registerAs('mail', () => ({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT ?? '465', 10),
  user: process.env.MAIL_USER,
  password: process.env.MAIL_PASSWORD,
}));
