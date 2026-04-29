/**
 * Dependency Injection Decorators
 * 
 * NOTE: TypeScript property decorators cannot directly set property values.
 * Use constructor injection with the `inject()` helper instead.
 */

import { DIContainer } from "./container";

/**
 * Mark a class as injectable and register it with the DI container
 * @param token - Optional custom token (defaults to class name)
 * 
 * Usage:
 *   @Injectable()
 *   class MyService { ... }
 */
export function Injectable(token?: string): ClassDecorator {
  return function (target: Function) {
    const container = DIContainer.getInstance();
    const key = token || target.name;
    container.register(key, target as new (...args: any[]) => any);
  };
}

/**
 * Helper function to inject a dependency
 * Call this in the constructor of a class that needs dependencies
 * 
 * @param token - Token to resolve (can be a class or string token)
 * @returns The resolved dependency
 * 
 * Usage:
 *   constructor() {
 *     this.service = inject('MyService');
 *     // or using class as token:
 *     this.service = inject(MyService);
 *   }
 */
export function inject<T>(token: string | Function): T {
  const container = DIContainer.getInstance();
  const key = typeof token === 'function' ? token.name : token;
  return container.resolve<T>(key);
}

/**
 * Helper function to register an instance
 * Useful for registering stores or other instances
 * 
 * @param token - Token to register under
 * @param instance - The instance to register
 */
export function registerInstance<T>(token: string, instance: T): void {
  const container = DIContainer.getInstance();
  container.registerInstance(token, instance);
}

/**
 * Helper function to register a factory
 * 
 * @param token - Token to register under
 * @param factory - Factory function
 * @param singleton - Whether to cache the instance
 */
export function registerFactory<T>(token: string, factory: () => T, singleton: boolean = true): void {
  const container = DIContainer.getInstance();
  container.registerFactory(token, factory, singleton);
}

/**
 * Property decorator for documentation purposes
 * NOTE: Due to TypeScript limitations, this does NOT perform actual injection.
 * You still need to call `inject()` in the constructor.
 * 
 * @param token - Optional custom token
 */
export function Inject(token?: string): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    // This decorator only marks the property for documentation
    // Actual injection must be done via inject() in constructor
    const injectToken = token || propertyKey.toString();
    
    // Store metadata for potential reflection-based DI in the future
    const ctor = target.constructor as any;
    if (!ctor._injections) {
      ctor._injections = [];
    }
    
    ctor._injections.push({
      property: propertyKey.toString(),
      token: injectToken,
    });
  };
}
