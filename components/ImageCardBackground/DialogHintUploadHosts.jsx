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
            description: t("upload_host_imageshack_desc")
        },
        {
            name: "Imgur",
            url: "https://imgur.com/",
            description: t("upload_host_imgur_desc")
        },
        {
            name: "ImgBB",
            url: "https://imgbb.com/",
            description: t("upload_host_imgbb_desc")
        }
    ];

    return (
        <div className={styles.Overlay} onClick={onClose}>
            <div className={styles.Dialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.Header}>
                    <h3>{t("upload_hosts_title")}</h3>
                    <button className={styles.CloseButton} onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className={styles.Content}>
                    <p className={styles.Description}>{t("upload_hosts_description")}</p>
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

