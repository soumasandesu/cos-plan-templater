import { useRef, useState, useEffect } from "react";
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
    const hiddenImgRef = useRef(null);
    const [blobImageSrc, setBlobImageSrc] = useState(null);
    const blobUrlRef = useRef(null);

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

    // 將圖片轉換成 blob
    function convertImageToBlob(imgElement) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = imgElement.naturalWidth;
                canvas.height = imgElement.naturalHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(imgElement, 0, 0);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        // 清理舊的 blob URL
                        if (blobUrlRef.current) {
                            URL.revokeObjectURL(blobUrlRef.current);
                        }
                        
                        const blobUrl = URL.createObjectURL(blob);
                        blobUrlRef.current = blobUrl;
                        resolve(blobUrl);
                    } else {
                        reject(new Error("Failed to convert canvas to blob"));
                    }
                }, "image/png");
            } catch (error) {
                reject(error);
            }
        });
    }

    // 處理 hidden img 載入完成
    async function handleHiddenImageLoad(e) {
        const img = e.target;
        
        // 如果係 data URL，直接使用，唔需要轉換
        if (state.background.imageSrc && state.background.imageSrc.startsWith("data:")) {
            setBlobImageSrc(state.background.imageSrc);
            return;
        }

        // 如果係外部 URL，轉換成 blob
        try {
            const blobUrl = await convertImageToBlob(img);
            setBlobImageSrc(blobUrl);
        } catch (error) {
            console.error("Failed to convert image to blob:", error);
            // 如果轉換失敗，使用原始 URL
            setBlobImageSrc(state.background.imageSrc);
        }
    }

    // 當 imageSrc 改變時，重置 blobImageSrc
    useEffect(() => {
        setBlobImageSrc(null);
        
        // 如果係 data URL，直接使用
        if (state.background.imageSrc && state.background.imageSrc.startsWith("data:")) {
            setBlobImageSrc(state.background.imageSrc);
        }
    }, [state.background.imageSrc]);

    // 清理 blob URL
    useEffect(() => {
        return () => {
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = null;
            }
        };
    }, []);

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

			{/* Hidden img 用嚟載入外部圖片，載入完成後轉成 blob */}
            {state.background.imageSrc && !state.background.imageSrc.startsWith("data:") && (
                <img
                    ref={hiddenImgRef}
                    src={state.background.imageSrc}
                    crossOrigin="anonymous"
                    onLoad={handleHiddenImageLoad}
                    alt=""
                    style={{ display: "none" }}
                />
            )}

            {/* 顯示用嘅 img，用 blob URL 或 data URL */}
            {blobImageSrc && (
                <img
                    className={ClassNames({
                        imgClassName,
                        [styles.SeeThrough]: state.background.imageOrder === "before_characters",
                    })}
                    src={blobImageSrc}
                    alt=""
                    {...imgProps}
                />
            )}

            {!state.background.imageSrc && showUnrenderedStyles && (
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