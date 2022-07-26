import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';
import createConnection from '../../../../database'
import authConfig from '../../../../config/auth';
import { sign } from 'jsonwebtoken';

let connection: Connection;
let token: string;

describe('Create Statement Controller', () => {
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

    const response = await request(app)
      .post("/api/v1/sessions")
      .send(userCredentials);

    token = response.body.token;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to create a deposit statement', async () => {
    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 100,
        description: "Deposit description test"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(201);
  });

  it('should be able to create a withdraw statement with sufficient funds', async () => {
    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 100,
        description: "Withdraw description test"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(201);
  });

  it('should not be able to make a withdraw with insufficient funds', async () => {
    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 100,
        description: "Withdraw description test"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(400);
  });

  it('should not be able to create a statement of an user that does not exist', async () => {
    const fakeUserId = "98a19a2a-7ade-407e-b64d-89695e0470e9";
    const { secret, expiresIn } = authConfig.jwt;

    const fakeToken = sign({}, secret, {
      subject: fakeUserId,
      expiresIn,
    });

    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 100,
        description: "Deposit description test"
      })
      .set({
        Authorization: `Bearer ${fakeToken}`
      });

    expect(response.status).toBe(404);
  });
});
