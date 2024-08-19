import PopupWindow from "../.widgethacks/popupwindow.js";
import OnScreenKeyboard from "./onscreenkeyboard.js";

export default () =>
    PopupWindow({
        anchor: ["bottom"],
        name: "osk",
        child: OnScreenKeyboard(),
    });
