import { hash } from "bcryptjs";
import { User } from "../../entities/User";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let showUserProfileUseCase: ShowUserProfileUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;

describe('Show User Profile', () => {
  let user: User;

  beforeEach(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    showUserProfileUseCase = new ShowUserProfileUseCase(inMemoryUsersRepository);

    const passwordHash = await hash("123456", 8);

    user = await inMemoryUsersRepository.create({
      name: "User test",
      email: "test@email.com",
      password: passwordHash
    });
  });

  it('should be able to show a user profile', async () => {
    const userProfile = await showUserProfileUseCase.execute(user.id as string);

    expect(userProfile).toHaveProperty("id");
    expect(userProfile.name).toEqual(user.name);
    expect(userProfile.email).toEqual(user.email);
  });

  it('should not be able to show a user that does not exist', async () => {
    expect(async () => {
      await showUserProfileUseCase.execute("invalidUserId");
    }).rejects.toBeInstanceOf(ShowUserProfileError);
  });
});
