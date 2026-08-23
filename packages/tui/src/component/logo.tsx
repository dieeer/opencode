import { RGBA, TextAttributes } from "@opentui/core"
import { type JSX } from "solid-js"

const NEON_YELLOW = RGBA.fromHex("#FFE500")

export function Logo(): JSX.Element {
  return (
    <box flexDirection="column" alignItems="center">
      <text fg={NEON_YELLOW} attributes={TextAttributes.BOLD} selectable={false}>
        {"  ██▀▀█ █▀▀█ █▀▄▀█ █▀▀▄ █▀▀█ █▀▀█ █▀▀▀ █▀▀▀ █▀▀▄ █▀▀█  "}
      </text>
      <text fg={NEON_YELLOW} attributes={TextAttributes.BOLD} selectable={false}>
        {"  █___█ █▄▄▀ █_▀_█ █▀▀▄ █▄▄█ █▄▄▀ █___ █___ █▀▀▄ █▄▄█  "}
      </text>
      <text fg={NEON_YELLOW} attributes={TextAttributes.BOLD} selectable={false}>
        {"  ▀▀▀▀▀ ▀__▀ ▀___▀ ▀▀▀  ▀▀▀▀ ▀__▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀  ▀▀▀▀  "}
      </text>
    </box>
  )
}
