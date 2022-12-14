import express from "express";
import qrcode from "qrcode-terminal";
import cors from "cors";
import { Client, LocalAuth } from "whatsapp-web.js"; //@ts-ignore
import fs, { writeFileSync } from "fs";
import path from "path";
import axios from "axios";
const baseUrl: string =
  "https://script.google.com/macros/s/AKfycbyPFqFnKqnp7nfvt6VBbHOZuEj6pKlay-0Y_TjAngi2r8gfKZ_iQeegdeOItpF3iTvu/exec";
const app = express();
const PORT = process.env.PORT || 5000;

/* 
** Aliases
type User = {
  readonly id: number,
  name: string,
  retire: (date:Date) =< void
}


** Union types

function kgToLbs(weight: number | string): number {
if(typeof weight ==='number') return weight * 2.2
return parseInt(wight) * 2.2

}

literal types 

type DoorStatus = 'open' | 'close'
let current status = 'close'

*/
const client = new Client({ authStrategy: new LocalAuth() });

app.set("trust proxy", 1); // trust first proxy
client.on("qr", (qr: any) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});
//npm i --save-dev @types/node
// ******************************** SERVER INIT **************************************//
app.get("/", (_req, res): void => {
  res.send("Hello World!");
});
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.listen(PORT, () => console.log(`server? listening on port` + PORT));
//******************************  main sript  *************************************/

app.post("/api/sendMsgs", async (req, res) => {
  let { numbers, msg } = await req.body;
  let actionLog: any[] = [];
  let record: any;
  let isArrey: boolean = Array.isArray(msg);

  if (isArrey && msg.length != numbers.length)
    return res.send({ status: "no", data: "msg arrey != numbers arrey" });

  try {
    for (let i = 0; i <= numbers.length - 1; i++) {
      let log = ``;
      let Message = `${isArrey ? msg[i] : msg}`;
      await client
        .isRegisteredUser(`${numbers[i]}@c.us`)
        .then(function (isRegistered: any) {
          if (isRegistered) {
            client.sendMessage(`${numbers[i]}@c.us`, Message);
            record = { number: numbers[i], status: "ok", row: i, msg: Message };
          } else {
            log = `***** ${numbers[i]} is not registerd ******`;
            record = {
              number: numbers[i],
              status: "registretion error",
              row: i,
              msg: log,
            };
          }
        })
        .catch((err: any) => {
          record = {
            number: numbers[i],
            status: "catch error",
            row: i,
            msg: err,
          };
        });
      actionLog.push(record);
    }
  } catch (e) {
    res.send(e);
  }
  console.log(actionLog);
  return res.send(JSON.stringify(actionLog));
});

client.on("message", async (message) => {
  let file = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, `./sendPremmision.json`), "utf8")
  );

  console.log(file);
  if (message.body == "1111" && file.isAllowed == false) {
    file.isAllowed = true;
    writeFileSync(
      path.resolve(__dirname, `./sendPremmision.json`),
      JSON.stringify(file)
    );
    client.sendMessage(message.from, "?????? ?");
  }
  if (
    file.isAllowed &&
    parseInt(message.body) != NaN &&
    message.body != "1111"
  ) {
    let amount = parseInt(message.body);
    let res = await axios.get(`${baseUrl}?act=true&amount=${amount}`, {
      withCredentials: true,
    });
    file.isAllowed = false;
    writeFileSync(
      path.resolve(__dirname, `./sendPremmision.json`),
      JSON.stringify(file)
    );
    sendToJews(res.data.numbers, res.data.msg, message.from, res.data.total);
    //client.sendMessage(message.from, "????????");
    console.log(res.data);
  }

  // const constructedUrl = `${msgUrl}?from=${JSON.stringify(
  //   message.from
  // )}&name=${JSON.stringify(message._data.notifyName)}&msg=${JSON.stringify(
  //   message.body
  // )}`;
  // console.log(constructedUrl);
  // axios.get(constructedUrl);
});
client
  .initialize()
  .then(() => console.log("client initialize ....\n to init in initializ"))
  .catch((err: any) => console.log(err));

async function sendToJews(
  numbers: string | any[],
  msg: any,
  clientn: any,
  total: string
) {
  let actionLog: any[] = [];
  let record: any;

  try {
    for (let i = 0; i <= numbers.length - 1; i++) {
      let log = ``;
      await client
        .isRegisteredUser(`${numbers[i]}@c.us`)
        .then(function (isRegistered: any) {
          if (isRegistered) {
            client.sendMessage(`${numbers[i]}@c.us`, msg);
            record = { number: numbers[i], status: "ok", row: i, msg: msg };
          } else {
            log = `***** ${numbers[i]} is not registerd ******`;
            record = {
              number: numbers[i],
              status: "registretion error",
              row: i,
              msg: log,
            };
          }
        })
        .catch((err: any) => {
          record = {
            number: numbers[i],
            status: "catch error",
            row: i,
            msg: err,
          };
        });
      actionLog.push(record);
    }
  } catch (e) {
    return client.sendMessage(clientn, "????????");
  }
  console.log(actionLog);
  return client.sendMessage(clientn, `????????.\n ???? ?????????? ??${total}`);
}

module.exports = client;
