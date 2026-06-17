import type { ListContext, RouterData } from "../types.js";

type AliasQuery = Record<string, string>;
type AliasOverrides = Partial<Pick<RouterData, "title" | "type" | "description" | "link" | "params">>;
type RouteHandler =
  | ((c: ListContext, noCache: boolean) => Promise<unknown>)
  | ((c: undefined, noCache: boolean) => Promise<unknown>);

const createAliasContext = (c: ListContext, query: AliasQuery): ListContext => {
  const reqProxy = new Proxy(c.req, {
    get(target, prop, receiver) {
      if (prop === "query") {
        return (key?: string) => {
          if (typeof key === "string" && key in query) {
            return query[key];
          }
          if (typeof key === "string") {
            return target.query(key);
          }
          return target.query();
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });

  return new Proxy(c, {
    get(target, prop, receiver) {
      if (prop === "req") {
        return reqProxy;
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as ListContext;
};

export const createRouteAlias = (
  baseHandler: RouteHandler,
  aliasName: string,
  query: AliasQuery,
  overrides: AliasOverrides = {},
) => {
  return async (c: ListContext, noCache: boolean) => {
    const routeData = (await baseHandler(createAliasContext(c, query) as never, noCache)) as RouterData;
    return {
      ...routeData,
      ...overrides,
      name: aliasName,
    };
  };
};
