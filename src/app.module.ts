import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { YoutubeController } from './youtube/youtube.controller';
import { YoutubeService } from './youtube/youtube.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, YoutubeController],
  providers: [AppService, YoutubeService],
})
export class AppModule {}
