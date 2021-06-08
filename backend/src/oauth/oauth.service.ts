import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { AuthPlus } from 'googleapis-common';

@Injectable()
export class OAuthService {
  async getCallback(code: string) {
    const { tokens: accessToken } = await this.googleOauthClient.getToken(code);

    return accessToken;
  }

  constructor(private readonly config: ConfigService) {
    this.config = config;
    this.googleOauthClient = new google.auth.OAuth2(
      config.get('GOOGLE_CLIENT_ID'),
      config.get('GOOGLE_SECRET_KEY'),
      'http://localhost:3000',
    );

    google.options({ auth: this.googleOauthClient });
  }

  private readonly googleOauthClient: InstanceType<AuthPlus['OAuth2']>;
}
