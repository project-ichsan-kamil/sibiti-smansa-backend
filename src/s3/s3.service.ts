import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import * as fs from 'fs';
import * as mime from 'mime-types';
import { extname } from 'path';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);

  private s3: S3;
  private bucketName = 'sibiti-smansa';
  private endpoint = 'https://is3.cloudhost.id';


  constructor() {
    this.s3 = new S3({
      accessKeyId: '0H1JRQMPWETICVODF8RH',
      secretAccessKey: 'ywuDZ4vm6qQcnmp3t4Q1OkKjxLEchEq1UPGxrqdd',
      endpoint: this.endpoint,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });
  }

  async uploadFile(filePath: string, originalFileName: string, folder: string): Promise<string> {
    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}-${originalFileName}`;
    
    const fileContent = fs.readFileSync(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    const params = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileContent,
      ACL: 'public-read',
      ContentType: contentType,
    };

    try {
      const data = await this.s3.upload(params).promise();
      this.logger.log("Upload file from tinymce")
      return data.Location; // S3 URL of the uploaded file
    } catch (error) {
      throw new HttpException(`Error uploading file: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
