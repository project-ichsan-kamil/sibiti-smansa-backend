import { Controller, Get, Param, Query, Req, UseGuards, } from '@nestjs/common';
import { ClassService } from './class.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum';
import { Roles } from 'src/auth/decorator/roles.decorator';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassController {
    constructor(private readonly classService: ClassService) {}

    @Get()
    @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
    async findAll(@Req() req: any) {
        const currentUser = req.user;
        const result = await this.classService.findAll(currentUser);
        return {
          statusCode : 200,
          message : "Data berhasil ditemukan",
          count : result.length,
          data : result
        }
    }

    @Get('search')
    @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
    async searchByName(@Query('nama') nama: string, @Req() req : any) {
        const currentUser = req.user;
        const result = await this.classService.searchByName(nama, currentUser);
        return {
          statusCode: 200,
          message: "Data berhasil ditemukan",
          count : result.length,
          data: result
        };
    }

    @Get(':id')
    @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
    async findOne(@Param('id') id: number, @Req() req: any) {
        const currentUser = req.user;
        const result = await this.classService.findOne(id, currentUser);
        return {
          statusCode : 200,
          message : "Data berhasil ditemukan",
          data : result
        }
    }
}