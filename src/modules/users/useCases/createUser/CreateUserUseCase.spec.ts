import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase";

let createUserUseCase: CreateUserUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;

describe('Create User', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
  })

  it('should be able to create a new user', async () => {
    const user = await createUserUseCase.execute({
      name: "User test",
      email: "test@email.com",
      password: "123456"
    });

    expect(user).toHaveProperty("id");
    expect(user.name).toEqual("User test");
  });

  it('should not be able to create a user with an email that already exists', async () => {
    await createUserUseCase.execute({
      name: "User 1",
      email: "test@email.com",
      password: "123456"
    });

    expect(async () => {
      await createUserUseCase.execute({
        name: "User 2",
        email: "test@email.com",
        password: "654321"
      });
    }).rejects.toBeInstanceOf(CreateUserError);
  });
});
