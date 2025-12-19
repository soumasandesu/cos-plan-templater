import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useTemplate } from "../../context/TemplateContext";
import styles from "./styles.module.scss";
import { SUPPORTED_IMAGE_MIME_TYPES } from "../../extra/consts";
import DialogHintUploadHosts from "./DialogHintUploadHosts";
import ClassNames from "classnames";

export default function ImageCardBackground({
    className,
    children,
    drawer,
    showUnrenderedStyles,
    imgProps: {
        className: imgClassName,
        ...imgProps
    } = {},
    ...props
}) {
    const fileIn = useRef();
    const urlIn = useRef();
    const { state, actions } = useTemplate();
    const { t } = useTranslation();
    const [sourceMode, setSourceMode] = useState("file"); // "file" 或 "url"
    const [showDialog, setShowDialog] = useState(false);

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
		<div
            className={ClassNames(styles.ImageCardBackground, {
                [styles.CheckerBackground]: showUnrenderedStyles,
            },
            className,
        )}
            ref={drawer}
            {...props}
        >
            <div className={styles.Content}>
                { children }
            </div>

			<img
                className={ClassNames({
                    imgClassName,
                    [styles.SeeThrough]: state.background.imageOrder === "before_characters",
                })}
                src={state.background.imageSrc || ""}
                alt=""
                {...imgProps}
            />

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
                    <>
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
                            style={{ margin: "0.5em 0", padding: 1, minWidth: "200px" }}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowDialog(true)}
                            title={t("upload_hosts_help_button")}
                            style={{ 
                                marginLeft: "0.5rem", 
                                padding: "0.25rem 0.5rem",
                                cursor: "pointer",
                                background: "#007bff",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "0.875rem"
                            }}
                        >
                            ?
                        </button>
                    </>
                )}
                <select
                    onChange={(e) => {
                        // 順序：最頂(top) 或最底(bottom)
                        actions.setBackgroundImageOrder(e.target.value);
                    }}
                    value={state.background.imageOrder}
                    style={{ marginLeft: "0.5rem" }}
                    title={t("background_image_order_tip")}
                >
                    <option value="before_characters">{t("background_on_top_of_characters")}</option>
                    <option value="bottom">{t("background_on_bottom")}</option>
                </select>
                {state.background.imageSrc && (
                    <button
                        type="button"
                        onClick={() => actions.setBackgroundImage(null)}
                        title={t("clear_background")}
                        style={{
                            marginLeft: "0.5rem",
                            padding: "0.25rem",
                            cursor: "pointer",
                            background: "#dc3545",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "0.875rem"
                        }}
                    >
                        {t("clear_background")}
                    </button>
                )}
            </div>
            <DialogHintUploadHosts 
                isOpen={showDialog} 
                onClose={() => setShowDialog(false)} 
            />
		</div>
	);
}