import Router from "koa-router";
import { allAccess, expand, getContent } from "../handlers";
import { verifyToken } from "../middleware/tokenMidlleware";
export const allAccessRoute = (
  router: Router<string, unknown>,
  path: string
): void => {
  router.post(path, (ctx): void => {
    allAccess(ctx);
  });
};

export const expandRoute = (
  router: Router<string, unknown>,
  path: string
): void => {
  router.post(path, verifyToken, (ctx): void => {
    ctx.set(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    expand(ctx);
  });
};

export const getContentRoute = (
  router: Router<string, unknown>,
  path: string
): void => {
  router.post(path, verifyToken, (ctx): void => {
    ctx.set(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    getContent(ctx);
  });
};
