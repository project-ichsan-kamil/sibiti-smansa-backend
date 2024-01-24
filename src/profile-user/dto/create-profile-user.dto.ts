import { IsNotEmpty } from "class-validator";

export class CreateProfileUserDto {
    @IsNotEmpty()
    readonly username : string;

    @IsNotEmpty()
    readonly email : string;

    @IsNotEmpty()
    userId : number;

}
