import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  toObject: {
    versionKey: false,
    transform: (_, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
    },
  },
  toJSON: {
    versionKey: false,
    transform: (_, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
    },
  },
})
export class User {
  _id: Types.ObjectId = new Types.ObjectId();
  
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true, unique: true })
  email!: string;

  @Prop({ type: Number })
  age: number | undefined;

  @Prop({ type: Date })
  createdAt: Date = new Date(Date.now());
}

export const UserSchema = SchemaFactory.createForClass(User);
