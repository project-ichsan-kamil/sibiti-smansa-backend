import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileUser } from './entities/profile-user.entity';

@Injectable()
export class ProfileUserService {
    constructor(
        @InjectRepository(ProfileUser)
        private readonly profileRepository: Repository<ProfileUser>,
    ) {}

    async createProfile(userId: number, createdBy: string): Promise<ProfileUser> {
        const newProfile = new ProfileUser();
        newProfile.userId = userId;
        newProfile.createdBy = createdBy;

        try {
            return await this.profileRepository.save(newProfile);
        } catch (error) {
            throw new BadRequestException('Gagal membuat profil');
        }
    }

    async updateProfile(profileId: number, updatedProfileData: Partial<ProfileUser>): Promise<ProfileUser> {
        const profile = await this.profileRepository.findOne({ where: { id: profileId } });

        if (!profile) {
            throw new BadRequestException('Profil tidak ditemukan');
        }

        try {
            // Update fields that can be updated
            Object.assign(profile, updatedProfileData);
            return await this.profileRepository.save(profile);
        } catch (error) {
            throw new BadRequestException('Gagal memperbarui profil');
        }
    }
}
