import { User } from "./";

export const userExampleService = new User();

export const batman = userExampleService.createUser({
	name: "Bruce Wayne",
	userName: "batman",
	email: "bruce.wayne@example.com",
	password: "darkknight123",
});

export const wonderWoman = userExampleService.createUser({
	name: "Diana Prince",
	userName: "wonderwoman",
	email: "diana.prince@example.com",
	password: "amazonian123",
});

export const superman = userExampleService.createUser({
	name: "Clark Kent",
	userName: "superman",
	email: "clark.kent@example.com",
	password: "kryptonian123",
});
