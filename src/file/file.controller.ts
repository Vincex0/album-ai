import { Controller, Get, Param, Query, Res, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileService } from './file.service.js';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('/api/v1/file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './images',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    await this.fileService.scanFile(); // Trigger scan for the new file
    return {
      filename: file.filename,
      status: 'success'
    };
  }

  @Get('/search')
  public async search(@Query('query') query: string) {
    return this.fileService.searchDetail(query);
  }

  @Get('/:fId/download')
  public async download(@Param('fId') fId: string, @Res() response: Response) {
    const file = await this.fileService.findFile(fId);
    response.download(file.path, (err) => {
      if (!err) {
        return;
      }
      response.send({
        code: 500,
        msg: 'download error',
      });
    });
  }
}
