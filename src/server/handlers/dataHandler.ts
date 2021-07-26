import fs from "fs";
import { spawnSync } from "child_process";
import { ParameterizedContext } from "koa";
import Router from "koa-router";

export const allAccess = (
  ctx: ParameterizedContext<
    unknown,
    Router.IRouterParamContext<string, unknown>,
    Record<string, string> | Record<string, unknown> | string | unknown
  >
): void => {
  ctx.response.status = 200;
  ctx.response.body = "Welcome to Bell public content";
};

export const expand = (
  ctx: ParameterizedContext<
    unknown,
    Router.IRouterParamContext<string, unknown>,
    Record<string, string> | Record<string, unknown> | string | unknown
  >
): void => {
  try {
    const dir = fs.opendirSync("app/scripts");
    let dirEnt: fs.Dirent | null;
    let arrFull = [];
    const requestBody = ctx.request.body as Record<string, unknown>;
    while ((dirEnt = dir.readSync()) !== null) {
      const itm = requestBody.item as Record<string, unknown>;
      if (dirEnt.name.startsWith(itm.nodeclass + "_")) {
        const scriptFile = "app/scripts/" + dirEnt.name;
        const auditFile = "app/scripts/audit.ps1";
        let data;
        let err;
        let execRes;

        if (scriptFile.endsWith(".ps1")) {
          // PowerShell script
          const userName = requestBody.userId as string;
          const userGroups = requestBody.userGroups as string;
          const nodeName = itm.name as string;
          const nodeTags = itm.nodetags as string;
          const creds = `"${userName}" "${userGroups}" "${nodeName}" "${nodeTags}"`;
          const cmd = `powershell.exe -ExecutionPolicy ByPass -File ${scriptFile} ${creds}`;
          console.log("=====>" + cmd);
          try {
            if (fs.existsSync(auditFile)) {
              try {
                const auditRes = spawnSync(
                  "powershell.exe",
                  [
                    "-ExecutionPolicy",
                    "ByPass",
                    "-File",
                    auditFile,
                    userName,
                    userGroups,
                    nodeName,
                    nodeTags,
                  ],
                  { encoding: "utf-8" }
                );
                const auditErr = auditRes.stderr;
                if (auditErr) {
                  console.log(err);
                  ctx.response.status = 500;
                  ctx.response.body = "Error in audit, contact administrator";
                  return;
                }
              } catch (error) {
                console.error("ERROR IN AUDIT: " + error.message);
                ctx.response.status = 500;
                ctx.response.body = "Error in audit, contact administrator";
                return;
              }
            }

            execRes = spawnSync(
              "powershell.exe",
              [
                "-ExecutionPolicy",
                "ByPass",
                "-File",
                scriptFile,
                userName,
                userGroups,
                nodeName,
                nodeTags,
              ],
              { encoding: "utf-8" }
            );
            data = execRes.stdout;
            err = execRes.stderr;
            if (err) {
              console.log(err);
              ctx.response.status = 500;
              ctx.response.body = `Error executing script ${scriptFile} : ${err}`;
              return;
            }
            data = data.replace(/\n$/, "");
            console.log(data);
          } catch (error) {
            console.error("ERROR: " + error.message);
            ctx.response.status = 500;
            ctx.response.body = `Error executing script ${scriptFile} : ${error.message}`;
            return;
          }
          data = data.replace(/\r$/, "");
        } else if (scriptFile.endsWith(".txt")) {
          data = fs.readFileSync(scriptFile, "utf8");
        } else {
          continue;
        }

        // name | class | type | tags
        const arr = data.split("\n").map(function (el, index) {
          const a = el.split("|");
          const obj: Record<string, unknown> = {
            id: itm.id + "." + dirEnt?.name + "." + index.toString(), // Generate unique node id
            name: a[0] ? a[0] : "(No data)",
            nodeclass: a[1],
            nodetype: typeof a[2] !== "undefined" ? a[2] : "empty",
            nodetags:
              typeof a[3] !== "undefined" ? a[3].replace(/\r$/, "") : "",
            children: a[2] == "folder" ? [] : null,
          };
          if (a[2] !== "folder") {
            delete obj.children;
          }
          return obj;
        });

        arrFull.push(...arr);
      }
    }
    dir.closeSync();
    arrFull = arrFull.sort((a, b) => {
      if (
        (a.name as string).toString().toLowerCase() <
        (b.name as string).toString().toLowerCase()
      )
        return -1;
      if (
        (a.name as string).toString().toLowerCase() >
        (b.name as string).toString().toLowerCase()
      )
        return 1;
      return 0;
    });

    ctx.response.status = 200;
    ctx.response.body = arrFull;
    return;
  } catch (err) {
    console.error(err);
    ctx.response.status = 500;
    ctx.response.body = err.message;
    return;
  }
};

