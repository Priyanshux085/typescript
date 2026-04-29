/**
 * Dependency Injection Module
 * 
 * Usage:
 *   import { DIContainer, inject, Injectable } from "@collaro/di";
 *   
 *   @Injectable()
 *   class MyService { ... }
 *   
 *   const container = DIContainer.getInstance();
 *   const service = container.resolve(MyService.name);
 *   // or using helper:
 *   const service = inject(MyService);
 */

export { DIContainer } from "./container";
export { inject, Injectable, registerInstance, registerFactory } from "./decorators";
