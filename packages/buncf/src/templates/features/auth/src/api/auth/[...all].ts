
import { auth } from "@/lib/auth";
export default (req: Request) => auth.handler(req);
