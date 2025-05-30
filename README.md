# 🎵 YouTube MP3 Downloader API (NestJS)

<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<p align="center">Uma API simples em NestJS para baixar vídeos ou playlists do YouTube como MP3 usando <code>yt-dlp</code> e <code>ffmpeg</code>.</p>

---

## 📦 Sobre o projeto

Este backend fornece dois endpoints:

- `POST /youtube/info` → Obtém o título do vídeo ou os títulos de uma playlist.
- `POST /youtube/download` → Baixa o vídeo ou a playlist como arquivos `.mp3`.

Os arquivos são salvos na pasta `~/Downloads/[nome-da-pasta]`.

---

## 🚀 Instalação

```bash
# Instale dependências
npm install
```

---

## ▶️ Execução local

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run start:prod
```

---

## 📥 Dependências externas

Este projeto depende de duas ferramentas externas instaladas no sistema:

- [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) – Para baixar vídeos
- [`ffmpeg`](https://ffmpeg.org/) – Para converter os vídeos em MP3

Certifique-se de:

1. Ter o `yt-dlp` instalado e o caminho correto configurado no serviço:
   ```ts
   private ytDlpPath = '"D:\Program Files\yt-dlp\yt-dlp.exe"'; // ajuste conforme seu SO
   ```

2. Ter o `ffmpeg` instalado e disponível no PATH do sistema.

---

## 🛠 Endpoints

### `POST /youtube/info`

```json
{
  "url": "https://www.youtube.com/watch?v=abc123"
}
```

- Retorna o título do vídeo ou os títulos da playlist.

---

### `POST /youtube/download`

```json
{
  "url": "https://www.youtube.com/watch?v=abc123",
  "type": "video",
  "folderName": "musicas"
}
```

- Retorna o arquivo de áudio diretamente (`type=video`)
- Salva múltiplos arquivos no diretório `Downloads/nomeDaPasta` (`type=playlist`)

---

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes end-to-end
npm run test:e2e
```

---

## 🧑‍💻 Autor

Feito com ❤️ por **Reginaldo Campelo**  
- [GitHub](https://github.com/reginaldocampelo)  
- [LinkedIn](https://linkedin.com/in/reginaldocampelo)

---

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).