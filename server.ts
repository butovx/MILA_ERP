const https = require("https");
const fs = require("fs");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const options = {
  key: fs.readFileSync("192.168.0.11-key.pem"),
  cert: fs.readFileSync("192.168.0.11.pem"),
};

app.prepare().then(() => {
  https
    .createServer(options, (req: any, res: any) => {
      handle(req, res);
    })
    .listen(443, (err: Error | null) => {
      if (err) throw err;
      console.log("> Ready on https://192.168.0.11");
    });
});
