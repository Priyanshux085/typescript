import { Box, type IBox } from "@box";

type ExtractBoxContent<T> = T extends Box<infer U>
  ? U extends Box<unknown>
    ? ExtractBoxContent<U>
    : U
  : never;

type BoxRegistryType<Boxes extends Record<string, Box<unknown>>> = {
  [K in keyof Boxes]: ExtractBoxContent<Boxes[K]>
}

interface IBoxRegistry<T> extends IBox<T> {
  register<Boxes extends Record<string, Box<unknown>>>(boxes: Boxes): BoxRegistryType<Boxes>;
}

export class BoxRegistry<T> extends Box<T> implements IBoxRegistry<T> {

  register<Boxes extends Record<string, Box<unknown>>>(boxes: Boxes): BoxRegistryType<Boxes> {
    const ans = {} as BoxRegistryType<Boxes>;
    // console.log("Registering boxes:", boxes);

    for (const key in boxes) {
      if (!Object.hasOwn(boxes, key)) continue;

      const typedKey = key as keyof Boxes;
      // console.log(`Typed key: ${typedKey.toString()}`);
      
      const box = boxes[typedKey];
      console.log(`Box content for key ${typedKey.toString()}:`, box?.content);

      if (!box) continue;
      ans[typedKey] = box.content as BoxRegistryType<Boxes>[typeof typedKey];
    }

    return Object.freeze(ans);
  }
}

const registry = new BoxRegistry<string>("Registry Content");
const result = registry.register({
  userBox: new Box<string>("User Content"),
  countBox: new Box<number>(42)
});

console.log(result);