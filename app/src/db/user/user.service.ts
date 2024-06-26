import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CreateUserDTO } from './dtos/create-user.dto';
import { SaveAccessTokenDto } from '../tokens/dtos/saveAccessToken.dto';
import { SaveRefreshTokenDto } from '../tokens/dtos/saveRefreshToken.dto';
import { TokensService } from '../tokens/tokens.service';
import { ImageService } from 'src/image.upload/image.service';
import { PayloadResponse } from 'src/auth/dtos/payload-response';
import { UserUpdateDto } from './dtos/user.update.dto';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly tokensService: TokensService,

        private readonly imageService: ImageService
    ) { }

    async signUp(userDTO: CreateUserDTO): Promise<User> {
        const existingEmail = await this.userRepository.findOne({ where: { useremail: userDTO.useremail } });
        if (existingEmail) {
            throw new ConflictException('Email already exists');
        }

        const user = new User();
        user.useremail = userDTO.useremail;
        user.nickname = userDTO.nickname;

        const salt = await bcrypt.genSalt();
        user.password = await bcrypt.hash(userDTO.password, salt);


        try {
            const savedUser = await this.userRepository.save(user);
            delete savedUser.password;

            const accessTokenUser = new SaveAccessTokenDto();
            const refreshTokenUser = new SaveRefreshTokenDto();
            accessTokenUser.user = savedUser;
            refreshTokenUser.user = savedUser;

            const tokens = await this.tokensService.saveTokenUser(accessTokenUser, refreshTokenUser)
            await this.userRepository.update(savedUser.userId, { accessToken: tokens[0], refreshToken: tokens[1] })

            return savedUser;
        } catch (e) {
            throw new InternalServerErrorException('Failed to create user');
        }
    }

    async updateThumbnail(payload: PayloadResponse, file: Express.Multer.File): Promise<UserUpdateDto> {
        try {
            const user = await this.userRepository.findOneBy({ useremail: payload.useremail });
            if (!user) {
                throw new Error('User not found');
            }
            const imageUrl = await this.imageService.thumbnailImageUpload(file, user.userId);

            user.thumbnail = imageUrl;

            const ret = await this.userRepository.save(user);
            delete ret.password;
            delete ret.prePwd;
            delete ret.deletedAt;
            delete ret.birthDayFlag;

            return ret;
        } catch (e) {
            throw new InternalServerErrorException("Failed to saved the userThumbnail");
        }
    }

    async findOne(data: Partial<User>): Promise<User> {
        const user = await this.userRepository.findOneBy({ useremail: data.useremail });
        if (!user) {
            throw new UnauthorizedException('Could not find user');
        }
        return user;
    }

    async tutorialComplete(userEmail: string): Promise<string> {

        try {
            await this.userRepository.update({ useremail: userEmail }, { isFirst: false });

            return "user has proceeded the tutorial";
        }
        catch (err) {
            console.log(err);
            throw new InternalServerErrorException('user tutorial status update failed');
        }
    }
}
