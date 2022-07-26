import { User } from "../../../users/entities/User";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateTransferError } from "./CreateTransferError";
import { CreateTransferUseCase } from "./CreateTransferUseCase";

let createTransferUseCase: CreateTransferUseCase;
let usersRepository: InMemoryUsersRepository;
let statementsRepository: InMemoryStatementsRepository;

describe('Create Transfer', () => {
  let users: User[];

  beforeEach(async () => {
    usersRepository = new InMemoryUsersRepository();
    statementsRepository = new InMemoryStatementsRepository();
    createTransferUseCase = new CreateTransferUseCase(
      usersRepository,
      statementsRepository
    );

    users = [];

    users.push(
      await usersRepository.create({
        name: "User Test 1",
        email: "test1@email.com",
        password: "123456",
      })
    );

    users.push(
      await usersRepository.create({
        name: "User Test 2",
        email: "test2@email.com",
        password: "654321",
      })
    );

    await statementsRepository.create({
      amount: 500,
      description: "Deposit",
      type: OperationType.DEPOSIT,
      user_id: users[0].id as string
    });
  });

  it('should be able to make a transfer to an user that exists', async () => {
    const transfer = await createTransferUseCase.execute({
      amount: 100,
      description: "Transfer test",
      sender_id: users[0].id as string,
      user_id: users[1].id as string
    });

    expect(transfer).toHaveProperty("id");
    expect(transfer).toHaveProperty("sender_id");
    expect(transfer.type).toBe("transfer");
  });

  it('should not be able to make a transfer to an user that does not exist', async () => {
    await expect(createTransferUseCase.execute({
      amount: 100,
      description: "Transfer test",
      sender_id: users[0].id as string,
      user_id: "invalidUserId"
    })).rejects.toEqual(new CreateTransferError.UserNotFound());
  });

  it('should not be able to make a transfer from an user that does not exist', async () => {
    await expect(createTransferUseCase.execute({
      amount: 100,
      description: "Transfer test",
      sender_id: "invalidUserId",
      user_id: users[1].id as string
    })).rejects.toEqual(new CreateTransferError.SenderUserNotFound());
  });

  it('should not be able to make a transfer with insufficient funds', async () => {
    await expect(createTransferUseCase.execute({
      amount: 600,
      description: "Transfer test",
      sender_id: users[0].id as string,
      user_id: users[1].id as string
    })).rejects.toEqual(new CreateTransferError.InsufficientFunds());
  });
});
