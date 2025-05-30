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
    const isProd = process.env.NODE_ENV === 'production';

    if (!url || !url.startsWith('http')) {
      return res.status(HttpStatus.BAD_REQUEST).send('URL inválida');
    }

    try {
      if (type === 'playlist') {
        if (isProd) {
          // Em produção: stream como único arquivo MP3
          this.youtubeService.downloadPlaylistStream(url, res);
        } else {
          // Em dev: salvar como múltiplos arquivos locais
          const path = await this.youtubeService.downloadPlaylistToFolder(
            url,
            folderName ?? 'playlist',
          );
          res.json({
            message: 'Download finalizado localmente',
            path,
          });
        }
      } else {
        this.youtubeService.downloadSingleAudio(url, res);
      }
    } catch (err) {
      console.error('Erro no download:', err);
      res.status(500).send('Erro ao processar download');
    }
  }
}
