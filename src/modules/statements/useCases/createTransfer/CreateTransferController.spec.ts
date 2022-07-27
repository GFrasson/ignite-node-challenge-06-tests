import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';
import createConnection from '../../../../database'
import authConfig from '../../../../config/auth';
import { sign } from 'jsonwebtoken';

let connection: Connection;
let token: string;

describe('Create Transfer Controller', () => {
  const userCredentials = {
    email: "test@email.com",
    password: "123456"
  };

  const userCredentials2 = {
    email: "test2@email.com",
    password: "123456"
  };

  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    await request(app).post("/api/v1/users").send({
      name: "User test",
      ...userCredentials
    });

    await request(app).post("/api/v1/users").send({
      name: "User test 2",
      ...userCredentials2
    });

    const response = await request(app)
      .post("/api/v1/sessions")
      .send(userCredentials);

    token = response.body.token;

    await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 500,
        description: "Deposit description"
      })
      .set({
        Authorization: `Bearer ${token}`
      });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to make a transfer to an user that exists', async () => {
    const userIdReceiveTransfer = await connection.query(`SELECT id FROM users WHERE email = '${userCredentials2.email}' LIMIT 1`);

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${userIdReceiveTransfer[0].id}`)
      .send({
        amount: 100,
        description: "Transfer description"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(201);
  });

  it('should not be able to make a transfer to an user that does not exist', async () => {
    const fakeUserId = "98a19a2a-7ade-407e-b64d-89695e0470e9";

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${fakeUserId}`)
      .send({
        amount: 100,
        description: "Transfer description"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(404);
  });

  it('should not be able to make a transfer from an user that does not exist', async () => {
    const userIdReceiveTransfer = await connection.query(`SELECT id FROM users WHERE email = '${userCredentials2.email}' LIMIT 1`);

    const fakeUserId = "98a19a2a-7ade-407e-b64d-89695e0470e9";
    const { secret, expiresIn } = authConfig.jwt;

    const fakeToken = sign({}, secret, {
      subject: fakeUserId,
      expiresIn
    });

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${userIdReceiveTransfer[0].id}`)
      .send({
        amount: 100,
        description: "Transfer description"
      })
      .set({
        Authorization: `Bearer ${fakeToken}`
      });

    expect(response.status).toBe(404);
  });

  it('should not be able to make a transfer with insufficient funds', async () => {
    const userIdReceiveTransfer = await connection.query(`SELECT id FROM users WHERE email = '${userCredentials2.email}' LIMIT 1`);

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${userIdReceiveTransfer[0].id}`)
      .send({
        amount: 1000,
        description: "Transfer description"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(400);
  });
});
