import request from 'supertest';
import { startApp } from './testApi';
import { UsersService } from '@src/users/users.service';
import { describe, it, expect } from 'bun:test';
import { CreateUserDto, UpdateUserDto } from '@src/users/dto/user.dto';

describe('Users Controller', () => {
  it('should create a new user (POST /users)', async () => {
    //Arrange
    await using testApi = await startApp();
    const app = testApi.app;
    const createUserDto = new CreateUserDto('Test User', 'test@example.com', 30);

    //Act
    const response = await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201);

    //Assert
    const actual = await app.get(UsersService).findOne(response.body.id);
    const expected = {
      name: createUserDto.name,
      email: createUserDto.email,
      age: createUserDto.age,
    };
    expect(actual).toMatchObject(expected);
  });

  it('should get all users (GET /users)', async () => {
    //Arrange
    await using testApi = await startApp();
    const app = testApi.app;
    const createUserDto = new CreateUserDto('Test User', 'test@example.com', 30);
    const userDoc = await app.get(UsersService).create(createUserDto);

    //Act
    const response = await request(app.getHttpServer())
      .get(`/users`)
      .expect(200);

    //Assert
    const expected = JSON.parse(JSON.stringify([userDoc]));
    expect(response.body).toMatchObject(expected);
  });

  it('should get a user by ID (GET /users/:id)', async () => {
    // Arrange
    await using testApi = await startApp();
    const app = testApi.app;
    const createUserDto = new CreateUserDto('Test User', 'test@example.com', 30);
    const userDoc = await app.get(UsersService).create(createUserDto);

    // Act
    const response = await request(app.getHttpServer())
      .get(`/users/${userDoc.id}`)
      .expect(200);
    
    // Assert
    const expected = JSON.parse(JSON.stringify(userDoc));
    expect(response.body).toMatchObject(expected);
  });

  it('should update a user (PATCH /users/:id)', async () => {
    // Arrange
    await using testApi = await startApp();
    const app = testApi.app;
    const createUserDto = new CreateUserDto('Test User', 'test@example.com', 30);
    const userDoc = await app.get(UsersService).create(createUserDto);
    const updateUserDto = new UpdateUserDto('Updated User', undefined, 35);

    // Act
    await request(app.getHttpServer())
      .patch(`/users/${userDoc.id}`)
      .send(updateUserDto)
      .expect(200);
    
    // Assert
    const actual = await app.get(UsersService).findOne(`${userDoc.id}`);
    expect(actual).toMatchObject({
      name: updateUserDto.name,
      email: createUserDto.email, 
      age: updateUserDto.age,
    }); 
  });
});
