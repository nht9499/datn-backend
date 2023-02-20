import { Injectable } from '@nestjs/common';
import { MailService } from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly mailService = new MailService();
  async sendEmail(args: { to: string; subject: string; html: string }) {
    const { to, subject, html } = args;
    if (!html) return;
    this.mailService.setApiKey(process.env.SENDGRID_API_KEY ?? '');
    const msg = {
      to,
      from: 'nhtam@sk-global.biz',
      subject,
      html,
    };
    this.mailService.send(msg);
  }
}
