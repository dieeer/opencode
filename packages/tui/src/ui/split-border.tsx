import { RGBA } from "@opentui/core"
import { useTheme } from "../context/theme"

export function SplitBorder() {
  const { theme } = useTheme()
  return (
    <box
      width={1}
      flexDirection="column"
      justifyContent="center"
    >
      <text fg={RGBA.fromHex("#555555")} selectable={false}>
        {"│"}
      </text>
    </box>
  )
}
