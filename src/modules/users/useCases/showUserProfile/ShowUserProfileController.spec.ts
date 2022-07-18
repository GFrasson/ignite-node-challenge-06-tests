import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';
import createConnection from '../../../../database'

let connection: Connection;
let token: string;

describe('Show User Profile Controller', () => {
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

    const response = await request(app).post("/api/v1/sessions").send(userCredentials);

    token = response.body.token;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to show a user profile', async () => {
    const response = await request(app).get("/api/v1/profile").set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(200);
  });

  it('should not be able to show a user that does not exist', async () => {
    const fakeToken: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiMzI5YTIyYjktM2JmOC00ZTVjLWFjODAtMGUyZjEzN2E4NzU3IiwibmFtZSI6IlVzZXIgdGVzdCIsImVtYWlsIjoidGVzdEBlbWFpbC5jb20iLCJwYXNzd29yZCI6IiQyYSQwOCRTQmN0VjV4N1RzTnFqdGoycGRyZDZlN2dveXp4a2hCZURLRElqSWxwZVpqTk1SOVVOVlN2dSIsImNyZWF0ZWRfYXQiOiIyMDIyLTA3LTE4VDE5OjQ2OjQyLjY0OFoiLCJ1cGRhdGVkX2F0IjoiMjAyMi0wNy0xOFQxOTo0Njo0Mi42NDhaIn0sImlhdCI6MTY1ODE2MjgwMiwiZXhwIjoxNjU4MjQ5MjAyLCJzdWIiOiIzMjlhMjJiOS0zYmY4LTRlNWMtYWM4MC0wZTJmMTM3YTg3NTcifQ.tL_XI4s0RQ5vzxWDlqLDLyvP345FocXRdxFdz1kUuww";

    const response = await request(app).get("/api/v1/profile").set({
      Authorization: `Bearer ${fakeToken}`
    });

    expect(response.status).toBe(404);
  });
});
