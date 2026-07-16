import React, { useRef, useState, useEffect, useCallback } from 'react';
import ClassNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { originalToUrl, urlToOriginal } from "compact-base64";
import pako from "pako";
import FileSaver from "file-saver";
import Dom2Image from 'dom-to-image-more';

import { useTemplate } from "@/context/TemplateContext";
import ImageCardBackground from "@/components/ImageCardBackground/";
import CharacterImageLoader from "@/components/CharacterImageLoader/";
import TextDisplay from "@/components/TextDisplay/";
import DialogExportText from "@/components/DialogExportText/";
import DialogImportText from "@/components/DialogImportText/";
import Toolbar from "@/components/Toolbar/";

import styles from "./styles.module.scss";
import { serialize as serializeTemplateData, deserialize as deserializePayload } from '../util/templateSerializerDeserializer';

const App = () => {
	const { t } = useTranslation();
	const { state, actions } = useTemplate();
	const drawer = useRef();
	const [showUnrenderedStyles, setShowUnrenderedStyles] = useState(true);
	const [showExportTextDialog, setShowExportTextDialog] = useState(false);
	const [exportText, setExportText] = useState("");
	const [useBase64, setUseBase64] = useState(true);
	const [showImportTextDialog, setShowImportTextDialog] = useState(false);

	// 收集所有 component refs
	const componentRefs = useRef(new Map()); // id -> ref

	const registerRef = useCallback((id, ref) => {
		componentRefs.current.set(id, ref);
	}, []);

	const unregisterRef = useCallback((id) => {
		componentRefs.current.delete(id);
	}, []);

	// Document click handler 檢查點擊係咪喺 component 外部
	useEffect(() => {
		function handleDocumentClick(e) {
			// 檢查點擊係咪喺任何 component 內部
			const clickedInsideComponent = Array.from(componentRefs.current.values())
				.some(ref => ref.current && ref.current.contains(e.target));

			// 如果點擊喺 component 外部，且有 selected component，就清除 selected
			if (!clickedInsideComponent && state.selectedId) {
				actions.setSelectedId(null);
			}
		}

		document.addEventListener('click', handleDocumentClick);
		return () => {
			document.removeEventListener('click', handleDocumentClick);
		};
	}, [state.selectedId, actions]);

	async function saveImage() {
		setShowUnrenderedStyles(false);
		// 清除 selected，隱藏所有 borders 同 toolbars
		actions.setSelectedId(null);

		// 等待一下確保 DOM 更新
		await new Promise(resolve => setTimeout(resolve, 100));

		const dataUrl = await Dom2Image.toPng(drawer.current, {
			quality: .95,
		});

		FileSaver.saveAs(dataUrl, `${t("app._out_filename")}.jpg`);
		setShowUnrenderedStyles(true);
	}

	function exportTemplate() {
		const encodedData = computeExportText();

		// 生成 URL
		const baseUrl = window.location.origin + window.location.pathname;
		const url = `${baseUrl}?template=${encodedData}`;

		// 複製到剪貼板
		navigator.clipboard.writeText(url).then(() => {
			alert(t("toolbar.export_url_copied") || "URL 已複製到剪貼板！");
		}).catch(err => {
			console.error("Failed to copy URL:", err);
			// Fallback: 顯示在 prompt
			prompt(t("export_url") || "請複製以下 URL:", url);
		});
	}

	function computeExportText() {
		const codedText = serializeTemplateData(state);
		const base64String = new TextEncoder().encode(codedText).toBase64();
		// 用 compact-base64 轉成 URL-safe base64
		return originalToUrl(base64String);
	}

	function exportAsText() {
		const text = computeExportText(useBase64);
		setExportText(text);
		setShowExportTextDialog(true);
	}

	function handleUseBase64Change(newValue) {
		setUseBase64(newValue);
		// 當 checkbox 改變時，重新計算 export text
		const text = computeExportText(newValue);
		setExportText(text);
	}

	function handleImportTemplate(urlBase64String) {
		try {
			const base64String = urlToOriginal(urlBase64String);
			const codedText = new TextDecoder().decode(Uint8Array.fromBase64(base64String));
			const templateData = deserializePayload(codedText);

			// 載入 template
			actions.loadTemplate(templateData);
			alert(t("dialog_import_text.success") || "Template 載入成功！");
		} catch (error) {
			console.error("Failed to import template:", error);
			alert(t("dialog_import_text.error_unknown") || "載入 template 失敗");
		}
	}

	// 檢查 URL query string 並載入 template
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const urlBase64String = urlParams.get("template");

		if (urlBase64String) {
			try {
				// 使用 compact-base64 以 URL-safe base64 解碼，然後解壓縮
				const base64String = urlToOriginal(urlBase64String);
				const codedText = new TextDecoder().decode(Uint8Array.fromBase64(base64String));
				const templateData = deserializePayload(codedText);

				// 載入 template
				actions.loadTemplate(templateData);

				// 清除 URL 中的 query string（可選）
				// window.history.replaceState({}, document.title, window.location.pathname);
			} catch (error) {
				console.error("Failed to load template from URL:", error);
				alert(t("import_error") || "載入 template 失敗 Failed to load template.");
			}
		}
	}, []); // 只在 mount 時執行一次

	const [toolbarMaxWidth, setToolbarMaxWidth] = useState(0);
	useEffect(() => {
		setToolbarMaxWidth(drawer?.current?.offsetWidth);
	}, [state.background.imageSrc]);

	return (
		<div className={styles.App}>
			<Toolbar
				onAddText={() => actions.addTextDisplay()}
				onAddCharacter={() => actions.addCharacter()}
				onSaveImage={saveImage}
				showUnrenderedStyles={showUnrenderedStyles}
				onToggleUnrenderedStyles={setShowUnrenderedStyles}
				onExportUrl={exportTemplate}
				onExportText={exportAsText}
				onImportText={() => setShowImportTextDialog(true)}
				isSaveDisabled={!state.background.imageSrc && !state.background.google_drive_file_id}
				exportUrlDisabled={state.background.imageSrc && state.background.imageSrc.startsWith("data:")}
				exportUrlTooltip={(state.background.imageSrc && state.background.imageSrc.startsWith("data:"))
					? t("toolbar.export_url_disabled_tooltip")
					: t("toolbar.export_url")}
				maxWidth={toolbarMaxWidth}
			/>

			<ImageCardBackground
				id="drawer"
				drawer={drawer}
				showUnrenderedStyles={showUnrenderedStyles}
				imgProps={{
					className: state.background.imageOrder === "before_characters" ? styles.Z2 : styles.Z0,
				}}
			>
				{
					state.characters.map(({ id }, index) => (
						<CharacterImageLoader
							className={ClassNames({
								[styles.Z1]: state.selectedId !== id,
								[styles.Z10]: state.selectedId === id,
							})}
							key={id}
							id={id}
							index={index + 1}
							registerRef={registerRef}
							unregisterRef={unregisterRef}
							showUnrenderedStyles={showUnrenderedStyles}
						/>
					))
				}
				{
					state.texts.map(({ id }) => (
						<TextDisplay
							className={ClassNames({
								[styles.Z3]: state.selectedId !== id,
								[styles.Z10]: state.selectedId === id,
							})}
							key={id}
							id={id}
							registerRef={registerRef}
							unregisterRef={unregisterRef}
							showUnrenderedStyles={showUnrenderedStyles}
						/>
					))
				}
			</ImageCardBackground>
			<DialogExportText
				isOpen={showExportTextDialog}
				onClose={() => setShowExportTextDialog(false)}
				jsonText={exportText}
				useBase64={useBase64}
				onUseBase64Change={handleUseBase64Change}
			/>
			<DialogImportText
				isOpen={showImportTextDialog}
				onClose={() => setShowImportTextDialog(false)}
				onImport={handleImportTemplate}
			/>
		</div>
	)
};

export default App;