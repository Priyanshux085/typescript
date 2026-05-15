export interface IObserver<T> {
  update(data: T): void;
}

export interface ISubject<T> {
  subscribe(observer: IObserver<T>): void;
  unsubscribe(observer: IObserver<T>): void;
  notify(data: T): void;
}

export interface IVideoDTO {
  id: string;
  title: string;
  createdAt: Date;
};