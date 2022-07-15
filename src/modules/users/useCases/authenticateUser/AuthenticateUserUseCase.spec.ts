import { hash } from "bcryptjs";
import { User } from "../../entities/User";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let authenticateUserUseCase: AuthenticateUserUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;

describe('Authenticate User', () => {
  let user: User;
  const password = "123456";

  beforeEach(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);

    const passwordHash = await hash(password, 8);

    user = await inMemoryUsersRepository.create({
      name: "User test",
      email: "test@email.com",
      password: passwordHash
    });
  })

  it('should be able to authenticate an existing user', async () => {
    const result = await authenticateUserUseCase.execute({
      email: user.email,
      password
    });

    expect(result).toHaveProperty("token");
    expect(result).toHaveProperty("user");
    expect(result.user).toHaveProperty("id");
    expect(result.user.email).toEqual(user.email);
  });

  it('should not be able to create a session with an invalid email', async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: "invalid@email.com",
        password
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });

  it('should not be able to create a session with an invalid password', async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: user.email,
        password: "invalidPassword"
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });
});
