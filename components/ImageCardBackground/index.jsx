import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useTemplate } from "../../context/TemplateContext";
import styles from "./styles.module.scss";
import { SUPPORTED_IMAGE_MIME_TYPES } from "../../extra/consts";

export default function ImageCardBackground({ children, drawer, showUnrenderedStyles, ...props }) {
    const fileIn = useRef();
    const urlIn = useRef();
    const { state, actions } = useTemplate();
    const { t } = useTranslation();
    const [sourceMode, setSourceMode] = useState("file"); // "file" 或 "url"

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

    function handleUrlChange() {
        const url = urlIn.current.value.trim();
        if (url) {
            actions.setBackgroundImage(url);
        }
    }

	return (
		<div className={styles.ImageCardBackground} ref={drawer} {...props}>
            <div className={styles.Content}>
                { children }
            </div>
			<img src={state.background.imageSrc || ""} alt="" />
            {!state.background.imageSrc && (
                <div className={styles.HintText}>
                    { t("background_hint_text") }
                </div>
            )}
            <div className={styles.Toolbar}>
                <select
                    value={sourceMode}
                    onChange={(e) => setSourceMode(e.target.value)}
                    style={{ marginRight: "0.5rem" }}
                >
                    <option value="file">{t("background_source_file")}</option>
                    <option value="url">{t("background_source_url")}</option>
                </select>
                {sourceMode === "file" ? (
                    <input 
                        type="file" 
                        accept={SUPPORTED_IMAGE_MIME_TYPES.join(",")} 
                        onChange={sauceChg} 
                        ref={fileIn} 
                    />
                ) : (
                    <input 
                        type="text" 
                        placeholder={t("background_url_input_placeholder")}
                        onBlur={handleUrlChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleUrlChange();
                            }
                        }}
                        ref={urlIn}
                        style={{ padding: "0.25rem 0.5rem", minWidth: "200px" }}
                    />
                )}
                <select
                    onChange={(e) => {
                        // 順序：最頂(top) 或最底(bottom)
                        actions.setBackgroundImageOrder(e.target.value);
                    }}
                    value={state.background.imageOrder || "top"}
                    style={{ marginLeft: "0.5rem" }}
                    title={t("background_image_order_tip")}
                >
                    <option value="top">{t("background_on_top")}</option>
                    <option value="bottom">{t("background_on_bottom")}</option>
                </select>
            </div>
		</div>
	);
}