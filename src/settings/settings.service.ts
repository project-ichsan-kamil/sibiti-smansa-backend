import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(Setting)
        private readonly settingsRepository: Repository<Setting>,
    ) {}

    async getSettingByKey(key: string): Promise<Setting> {
        return this.settingsRepository.findOne({ where: { key } });
    }
}
