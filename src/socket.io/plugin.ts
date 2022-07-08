require("dotenv").config();

const socketio = require("socket.io");

import { Socket } from "socket.io";

import { Sockets } from "./sockets";

import { Server } from "@hapi/hapi";

import { authenticate } from "./auth";

import { log } from "../log";

export const plugin = (() => {
  return {
    name: "socket.io",

    register: function (server: Server, options, next) {
      const path = "/v1/socketio";

      //const io = socketio(server.listener, { path })
      const io = socketio(server.listener);

      log.info("socket.io.started", { path });

      io.use(async (socket, next) => {
        const { address } = socket.handshake;

        await authenticate(socket);

        log.info("socket.io.authenticated", { address });

        socket.emit("authenticated");

        next();
      });

      io.on("connection", async function (socket) {
        const { address } = socket.handshake;

        log.info("socket.io.connection", { address });

        Sockets.connect(socket);

        socket.on("disconnect", () => {
          log.info("socket.io.disconnect", socket.info);

          Sockets.disconnect(socket);
        });
      });
    },
  };
})();

if (require.main === module) {
  (async () => {
    const server = new Server({
      host: process.env.HOST || "localhost",
      port: process.env.PORT || 8001,
      routes: {
        cors: true,
      },
    });

    await server.register(plugin);

    log.info("socket.io.server.start");

    await server.start();

    log.info("socket.io.server.started", server.info);
  })();
}
