import { hash } from "bcryptjs";
import { User } from "../../../users/entities/User";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let getBalanceUseCase: GetBalanceUseCase;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;

describe('Get Balance', () => {
  let user: User;

  beforeEach(async () => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    getBalanceUseCase = new GetBalanceUseCase(inMemoryStatementsRepository, inMemoryUsersRepository);

    const passwordHash = await hash("123456", 8);

    user = await inMemoryUsersRepository.create({
      name: "User test",
      email: "test@email.com",
      password: passwordHash
    });

    await inMemoryStatementsRepository.create({
      user_id: user.id as string,
      amount: 100,
      description: "Statement deposit description test",
      type: OperationType.DEPOSIT
    });

    await inMemoryStatementsRepository.create({
      user_id: user.id as string,
      amount: 50,
      description: "Statement withdraw description test",
      type: OperationType.WITHDRAW
    });
  });

  it('should be able to get the balance of an existing user', async () => {
    const result = await getBalanceUseCase.execute({
      user_id: user.id as string
    });

    expect(result).toHaveProperty("statement");
    expect(result).toHaveProperty("balance");
    expect(result.balance).toBe(50);
    expect(result.statement.length).toBe(2);
  });

  it('should not be able to get the balance of an user that does not exist', async () => {
    expect(async () => {
      await getBalanceUseCase.execute({
        user_id: "invalidUserId"
      });
    }).rejects.toBeInstanceOf(GetBalanceError);
  });
});