export const getContent = (
  ctx: ParameterizedContext<
    unknown,
    Router.IRouterParamContext<string, unknown>,
    Record<string, string> | Record<string, unknown> | string | unknown
  >
): void => {
  try {
    const requestBody = ctx.request.body as Record<string, unknown>;
    const itm = requestBody.item as Record<string, unknown>;
    const scriptFile = `app/scripts/${itm.nodeclass}.ps1`;
    const auditFile = "app/scripts/audit.ps1";

    if (fs.existsSync(scriptFile)) {
      let data;
      let err;
      let execRes;

      // PowerShell script
      const userName = requestBody.userId as string;
      const userGroups = requestBody.userGroups as string;
      const nodeName = itm.name as string;
      const nodeTags = itm.nodetags as string;

      const creds = `"${userName}" "${userGroups}" "${nodeName}" "${nodeTags}"`;
      const cmd = `powershell.exe -ExecutionPolicy ByPass -File ${scriptFile} ${creds}`;
      console.log("=====>" + cmd);

      try {
        if (fs.existsSync(auditFile)) {
          try {
            const auditRes = spawnSync(
              "powershell.exe",
              [
                "-ExecutionPolicy",
                "ByPass",
                "-File",
                auditFile,
                userName,
                userGroups,
                nodeName,
                nodeTags,
              ],
              { encoding: "utf-8" }
            );
            const auditErr = auditRes.stderr;
            if (auditErr) {
              console.log(err);
              ctx.response.status = 500;
              ctx.response.body = "Error in audit, contact administrator";
              return;
            }
          } catch (error) {
            console.error("ERROR IN AUDIT: " + error.message);
            ctx.response.status = 500;
            ctx.response.body = "Error in audit, contact administrator";
            return;
          }
        }

        execRes = spawnSync(
          "powershell.exe",
          [
            "-ExecutionPolicy",
            "ByPass",
            "-File",
            scriptFile,
            userName,
            userGroups,
            nodeName,
            nodeTags,
          ],
          { encoding: "utf-8" }
        );
        data = execRes.stdout;
        err = execRes.stderr;
        if (err) {
          console.log(err);
          ctx.response.status = 500;
          ctx.response.body = `Error executing script ${scriptFile} : ${err}`;
          return;
        }
        data = data.replace(/\n$/, "");
        console.log(data);
      } catch (error) {
        console.error("ERROR: " + error.message);
        ctx.response.status = 500;
        ctx.response.body = `Error executing script ${scriptFile} : ${error.message}`;
        return;
      }

      if (itm.nodetype === "file") {
        // File name returned

        let fileName;
        try {
          fileName = data.replace(/\r$/, "");
          data = fs.readFileSync(fileName, "utf8");
          const shortName = fileName.replace(/^.*[\\]/, "");
          data = shortName + "@" + data;
        } catch (err) {
          console.error(err);
          ctx.response.status = 500;
          ctx.response.body = `File for download not found: ${escape(
            fileName as string
          )}`;
          return;
        }
      }
      ctx.response.status = 200;
      ctx.response.body = data;
      return;
    } else {
      ctx.response.status = 500;
      ctx.response.body = `Script ${scriptFile} not found`;
      return;
    }
  } catch (err) {
    console.error(err);
    ctx.response.status = 500;
    ctx.response.body = err.message;
    return;
  }
};
