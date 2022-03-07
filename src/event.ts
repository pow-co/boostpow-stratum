import { log } from './log'

export interface Event {
  who: String
};

var events : Event[];

export class Events {

  static log(event: Event) {
    events.push(new Event(event));
    log(event);
  }

  static last(who: String | undefined): Event | undefined {
    if (events.size() == 0) {
      return
    }

    if (typeof who === undefined) {
      return events[events.size() - 1]
    }

    for (let i = events.size(); i > 0; i--) {
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

    filtered = [];

    events.forEach(event: Event => {
      if (event['who'] === who) {
        filtered.push(event);
      }
    });

    return filtered;

  }
}
