import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';
import createConnection from '../../../../database'

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
    const fakeToken: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiMzI5YTIyYjktM2JmOC00ZTVjLWFjODAtMGUyZjEzN2E4NzU3IiwibmFtZSI6IlVzZXIgdGVzdCIsImVtYWlsIjoidGVzdEBlbWFpbC5jb20iLCJwYXNzd29yZCI6IiQyYSQwOCRTQmN0VjV4N1RzTnFqdGoycGRyZDZlN2dveXp4a2hCZURLRElqSWxwZVpqTk1SOVVOVlN2dSIsImNyZWF0ZWRfYXQiOiIyMDIyLTA3LTE4VDE5OjQ2OjQyLjY0OFoiLCJ1cGRhdGVkX2F0IjoiMjAyMi0wNy0xOFQxOTo0Njo0Mi42NDhaIn0sImlhdCI6MTY1ODE2MjgwMiwiZXhwIjoxNjU4MjQ5MjAyLCJzdWIiOiIzMjlhMjJiOS0zYmY4LTRlNWMtYWM4MC0wZTJmMTM3YTg3NTcifQ.tL_XI4s0RQ5vzxWDlqLDLyvP345FocXRdxFdz1kUuww";

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
