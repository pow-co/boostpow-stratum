#!/usr/bin/env ts-node

import { program } from "commander";

import { log } from "../log";

import { connectClient } from "../socket.io/client";

program.command("tail [url]").action(async (url = "http://127.0.0.1:5300") => {
  try {
    let client = await connectClient(url);

    client.on("log", async (event) => {
      JSON.stringify(event, null, 4);
    });

    client.on("message", async (message) => {
      console.log(message);
    });
  } catch (error) {
    console.error("bin.client.connect.error", { msg: error.message });
  }
});

program.parse(process.argv);
