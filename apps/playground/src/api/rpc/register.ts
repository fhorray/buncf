import { handleAction } from "buncf";
import { registerUser } from "../../actions";

export default (req: Request) => handleAction(req, registerUser);
