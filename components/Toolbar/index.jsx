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
    const { t, i18n: i18nInstance } = useTranslation();
    
    // 獲取所有已註冊的 locales
    const availableLocales = Object.keys(i18nInstance.options.resources || {});
    
    const handleLocaleChange = (e) => {
        const newLocale = e.target.value;
        i18nInstance.changeLanguage(newLocale);
    };
    
    // 獲取指定 locale 的語言名稱
    const getLocaleName = (localeCode) => {
        return t("_lang", { lng: localeCode }) || localeCode;
    };

    return (
        <div className={styles.Toolbar}>
            <div className={styles.ToolbarFloatRight}>
                <select
                    className={styles.LanguageSelect}
                    value={i18nInstance.language}
                    onChange={handleLocaleChange}
                >
                    {availableLocales.map((localeCode) => (
                        <option key={localeCode} value={localeCode}>
                            {getLocaleName(localeCode)}
                        </option>
                    ))}
                </select>
            </div>
            <div className={styles.ToolbarInner} style={maxWidth > 800 ? { maxWidth: maxWidth } : {}}>
                <div className={styles.ToolbarLeft}>
                    <button onClick={onAddText}>
                        {t("toolbar.add_text")}
                    </button>
                    <button onClick={onAddCharacter}>
                        {t("toolbar.add_character_image")}
                    </button>
                    <button
                        id="save"
                        onClick={onSaveImage}
                        disabled={isSaveDisabled}
                    >
                        {t("toolbar.save_image")}
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
                        {t("toolbar.toggle_unrendered_styles")}
                    </label>
                    <button 
                        onClick={onExportUrl}
                        disabled={exportUrlDisabled}
                        title={exportUrlTooltip}
                    >
                        {t("toolbar.export_url")}
                    </button>
                    <button onClick={onExportText}>
                        {t("toolbar.export_text")}
                    </button>
                    <button onClick={onImportText}>
                        {t("toolbar.import_text")}
                    </button>
                </div>
            </div>
        </div>
    );
}

