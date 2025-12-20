import { useTranslation } from "react-i18next";
import styles from "./styles.module.scss";

export default function Toolbar({
    onAddText,
    onAddCharacter,
    onSaveImage,
    showUnrenderedStyles,
    onToggleUnrenderedStyles,
    onExportUrl,
    onExportText,
    onImportText,
    isSaveDisabled,
    exportUrlDisabled,
    exportUrlTooltip,
    maxWidth
}) {
    const { t } = useTranslation();

    return (
        <div className={styles.Toolbar}>
            <div className={styles.ToolbarInner} style={maxWidth > 800 ? { maxWidth: maxWidth } : {}}>
                <div className={styles.ToolbarLeft}>
                    <button onClick={onAddText}>
                        {t("add_text")}
                    </button>
                    <button onClick={onAddCharacter}>
                        {t("add_character_image")}
                    </button>
                    <button
                        id="save"
                        onClick={onSaveImage}
                        disabled={isSaveDisabled}
                    >
                        {t("save_image")}
                    </button>
                </div>
                <div className={styles.ToolbarRight}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "0.4em" }}>
                        <input
                            type="checkbox"
                            id="showUnrenderedStyles"
                            checked={showUnrenderedStyles}
                            onChange={e => onToggleUnrenderedStyles(e.target.checked)}
                        />
                        {t("toggle_unrendered_styles")}
                    </label>
                    <button 
                        onClick={onExportUrl}
                        disabled={exportUrlDisabled}
                        title={exportUrlTooltip}
                    >
                        {t("export_url")}
                    </button>
                    <button onClick={onExportText}>
                        {t("export_text")}
                    </button>
                    <button onClick={onImportText}>
                        {t("import_text")}
                    </button>
                </div>
            </div>
        </div>
    );
}

