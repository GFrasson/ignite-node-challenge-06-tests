import { hash } from "bcryptjs";
import { User } from "../../../users/entities/User";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { CreateStatementError } from "./CreateStatementError";

let createStatementUseCase: CreateStatementUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;

describe('Create Statement', () => {
  let user: User;

  beforeEach(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);

    const passwordHash = await hash("123456", 8);

    user = await inMemoryUsersRepository.create({
      name: "User test",
      email: "test@email.com",
      password: passwordHash
    });
  });

  it('should be able to create a deposit statement', async () => {
    const statement = await createStatementUseCase.execute({
      user_id: user.id as string,
      amount: 100,
      description: "Statement deposit description test",
      type: OperationType.DEPOSIT
    });

    expect(statement).toHaveProperty("id");
  });

  it('should be able to create a withdraw statement with sufficient funds', async () => {
    await createStatementUseCase.execute({
      user_id: user.id as string,
      amount: 100,
      description: "Statement deposit description test",
      type: OperationType.DEPOSIT
    });

    const statement = await createStatementUseCase.execute({
      user_id: user.id as string,
      amount: 100,
      description: "Statement withdraw description test",
      type: OperationType.WITHDRAW
    });

    expect(statement).toHaveProperty("id");
  });

  it('should not be able to make a withdraw with insufficient funds', async () => {
    expect(async () => {
      await createStatementUseCase.execute({
        user_id: user.id as string,
        amount: 100,
        description: "Statement deposit description test",
        type: OperationType.DEPOSIT
      });

      await createStatementUseCase.execute({
        user_id: user.id as string,
        amount: 101,
        description: "Statement withdraw description test",
        type: OperationType.WITHDRAW
      });
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  });

  it('should not be able to create a statement of an user that does not exist', async () => {
    expect(async () => {
      await createStatementUseCase.execute({
        user_id: "invalidUserId",
        amount: 100,
        description: "Statement deposit description test",
        type: OperationType.DEPOSIT
      });
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });
});

