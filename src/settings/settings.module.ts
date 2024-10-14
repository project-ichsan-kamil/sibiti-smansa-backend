import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Setting } from './entities/setting.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  providers: [SettingsService],
})
export class SettingsModule {}
