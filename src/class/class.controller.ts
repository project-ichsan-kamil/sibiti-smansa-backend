import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Controller('classes')
export class ClassController {
    constructor(private readonly classService: ClassService) {}

    @Get()
    async findAll() {
        const result = await this.classService.findAll();
        return {
          statusCode : 200,
          message : "Data berhasil ditemukan",
          count : result.length,
          data : result
        }
    }

    @Get('search')
    async searchByName(@Query('nama') nama: string) {
        const result = await this.classService.searchByName(nama);
        return {
          statusCode: 200,
          message: "Data berhasil ditemukan",
          count : result.length,
          data: result
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: number) {
        const result = await this.classService.findOne(id);
        return {
          statusCode : 200,
          message : "Data berhasil ditemukan",
          data : result
        }
    }

    // @Post()
    // @UsePipes(new ValidationPipe({ transform: true }))
    // async create(@Body() createClassDto: CreateClassDto) {
    //     const result = await this.classService.create(createClassDto);
    //     return {
    //       statusCode : 200,
    //       message : "Data berhasil disimpan",
    //       data : result
    //     }
    // }

    // @Patch(':id')
    // async update(@Param('id') id: number, @Body() updateClassDto: UpdateClassDto) {
    //     const result = await this.classService.update(id, updateClassDto);
    //     return {
    //         statusCode: 200,
    //         message: "Data berhasil diperbarui",
    //         data: result
    //     };
    // }

    // @Delete(':id')
    // async remove(@Param('id') id: number) {
    //     const result = await this.classService.remove(id);
    //     return {
    //       statusCode: 200,
    //       message: "Data berhasil dihapus",
    //       data: result
    //     };
    // }
}