import { useTranslation } from "react-i18next";
import styles from "./styles.module.scss";

export default function DialogExportText({ isOpen, onClose, jsonText, useBase64, onUseBase64Change }) {
    const { t } = useTranslation();

    if (!isOpen) {
        return null;
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsonText);
            alert(t("export_text_copied") || "已複製到剪貼板！");
        } catch (err) {
            console.error("Failed to copy:", err);
            // Fallback: 選中 textarea 內容
            const textarea = document.getElementById("export-text-textarea");
            if (textarea) {
                textarea.select();
                textarea.setSelectionRange(0, 99999); // For mobile devices
            }
        }
    };

    return (
        <div className={styles.Overlay} onClick={onClose}>
            <div className={styles.Dialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.Header}>
                    <h3>{t("export_text_title")}</h3>
                    <button className={styles.CloseButton} onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className={styles.Content}>
                    <p className={styles.Description}>{t("export_text_description")}</p>
                    <label className={styles.CheckboxLabel}>
                        <input
                            type="checkbox"
                            checked={useBase64}
                            onChange={(e) => onUseBase64Change(e.target.checked)}
                        />
                        {t("export_text_use_base64")}
                    </label>
                    <textarea
                        id="export-text-textarea"
                        className={styles.TextArea}
                        value={jsonText}
                        readOnly
                        onClick={(e) => e.target.select()}
                    />
                    <div className={styles.Actions}>
                        <button className={styles.CopyButton} onClick={handleCopy}>
                            {t("export_text_copy_button")}
                        </button>
                        <button className={styles.CloseDialogButton} onClick={onClose}>
                            {t("export_text_close_button")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

