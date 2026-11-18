import { Redirect } from "expo-router";
import { useSessionStore } from "../features/auth/store/sessionStore";

export default function IndexRoute() {
  const session = useSessionStore((state) => state.session);
  return <Redirect href={session ? "/inventory" : "/sign-in"} />;
}
