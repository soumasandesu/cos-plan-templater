import { useRef } from "react";
import ClassNames from "classnames";

import { useTemplate } from "../../context/TemplateContext";
import styles from "./styles.module.scss";
import { SUPPORTED_IMAGE_MIME_TYPES } from "../../extra/consts";

export default function ImageCardBackground({ children, drawer, className, ...props }) {
    const fileIn = useRef();
    const { state, actions } = useTemplate();

    function sauceChg() {
        const file = fileIn.current.files[0];
        if (!file) {
            return;
        }

        const fr = new FileReader();
        fr.addEventListener("load", () => {
            // fr.result 就係個 data URL / base64 URL
            actions.setBackgroundImage(fr.result);
        });
        fr.readAsDataURL(file);
    }

	return (
		<div className={ClassNames(styles.ImageCardBackground, className)} ref={drawer} {...props}>
            <div className={styles.Content}>
                { children }
            </div>
			<img src={state.background.imageSrc || ""} alt="" />
            <div className={styles.FileIn}>
                <input type="file" accept={SUPPORTED_IMAGE_MIME_TYPES.join(",")} onChange={sauceChg} ref={fileIn} />
            </div>
		</div>
	);
}