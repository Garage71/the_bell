import Router from "koa-router";
import { authRoute } from "./authRoutes";
import { allAccessRoute, expandRoute, getContentRoute } from "./dataRoutes";

export const routesTable: {
  [index: string]: (router: Router<string, unknown>, path: string) => void;
} = {
  "/api/auth/signin": authRoute,
  "/api/v1/all": allAccessRoute,
  "/api/v1/expand": expandRoute,
  "/api/v1/getContent": getContentRoute,
};
