import { Controller, Patch, Param, Body } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile-user.dto';
import { ProfileUserService } from './profile-user.service';
@Controller('profiles')
export class ProfileUserController {
    constructor(private readonly profileService: ProfileUserService) {}

    @Patch(':id')
    async updateProfile(@Param('id') profileId: number, @Body() updateProfileUserDto: UpdateProfileDto) {
        return await this.profileService.updateProfile(profileId, updateProfileUserDto);
    }
}
