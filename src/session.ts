import { Event, Events } from "./event";

import { log } from "./log";

import * as net from "net";

import * as uuid from "uuid";
import { JSONValue } from "./json";

interface HostPort {
  ip: string;
  port: number;
}

export type Sessions = {
  [key: string]: Session;
};

const sessions: Sessions = {};

type SessionId = string;

interface NewSession {
  socket: net.Socket;
}

export type Connection = {
  send: (j: JSONValue) => void;
  close: () => void;
};

export type Receive = (msg: JSONValue) => void;

export type Protocol = (conn: Connection) => Receive;

export class Session {
  sessionId: SessionId;

  connectedAt: Date;

  socket: net.Socket;

  open: boolean;

  handleMessage: Receive;

  incompleteMsgs: string;

  constructor({ socket }: NewSession, remote: Protocol) {
    this.connectedAt = new Date();

    this.sessionId = uuid.v4();

    this.socket = socket;

    this.open = true;

    this.incompleteMsgs = "";

    this.handleMessage = remote({
      send: this.sendJSON.bind(this),
      close: this.disconnect.bind(this),
    });

    log.info("socket.connect", {
      remoteAddress: this.socket.remoteAddress,

      remotePort: this.socket.remotePort,

      sessionId: this.sessionId,
    });

    this.socket.on("close", () => {
      log.info("socket.close", { sessionId: this.sessionId });

      delete sessions[this.sessionId];

      this.open = false;
    });

    this.socket.on("error", (error) => {
      log.error("socket.error", { error, sessionId: this.sessionId });
    });

    this.socket.on("data", (data) => {
      this.incompleteMsgs += data.toString();
      while (this.incompleteMsgs.includes("\n")) {
        const curPoint = this.incompleteMsgs.indexOf("\n");
        const msg = this.incompleteMsgs.substring(0, curPoint);
        this.incompleteMsgs = this.incompleteMsgs.substring(curPoint + 1);
        this.handleMessage(JSON.parse(msg));
      }
    });

    sessions[this.sessionId] = this;
  }

  sendJSON(x: JSONValue): void {
    this.socket.write(`${JSON.stringify(x)}\n`);
  }

  disconnect() {
    this.socket.end();
  }

  toJSON() {
    return {
      remoteAddress: this.socket.remoteAddress,

      remotePort: this.socket.remotePort,

      sessionId: this.sessionId,
    };
  }
}

export async function listSessions(): Promise<Sessions> {
  return sessions;
}
