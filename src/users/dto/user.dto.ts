export class CreateUserDto {
  constructor(name: string, email: string, age?: number) {
    this.name = name;
    this.email = email;
    this.age = age;
  }
  name: string;
  email: string;
  age?: number;
}

export class UpdateUserDto {
  constructor(name?: string, email?: string, age?: number) {
    this.name = name;
    this.email = email;
    this.age = age;
  }
  name?: string;
  email?: string;
  age?: number;
}
