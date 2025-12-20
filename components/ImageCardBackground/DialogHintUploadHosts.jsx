import { useTranslation } from "react-i18next";
import styles from "./DialogHintUploadHosts.module.scss";

export default function DialogHintUploadHosts({ isOpen, onClose }) {
    const { t } = useTranslation();

    if (!isOpen) {
        return null;
    }

    const uploadHosts = [
        {
            name: "ImageShack",
            url: "https://imageshack.com/",
            description: t("dialog_hint_upload_hosts.imageshack_desc")
        },
        {
            name: "Imgur",
            url: "https://imgur.com/",
            description: t("dialog_hint_upload_hosts.imgur_desc")
        },
        {
            name: "ImgBB",
            url: "https://imgbb.com/",
            description: t("dialog_hint_upload_hosts.imgbb_desc")
        }
    ];

    return (
        <div className={styles.Overlay} onClick={onClose}>
            <div className={styles.Dialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.Header}>
                    <h3>{t("dialog_hint_upload_hosts.title")}</h3>
                    <button className={styles.CloseButton} onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className={styles.Content}>
                    <p className={styles.Description}>{t("dialog_hint_upload_hosts.description")}</p>
                    <ul className={styles.HostList}>
                        {uploadHosts.map((host) => (
                            <li key={host.name} className={styles.HostItem}>
                                <a 
                                    href={host.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={styles.HostLink}
                                >
                                    {host.name}
                                </a>
                                <span className={styles.HostDescription}>{host.description}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

