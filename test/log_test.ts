import { expect, spy } from "./utils";

import { models } from "../src/models";

import * as uuid from "uuid";

import { log } from "../src/log";

import * as through from "through2";

describe("Log", () => {
  describe("persisting events", () => {
    it("should persit logs to the database", async () => {
      const session_id = "3349334324234";

      let record = await log.info("client.authorized", {
        ip: "127.0.0.1",
        session_id,
      });

      expect(record.id).to.be.greaterThan(0);

      expect(record.type).to.be.equal("client.authorized");

      expect(record.payload.session_id).to.be.equal(session_id);

      expect(record.createdAt).to.be.a("date");

      expect(record.error).to.be.equal(false);
    });

    it("should log synchronously as well and not wait", async () => {
      spy.on(models.Event, ["create"]);

      log.info("my.event", { good: { better: "best" } });

      expect(models.Event.create).to.have.been.called();
    });
  });

  describe("Reading the log", () => {
    it("should get the last message logged", async () => {
      const uid = uuid.v4();

      let record = await log.info("share.submitted", { uid });

      let [event] = await log.read({
        type: "share.submitted",

        limit: 1,

        order: "desc",
      });

      expect(event.payload.uid).to.be.equal(uid);

      expect(event.type).to.be.equal("share.submitted");
    });

    it("allows ordering desc or asc", async () => {
      const eventType = uuid.v4();

      await log.info(eventType, { nonce: 1 });
      await log.info(eventType, { nonce: 2 });
      await log.info(eventType, { nonce: 3 });

      let [firstEvent] = await log.read({
        type: eventType,

        order: "asc",
      });

      expect(firstEvent.payload.nonce).to.be.equal(1);

      let [lastEvent] = await log.read({
        type: eventType,

        order: "desc",
      });

      expect(lastEvent.payload.nonce).to.be.equal(3);
    });

    it("allows specifying a payload query and offset", async () => {
      const eventType = uuid.v4();

      await log.info(eventType, { region: "pacific", nonce: 1 });

      await log.info(eventType, { region: "pacific", nonce: 2 });

      await log.info(eventType, { region: "atlantic", nonce: 2 });

      let [atlantic] = await log.read({
        type: eventType,

        payload: { region: "atlantic" },
      });

      expect(atlantic.payload.nonce).to.be.equal(2);
      expect(atlantic.payload.region).to.be.equal("atlantic");

      let [pacific] = await log.read({
        type: eventType,

        payload: { region: "pacific" },
      });

      expect(pacific.payload.nonce).to.be.equal(1);

      let [secondPacific] = await log.read({
        type: eventType,

        payload: { region: "pacific" },

        offset: 1,
      });

      expect(secondPacific.payload.nonce).to.be.equal(2);
    });

    it("should read the log for all types together", async () => {
      await log.info("type.a");
      await log.info("type.b");

      let events = await log.read({
        order: "desc",
        limit: 2,
      });

      expect(events[0].type).to.be.equal("type.b");
      expect(events[1].type).to.be.equal("type.a");
    });
  });
});
