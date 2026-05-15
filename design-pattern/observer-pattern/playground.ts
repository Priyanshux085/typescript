import { ChatRoom, IChatRoom, IMessage, IUser } from ".";

const userList: IUser[] = [
  {
    id: "1",
    name: "Alice"
  },
  {
    id: "2",
    name: "Bob"
  },
  {
    id: "3",
    name: "Charlie"
  }
];

const chatRoom: IChatRoom = new ChatRoom();
userList.forEach(user => chatRoom.join(user));

const message: IMessage = {
  sender: userList[0].name,
  content: "Hello, everyone!",
  timestamp: new Date()
};
chatRoom.sendMessage(message);

const message2: IMessage = {
  sender: userList[1].name,
  content: "Hi, Alice!",
  timestamp: new Date()
};
  
chatRoom.sendMessage(message2);


chatRoom.leave(userList[2]);

const message3: IMessage = {
  sender: userList[0].name,
  content: "Charlie has left the chat.",
  timestamp: new Date()
};
chatRoom.sendMessage(message3);