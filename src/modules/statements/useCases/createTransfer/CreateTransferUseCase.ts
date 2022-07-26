import { inject, injectable } from "tsyringe";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { OperationType, Statement } from "../../entities/Statement";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateTransferError } from "./CreateTransferError";

interface IRequest {
  sender_id: string;
  user_id: string;
  amount: number;
  description: string;
}

@injectable()
class CreateTransferUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository
  ) {}

  async execute({ amount, description, sender_id, user_id }: IRequest): Promise<Statement> {
    const user = await this.usersRepository.findById(user_id);

    if (!user) {
      throw new CreateTransferError.UserNotFound();
    }

    const sender = await this.usersRepository.findById(sender_id);

    if (!sender) {
      throw new CreateTransferError.SenderUserNotFound();
    }

    const { balance } = await this.statementsRepository.getUserBalance({ user_id: sender_id });

    if (balance < amount) {
      throw new CreateTransferError.InsufficientFunds();
    }

    const statement = await this.statementsRepository.create({
      amount,
      description,
      user_id,
      sender_id,
      type: OperationType.TRANSFER,
    });

    return statement;
  }
}

export { CreateTransferUseCase };
