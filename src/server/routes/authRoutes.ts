import Router from "koa-router";
import { authHandler } from "../handlers";
export const authRoute = (
  router: Router<string, unknown>,
  path: string
): void => {
  router.post(path, (ctx): void => {
    authHandler(ctx);
  });
};
