import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../types/user';
import { UserDTO } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDTO } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async showAll(): Promise<User[]> {
    return await this.userModel.find();
  }

  async getUser(email: string): Promise<User> {
    return await this.userModel.findOne({
      email,
    });
  }

  async create(userDTO: User): Promise<User> {
    const { email } = userDTO;
    const user = await this.userModel.findOne({ email });
    if (user) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const createdUser = new this.userModel(userDTO);
    return await createdUser.save();
  }

  async findByLogin(userDTO: UserDTO) {
    const { email, password } = userDTO;
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    if (await bcrypt.compare(password, user.password)) {
      return user;
    } else {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
  }

  async update(id: string, newUser: UpdateUserDTO) {
    const user: User = await this.userModel.findOne({ _id: id });
    const userWithEmail = await this.userModel.findOne({
      email: newUser.email,
    });

    if (user === undefined || user === null) {
      throw new HttpException(`User doesn't exists`, HttpStatus.BAD_REQUEST);
    } else if (
      userWithEmail !== null &&
      userWithEmail !== undefined &&
      newUser.email !== user.email
    ) {
      throw new HttpException('Email is already used', HttpStatus.BAD_REQUEST);
    }

    const updateUser: UserDTO = {
      email: newUser.email || user.email,
      password: newUser.password || user.password,
    };

    const updatedUser = await this.userModel.findOneAndUpdate(
      { _id: id },
      {
        ...updateUser,
      },
      {
        new: true,
      },
    );

    return updatedUser;
  }

  async findByPayload(payload: any) {
    const { email } = payload;
    return await this.userModel.findOne({ email });
  }
}
