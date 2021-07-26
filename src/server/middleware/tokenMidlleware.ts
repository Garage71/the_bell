import jwt from "jsonwebtoken";
import { Next, ParameterizedContext } from "koa";
import Router from "koa-router";
import { secret } from "../authConfig";

export const verifyToken = (
  ctx: ParameterizedContext<
    unknown,
    Router.IRouterParamContext<string, unknown>,
    Record<string, string> | Record<string, unknown> | string
  >,
  next: Next
): void => {
  const token = ctx.req.headers["x-access-token"];

  if (!token) {
    ctx.response.status = 403;
    ctx.response.body = {
      message: "No token provided!",
    };
    return;
  }

  jwt.verify(token as string, secret, (err, decoded) => {
    if (err) {
      ctx.response.status = 401;
      ctx.response.body = {
        message: "Unauthorized, re-login required.",
      };
      return;
    }
    const body = ctx.request.body as Record<string, unknown>;
    body.userId = decoded?.id;
    body.userGroups = decoded?.groups;

    next();
  });
};
