import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { YoutubeService } from './youtube.service';

@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Post('info')
  async getTitle(@Body('url') url: string, @Res() res: Response) {
    try {
      const title = await this.youtubeService.getTitle(url);
      res.json({ title });
    } catch {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'Não foi possível obter o título' });
    }
  }

  @Post('download')
  async downloadAudio(
    @Body()
    body: { url: string; type: 'video' | 'playlist'; folderName?: string },
    @Res() res: Response,
  ) {
    const { url, type, folderName } = body;

    if (!url || !url.startsWith('http')) {
      return res.status(HttpStatus.BAD_REQUEST).send('URL inválida');
    }

    try {
      if (type === 'playlist') {
        await this.youtubeService.downloadPlaylistToFolder(
          url,
          folderName ?? 'playlist',
        );
        res.json({
          message: 'Download finalizado',
          path: `~/Downloads/${folderName ?? 'playlist'}`,
        });
      } else {
        this.youtubeService.downloadSingleAudio(url, res);
      }
    } catch (err) {
      console.error('Erro no download:', err);
      res.status(500).send('Erro ao processar download');
    }
  }
}
