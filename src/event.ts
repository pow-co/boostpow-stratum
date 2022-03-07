import { log } from './log'

export class Event {
  properties: object;

  constructor(properties: object) {
    this.properties = properties
  }

  get(property: string) {
    return this.properties[property]
  }
};

var events : Event[];

export class Events {

  static log(event: Event) {
    events.push(new Event(event));
    log(event);
  }

  static last(who: String | undefined): Event | undefined {
    if (events.length == 0) {
      return
    }

    if (typeof who === undefined) {
      return events[events.length - 1]
    }

    for (let i = events.length; i > 0; i--) {
      let v: Event = events[i - 1]
      if (v['who'] == who) {
        return v
      }
    }

    return
  }

  static list(who: String | undefined): Event[] {
    if (typeof who === undefined) {
      return events;
    }

    var filtered = [];

    events.forEach((event: Event) => {
      if (event['who'] === who) {
        filtered.push(event);
      }
    });

    return filtered;

  }
}
