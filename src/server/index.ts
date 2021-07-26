import Koa from "koa";
import Router from "koa-router";
import Logger from "koa-logger";
import BodyParser from "koa-bodyparser";
import Cors, { Options } from "koa2-cors";

import { routesTable } from "./routes/routesTable";

const port = process.env.PORT || 8001;
const app = new Koa();
const router = new Router();

const corsOptions: Options = {
  origin: `*`,
};

app.use(Cors(corsOptions));
app.use(Logger());
app.use(BodyParser());

// temporary root stub. will be host static content soon
router.get("/", (ctx) => {
  ctx.response.body = JSON.stringify({
    message: "Welcome to Bell server application.",
  });
});

Object.keys(routesTable).forEach((route: string) =>
  routesTable[route](router as Router<string, unknown>, route)
);

app.use(router.routes());
app.listen(port);
