import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const mailConfig = {
      host: this.configService.get('mail.host'),
      port: this.configService.get('mail.port'),
      secure: true,
      auth: {
        user: this.configService.get('mail.user'),
        pass: this.configService.get('mail.password'),
      },
      debug: true,
      logger: true,
    };

    if (!mailConfig.auth.user || !mailConfig.auth.pass) {
      console.warn('Email configuration missing');
      return;
    }

    this.transporter = nodemailer.createTransport(mailConfig);

    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Mail configuration error:', error);
      } else {
        console.log('Mail server is ready to take messages');
      }
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    try {
      const resetLink = `${this.configService.get('env.frontendUrl')}/reset-password?token=${token}`;

      const mailOptions = {
        from: this.configService.get('mail.user'),
        to,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset Request</h1>
          <p>You have requested to reset your password.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" style="
            background-color: #4CAF50;
            border: none;
            color: white;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 4px 2px;
            cursor: pointer;
            border-radius: 4px;
          ">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendAdminWelcomeEmail(
    email: string,
    name: string,
    temporaryPassword: string,
  ) {
    if (!this.transporter) {
      console.warn('Skipping welcome email - email service not configured');
      return;
    }

    const html = `
      <h1>Welcome to Course Archiver</h1>
      <p>Dear ${name},</p>
      <p>Your account has been created in the Course Archiver system.</p>
      <p>Your login credentials:</p>
      <ul>
        <li>Email: ${email}</li>
        <li>Temporary Password: ${temporaryPassword}</li>
      </ul>
      <p><strong>Important:</strong> Please change your password immediately after your first login.</p>
      <p>Best regards,<br>System Administration</p>
    `;

    try {
      await this.transporter.sendMail({
        to: email,
        subject: 'Welcome to Course Archiver - Account Created',
        html,
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }
}
