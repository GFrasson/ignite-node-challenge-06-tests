import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';
import createConnection from '../../../../database'

let connection: Connection;

describe('Authenticate User Controller', () => {
  const userCredentials = {
    email: "test@email.com",
    password: "123456"
  };

  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    await request(app).post("/api/v1/users").send({
      name: "User test",
      ...userCredentials
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to authenticate an existing user', async () => {
    const response = await request(app).post("/api/v1/sessions").send(userCredentials);

    expect(response.status).toBe(200);
  });

  it('should not be able to create a session with an invalid email', async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "invalid@email.com",
      password: userCredentials.password
    });

    expect(response.status).toBe(401);
  });

  it('should not be able to create a session with an invalid password', async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: userCredentials.email,
      password: "invalidPassword"
    });

    expect(response.status).toBe(401);
  });
});
