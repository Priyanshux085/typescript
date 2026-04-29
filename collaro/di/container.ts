/**
 * Dependency Injection Container
 */

type Constructor<T = any> = new (...args: any[]) => T;
type Factory<T = any> = () => T;

interface Registration {
  type?: Constructor;
  factory?: Factory;
  instance?: any;
  singleton: boolean;
}

export class DIContainer {
  private static instance: DIContainer;
  private registrations = new Map<string, Registration>();

  private constructor() {}

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  register<T>(token: string, type: Constructor<T>, singleton: boolean = true): void {
    this.registrations.set(token, { type, singleton, instance: undefined });
  }

  registerFactory<T>(token: string, factory: Factory<T>, singleton: boolean = true): void {
    this.registrations.set(token, { factory, singleton, instance: undefined });
  }

  registerInstance<T>(token: string, instance: T): void {
    this.registrations.set(token, { singleton: true, instance });
  }

  resolve<T>(token: string): T {
    const registration = this.registrations.get(token);
    if (!registration) {
      throw new Error(`Dependency '${token}' not registered`);
    }

    if (registration.singleton && registration.instance !== undefined) {
      return registration.instance;
    }

    let instance: T;

    if (registration.factory) {
      instance = registration.factory();
    } else if (registration.type) {
      instance = new registration.type();
    } else {
      throw new Error(`Dependency '${token}' has no type or factory`);
    }

    if (registration.singleton) {
      registration.instance = instance;
    }

    return instance;
  }

  has(token: string): boolean {
    return this.registrations.has(token);
  }

  clear(): void {
    this.registrations.clear();
  }
}
