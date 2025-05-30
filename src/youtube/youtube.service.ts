import { Injectable } from '@nestjs/common';
import * as archiver from 'archiver';
import { spawn } from 'child_process';
import { Response } from 'express';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Injectable()
export class YoutubeService {
  private readonly ytDlpPath: string;
  private readonly isWindows: boolean;

  constructor() {
    const isDev = process.env.NODE_ENV !== 'production';
    this.isWindows = process.platform === 'win32';

    this.ytDlpPath =
      isDev && this.isWindows
        ? `"D:\\Program Files\\yt-dlp\\yt-dlp.exe"`
        : 'yt-dlp';

    console.log('[YT-DLP PATH]', this.ytDlpPath);
  }

  async getTitle(url: string): Promise<string> {
    console.log('[getTitle] URL recebida:', url);

    return new Promise((resolve, reject) => {
      const args = ['--print', '%(title)s', '--no-playlist', url.split('&')[0]];
      const command = spawn(
        this.ytDlpPath,
        args,
        this.isWindows ? { shell: true } : undefined,
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

  downloadSingleAudio(url: string, res: Response): void {
    const args = ['-f', 'bestaudio', '-o', '-', url.split('&')[0]];

    const ytDlp = spawn(
      this.ytDlpPath,
      args,
      this.isWindows ? { shell: true } : undefined,
    );
    const ffmpeg = spawn(
      'ffmpeg',
      ['-i', 'pipe:0', '-f', 'mp3', '-b:a', '128k', '-vn', 'pipe:1'],
      this.isWindows ? { shell: true } : undefined,
    );

    ytDlp.stdout.pipe(ffmpeg.stdin);

    res.setHeader('Content-Disposition', 'attachment; filename=audio.mp3');
    res.setHeader('Content-Type', 'audio/mpeg');

    ffmpeg.stdout.pipe(res);
  }

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

    const args = [
      '--yes-playlist',
      '-f',
      'bestaudio',
      '-x',
      '--audio-format',
      'mp3',
      '-o',
      `${targetFolder}/%(title)s.%(ext)s`,
      url,
    ];

    const command = spawn(
      this.ytDlpPath,
      args,
      this.isWindows ? { shell: true } : undefined,
    );

    return new Promise((resolve, reject) => {
      command.stderr.on('data', (data) => {
        console.error('[yt-dlp stderr]', data.toString());
      });

      command.on('error', reject);

      command.on('close', (code) => {
        console.log('[yt-dlp playlist closed with code]', code);
        if (code === 0) resolve(targetFolder);
        else reject(new Error('Erro ao baixar playlist'));
      });
    });
  }

  async downloadPlaylistAsZipStream(
    url: string,
    folderName: string = 'playlist',
    res: Response,
  ): Promise<void> {
    const safeFolderName = folderName
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '');

    const tmpPath = path.join('/tmp', safeFolderName);
    fs.mkdirSync(tmpPath, { recursive: true });

    const args = [
      '--yes-playlist',
      '-f',
      'bestaudio',
      '-x',
      '--audio-format',
      'mp3',
      '-o',
      `${tmpPath}/%(title)s.%(ext)s`,
      url,
    ];

    const command = spawn(this.ytDlpPath, args, { shell: true });

    return new Promise((resolve, reject) => {
      command.stderr.on('data', (data) => {
        console.error('[yt-dlp stderr]', data.toString());
      });

      command.on('error', (err) => {
        reject(new Error(`Erro ao executar yt-dlp: ${err.message}`));
      });

      command.on('close', (code) => {
        console.log('[yt-dlp zip mode closed with code]', code);

        if (code !== 0) {
          return reject(new Error('yt-dlp falhou com código diferente de 0'));
        }

        const files = fs.readdirSync(tmpPath);
        console.log('[Arquivos encontrados para ZIP]', files);

        if (!files.length) {
          return reject(new Error('Nenhum arquivo MP3 encontrado'));
        }

        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${safeFolderName}.zip`,
        );
        res.setHeader('Content-Type', 'application/zip');

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        archive.on('error', (err) => {
          console.error('[zip error]', err);
          reject(new Error(`Erro ao gerar ZIP: ${err.message}`));
        });

        archive.on('end', () => {
          console.log('[zip stream finalizado]');
          resolve();
        });

        res.on('close', () => {
          console.warn('[res] Conexão encerrada pelo cliente');
          archive.abort();
        });

        files.forEach((file) => {
          const filePath = path.join(tmpPath, file);
          archive.file(filePath, { name: file });
        });

        archive.finalize();
      });
    });
  }
}
