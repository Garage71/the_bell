import { ParameterizedContext } from "koa";
import Router from "koa-router";
import { spawnSync } from "child_process";
import jwt from "jsonwebtoken";
import { secret } from "../authConfig";

export const authHandler = (
  ctx: ParameterizedContext<
    unknown,
    Router.IRouterParamContext<string, unknown>,
    Record<string, string> | Record<string, unknown> | string
  >
): void => {
  const scriptFile = "app/scripts/login.ps1";
  const { name, password } = ctx.body as Record<string, string>;

  const cmd2 = `powershell.exe -ExecutionPolicy ByPass -File ${scriptFile} ${name} `;
  console.log("----->" + cmd2);
  let data: string | null = null;
  let errCode: number | null;

  let groups = "";
  try {
    const execRes = spawnSync(
      "powershell.exe",
      ["-ExecutionPolicy", "ByPass", "-File", scriptFile, name, password],
      { encoding: "utf-8" }
    );
    data = execRes.stdout;
    const err = execRes.stderr;
    if (err) {
      console.log(err);
      ctx.response.status = 500;
      ctx.response.body = `Error executing script ${scriptFile}: ${err}`;
      return;
    }
    errCode = execRes.status;
    data = data.replace(/\n$/, "");
    console.log(data);
  } catch (error) {
    errCode = error.status; // Might be 127 in your example.
    //error.message; // Holds the message you typically want.
    //error.stderr;  // Holds the stderr output. Use `.toString()`.
    //error.stdout;  // Holds the stdout output. Use `.toString()`.
    console.error("ERROR, CODE= " + errCode + ", " + error.message);
    return;
  }

  if (errCode === 1) {
    ctx.response.status = 401;
    ctx.response.body = {
      accessToken: null,
      message: "Invalid User or Password!",
    };
    return;
  }

  //#line 1, return groups, for ex 'RO;RW'
  //#line 2..n returns root elements, always in the format: friendly name|class|type|tags

  const arr = data?.split("\n").map((el, index) => {
    if (index === 0) {
      groups = el.replace(/\n$/, "");
      groups = groups.replace(/\r$/, "");
      return {
        id: null,
        name: null,
        nodeclass: null,
        nodetype: null,
        nodetags: null,
        children: null,
      };
    } else {
      const a = el.split("|");
      const obj: Record<string, unknown> = {
        id: "login" + index.toString(),
        name: a[0],
        nodeclass: a[1],
        nodetype: a[2],
        nodetags: a[3].replace(/\r$/, ""),
        children: a[2] === "folder" ? [] : null,
      };
      if (a[2] !== "folder") {
        delete obj.children;
      }
      return obj;
    }
  });
  arr.shift(); // remove groups (1st element)

  const token = jwt.sign({ id: name, groups: groups }, secret, {
    expiresIn: 3600, // 8 hour // 86400 = 24 hours
  });

  ctx.request.body;
  ctx.response.status = 200;
  ctx.response.body = {
    name,
    groups: groups,
    rootItems: arr,
    accessToken: token,
  };
  ctx.set(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
};
