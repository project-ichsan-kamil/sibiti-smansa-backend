import { IsNotEmpty } from "class-validator";

export class UpdateProfileUserDto {
    @IsNotEmpty()
    readonly username : string;

    @IsNotEmpty()
    readonly email : string;

    @IsNotEmpty()
    userId : number;
    
    noHp : string;
    sekolah : string;
    provinsi : string;
    kota : string;
    kelurahan : string;
    createdAt: Date;
    updatedAt: Date;
}
