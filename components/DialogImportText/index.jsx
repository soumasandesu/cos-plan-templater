import { useState } from "react";
import { useTranslation } from "react-i18next";
import { urlToOriginal } from "compact-base64";
import pako from "pako";
import styles from "./styles.module.scss";

export default function DialogImportText({ isOpen, onClose, onImport }) {
    const { t } = useTranslation();
    const [inputText, setInputText] = useState("");
    const [error, setError] = useState("");

    if (!isOpen) {
        return null;
    }

    const handleImport = () => {
        setError("");
        
        if (!inputText.trim()) {
            setError(t("dialog_import_text.error_empty") || "請輸入 template 資料");
            return;
        }

        try {
            let templateData;

            // 嘗試解析為 JSON
            try {
                templateData = JSON.parse(inputText.trim());
            } catch (jsonError) {
                // 如果 JSON 解析失敗，嘗試作為 base64 解碼
                try {
                    // 使用 compact-base64 以 URL-safe base64 解碼
                    const base64String = urlToOriginal(inputText.trim());
                    // 將 base64 string 轉成 Uint8Array
                    const binaryString = atob(base64String);
                    const compressed = Uint8Array.from(binaryString, c => c.charCodeAt(0));
                    // 用 pako.inflate 解壓縮
                    const decodedJson = pako.inflate(compressed, { to: 'string' });
                    templateData = JSON.parse(decodedJson);
                } catch (base64Error) {
                    throw new Error(t("dialog_import_text.error_invalid") || "無法解析 template 資料，請確認格式正確");
                }
            }

            // 驗證 template 結構
            if (!templateData || typeof templateData !== 'object') {
                throw new Error(t("import_text_error_invalid") || "Template 資料格式不正確");
            }

            // 調用 onImport 回調
            onImport(templateData);
            setInputText("");
            onClose();
        } catch (err) {
            setError(err.message || t("dialog_import_text.error_unknown") || "載入失敗");
            console.error("Import error:", err);
        }
    };

    const handleClose = () => {
        setInputText("");
        setError("");
        onClose();
    };

    return (
        <div className={styles.Overlay} onClick={handleClose}>
            <div className={styles.Dialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.Header}>
                    <h3>{t("dialog_import_text.title")}</h3>
                    <button className={styles.CloseButton} onClick={handleClose}>
                        ×
                    </button>
                </div>
                <div className={styles.Content}>
                    <p className={styles.Description}>{t("dialog_import_text.description")}</p>
                    {error && (
                        <div className={styles.ErrorMessage}>
                            {error}
                        </div>
                    )}
                    <textarea
                        className={styles.TextArea}
                        value={inputText}
                        onChange={(e) => {
                            setInputText(e.target.value);
                            setError("");
                        }}
                        placeholder={t("dialog_import_text.placeholder")}
                    />
                    <div className={styles.Actions}>
                        <button className={styles.ImportButton} onClick={handleImport}>
                            {t("dialog_import_text.button")}
                        </button>
                        <button className={styles.CloseDialogButton} onClick={handleClose}>
                            {t("dialog_import_text.close_button")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

