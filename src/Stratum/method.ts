export type method = string

export let methods: method[] = [
  "client.get_version",
  "client.show_message",
  "mining.authorize",
  "mining.configure",
  "mining.notify",
  "mining.set_difficulty",
  "mining.set_extranonce",
  "mining.set_version_mask",
  "mining.submit",
  "mining.subscribe"
]

export class Method {
  static valid(p: method): boolean {
    for (let m of methods) {
      if (p === m) {
        return true
      }
    }

    return false
  }
}
