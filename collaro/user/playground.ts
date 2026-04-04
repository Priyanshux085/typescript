import { User } from "./class";

const user = new User();
const newUser = user.createUser({
  name: "John Doe",
  email: "john.doe@example.com",
  password: "securepassword",
  userName: "johndoe",
})

console.log(newUser);