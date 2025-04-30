import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { User, UserDocument } from './schemas/user.schema';
import * as otel from '../otel';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  @otel.Span('UsersService.create')
  async create(createUserDto: CreateUserDto) {
    const span = otel.currentSpan();
    span?.setAttribute('user.name', createUserDto.name);
    const doc = await this.userModel.create(createUserDto);
    return { id: doc.id };
  }

  @otel.Span('UsersService.findAll')
  async findAll() {
    return await this.userModel.find().exec();
  }

  @otel.Span('UsersService.findOne')
  async findOne(id: string) {
    const objectId = new Types.ObjectId(id);
    return await this.userModel.findById(objectId).exec();
  }

  @otel.Span('UsersService.update')
  async update(id: string, updateUserDto: UpdateUserDto) {
    const objectId = new Types.ObjectId(id);
    return await this.userModel
      .findByIdAndUpdate(objectId, updateUserDto, { new: true })
      .exec();
  }

  @otel.Span('UsersService.remove')
  async remove(id: string) {
    return await this.userModel.findByIdAndDelete(id).exec();
  }
}
