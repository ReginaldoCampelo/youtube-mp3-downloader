import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Injectable()
export class YoutubeService {
  private readonly ytDlpPath: string;

  constructor() {
    const isDev = process.env.NODE_ENV !== 'production';

    this.ytDlpPath = isDev
      ? 'D:\\Program Files\\yt-dlp\\yt-dlp.exe' // sem aspas!
      : 'yt-dlp';

    console.log('[YT-DLP PATH]', this.ytDlpPath);
  }

  /**
   * Obtém o título do vídeo.
   */
  async getTitle(url: string): Promise<string> {
    console.log('[getTitle] URL recebida:', url);

    return new Promise((resolve, reject) => {
      const command = spawn(
        this.ytDlpPath,
        ['--print', '%(title)s', '--no-playlist', url.split('&')[0]],
        { shell: true },
      );

      let output = '';

      command.stdout.on('data', (data) => {
        output += data.toString();
      });

      command.stderr.on('data', (err) => {
        console.error('[yt-dlp stderr]', err.toString());
      });

      command.on('error', (err) => {
        console.error('[yt-dlp spawn error]', err.message);
        reject(err);
      });

      command.on('close', (code) => {
        console.log('[yt-dlp closed with code]', code);
        if (code === 0) resolve(output.trim());
        else reject(new Error('Erro ao obter título'));
      });
    });
  }

  /**
   * Baixa um único vídeo como MP3 e envia via stream para o frontend
   */
  downloadSingleAudio(url: string, res): void {
    const ytDlp = spawn(
      this.ytDlpPath,
      ['-f', 'bestaudio', '-o', '-', url.split('&')[0]],
      { shell: true },
    );

    const ffmpeg = spawn(
      'ffmpeg',
      ['-i', 'pipe:0', '-f', 'mp3', '-b:a', '128k', '-vn', 'pipe:1'],
      { shell: true },
    );

    ytDlp.stdout.pipe(ffmpeg.stdin);

    res.setHeader('Content-Disposition', 'attachment; filename=audio.mp3');
    res.setHeader('Content-Type', 'audio/mpeg');

    ffmpeg.stdout.pipe(res);
  }

  /**
   * Baixa uma playlist completa em uma pasta local no diretório de Downloads
   */
  async downloadPlaylistToFolder(
    url: string,
    folderName: string = 'playlist',
  ): Promise<string> {
    const safeFolderName = folderName
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '');

    const targetFolder = path.join(os.homedir(), 'Downloads', safeFolderName);
    fs.mkdirSync(targetFolder, { recursive: true });

    const command = spawn(
      this.ytDlpPath,
      [
        '--yes-playlist',
        '-f',
        'bestaudio',
        '-x',
        '--audio-format',
        'mp3',
        '-o',
        `${targetFolder}/%(title)s.%(ext)s`,
        url,
      ],
      { shell: true },
    );

    return new Promise((resolve, reject) => {
      command.stderr.on('data', (data) => {
        console.error('[yt-dlp]', data.toString());
      });

      command.on('error', reject);

      command.on('close', (code) => {
        if (code === 0) resolve(targetFolder);
        else reject(new Error('Erro ao baixar playlist'));
      });
    });
  }
}
