import { createContext, useContext } from "solid-js"

export type SplitPaneContext = {
  sessionID: string
  pane: "left" | "right"
  callsign?: string
}

const splitPaneContext = createContext<SplitPaneContext>()

export function useSplitPane() {
  return useContext(splitPaneContext)
}

export { splitPaneContext }
