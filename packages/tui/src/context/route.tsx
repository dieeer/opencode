import { createStore, reconcile } from "solid-js/store"
import { createSimpleContext } from "./helper"
import type { PromptInfo } from "../prompt/history"
import { useTuiStartup } from "./runtime"
import { nextCallsign } from "../util/agent-names"

export type HomeRoute = {
  type: "home"
  prompt?: PromptInfo
}

export type SessionRoute = {
  type: "session"
  sessionID: string
  prompt?: PromptInfo
}

export type PluginRoute = {
  type: "plugin"
  id: string
  data?: Record<string, unknown>
}

export type SplitRoute = {
  type: "split"
  left: string
  right: string
  focus: "left" | "right"
  leftCallsign?: string
  rightCallsign?: string
}

export type Route = HomeRoute | SessionRoute | PluginRoute | SplitRoute

export const { use: useRoute, provider: RouteProvider } = createSimpleContext({
  name: "Route",
  init: (props: { initialRoute?: Route }) => {
    const startup = useTuiStartup()
    const [store, setStore] = createStore<Route>(
      props.initialRoute ?? initialRoute(startup.initialRoute) ?? { type: "home" },
    )

    return {
      get data() {
        return store
      },
      navigate(route: Route) {
        setStore(reconcile(route))
      },
      split: {
        open(newSessionID: string) {
          const prev = store
          if (prev.type === "session") {
            setStore(
              reconcile({
                type: "split",
                left: prev.sessionID,
                right: newSessionID,
                focus: "right",
                leftCallsign: nextCallsign(),
                rightCallsign: nextCallsign(),
              } satisfies SplitRoute),
            )
          } else if (prev.type === "split") {
            setStore(
              reconcile({
                type: "split",
                left: prev.focus === "left" ? prev.left : prev.right,
                right: newSessionID,
                focus: "right",
                leftCallsign: prev.focus === "left" ? prev.leftCallsign : prev.rightCallsign,
                rightCallsign: nextCallsign(),
              } satisfies SplitRoute),
            )
          }
        },
        toggleFocus() {
          const prev = store
          if (prev.type !== "split") return
          setStore(
            reconcile({
              ...prev,
              focus: prev.focus === "left" ? "right" : "left",
            } satisfies SplitRoute),
          )
        },
        close(pane: "left" | "right") {
          const prev = store
          if (prev.type !== "split") return
          const keepSession = pane === "left" ? prev.right : prev.left
          setStore(
            reconcile({
              type: "session",
              sessionID: keepSession,
            } satisfies SessionRoute),
          )
        },
      },
    }
  },
})

function initialRoute(value: unknown): Route | undefined {
  if (!value || typeof value !== "object" || !("type" in value)) return
  if (value.type === "home") return { type: "home" }
  if (value.type === "session" && "sessionID" in value && typeof value.sessionID === "string") {
    return { type: "session", sessionID: value.sessionID }
  }
  if (value.type === "plugin" && "id" in value && typeof value.id === "string") {
    return { type: "plugin", id: value.id }
  }
  if (
    value.type === "split" &&
    "left" in value &&
    "right" in value &&
    "focus" in value &&
    typeof value.left === "string" &&
    typeof value.right === "string" &&
    (value.focus === "left" || value.focus === "right")
  ) {
    return { type: "split", left: value.left, right: value.right, focus: value.focus }
  }
}

export type RouteContext = ReturnType<typeof useRoute>

export function useRouteData<T extends Route["type"]>(type: T) {
  const route = useRoute()
  return route.data as Extract<Route, { type: typeof type }>
}
