import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { YoutubeController } from './youtube/youtube.controller';
import { YoutubeService } from './youtube/youtube.service';

@Module({
  imports: [],
  controllers: [AppController, YoutubeController],
  providers: [AppService, YoutubeService],
})
export class AppModule {}
