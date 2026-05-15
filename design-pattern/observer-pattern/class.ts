import { IObserver, ISubject, IVideoDTO } from "./interface";

// Video Observer
export class VideoObserver implements IObserver<IVideoDTO> {
  update(data: IVideoDTO): void {
    console.log("New video added:", data);
  }
}

export class VideoSubject implements ISubject<IVideoDTO> {
  private localObservers: IObserver<IVideoDTO>[] = [];
  
  subscribe(observer: IObserver<IVideoDTO>): void {
    const observers = this.localObservers;
    if (!observers.includes(observer)) {
      observers.push(observer);
    }
  }
  
  unsubscribe(observer: IObserver<IVideoDTO>): void {
    const observers = this.localObservers;
    const index = observers.indexOf(observer);
    if (index !== -1) {
      observers.splice(index, 1);
    }
  }

  notify(data: IVideoDTO): void {
    const observers = this.localObservers;
    observers.forEach(observer => observer.update(data));
  }
}

// Now, I want to make a chat app using the observer pattern, 
// but I don't know how to implement it in this case.
// I want to create a chat room where users can join and receive messages.
// Each user will be an observer, and the chat room will be the subject.
// When a user sends a message, the chat room will notify all the users in the room.

export interface IUser {
  id: string;
  name: string;
}

export interface IMessage {
  sender: IUser["name"];
  content: string;
  timestamp: Date;
}

export interface IChatRoom {
  join(user: IUser): void;
  leave(user: IUser): void;
  sendMessage(message: IMessage): void;
}

export class ChatRoom implements IChatRoom {
  private users: IUser[] = [];
  private observers: IObserver<IMessage>[] = [];

  private async addUser(user: IUser): Promise<void> {
    this.users.push(user);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
  }

  private async removeUser(user: IUser): Promise<void> {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
  }

  async join(user: IUser): Promise<void> {
    // Joined users will receive messages from the chat room,
    await this.addUser(user);

    // On joining, the user will be added to the observers list to receive messages.
    // if the use is the first user to join, it will receive a welcome message from the chat room.
    // otherwise, it will receive a message from the chat room that a new user has joined.
    if (this.users.length === 0) {
      await this.notify({
        sender: "System",
        content: `Welcome ${user.name} to the chat room!`,
        timestamp: new Date()
      });
    } else {
      await this.notify({
        sender: "System",
        content: `${user.name} has joined the chat room.`,
        timestamp: new Date()
      });
    }

    await this.subscribe({
      update: (message: IMessage) => {
        if (message.sender !== user.name) {
          console.log(`${user.name} received message: ${message.content} from ${message.sender}`);
        }
      }
    });


    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
  }
  
  async leave(user: IUser): Promise<void> {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users.splice(index, 1);
      await this.notify({
        sender: "System",
        content: `${user.name} has left the chat room.`,
        timestamp: new Date()
      });
    }

    // On leaving, the user will be removed from the observers list and will no longer receive messages.
    await this.unsubscribe({
      update: (message: IMessage) => {
        if (message.sender !== user.name) {
          console.log(`${user.name} received message: ${message.content} from ${message.sender}`);
        }
      }
    });

    return new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
  }

  async sendMessage(message: IMessage): Promise<void> {
    console.log(`${message.sender} says: ${message.content}`);
    await this.notify(message);
    return new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
  }
  
  private async subscribe(observer: IObserver<IMessage>): Promise<void> {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
    return new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
  }
  
  private async unsubscribe(observer: IObserver<IMessage>): Promise<void> {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
    return new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
  }

  async notify(data: IMessage): Promise<void> {
    const promises: Promise<void>[] = [];
    this.observers.forEach((observer) => {
      promises.push(new Promise(resolve => {
        observer.update(data);
        resolve();
      }))
    });
    
    await Promise.all(promises);
  }
}