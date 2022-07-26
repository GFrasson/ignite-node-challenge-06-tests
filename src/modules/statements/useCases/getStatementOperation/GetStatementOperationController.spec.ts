import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';
import createConnection from '../../../../database'
import { Statement } from '../../entities/Statement';
import authConfig from '../../../../config/auth';

let connection: Connection;
let token: string;
let statement: Statement;

describe('Get Statement Operation Controller', () => {
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

    const statementResponse = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 100,
        description: "Deposit description test"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    statement = statementResponse.body;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to get a statement operation of an existing user', async () => {
    const response = await request(app)
      .get(`/api/v1/statements/${statement.id}`)
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(200);
  });

  it('should not be able to get a statement operation of an user that does not exist', async () => {
    const fakeUserId = "98a19a2a-7ade-407e-b64d-89695e0470e9";
    const { secret, expiresIn } = authConfig.jwt;

    const fakeToken = sign({}, secret, {
      subject: fakeUserId,
      expiresIn,
    });

    const response = await request(app)
      .get(`/api/v1/statements/${statement.id}`)
      .set({
        Authorization: `Bearer ${fakeToken}`
      });

    expect(response.status).toBe(404);
  });

  it('should not be able to get a statement operation that does not exist', async () => {
    const invalidStatementId: string = "123e4567-e89b-12d3-a456-426655440000";

    const response = await request(app)
      .get(`/api/v1/statements/${invalidStatementId}`)
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(404);
  });
});
