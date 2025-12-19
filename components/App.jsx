import React, { Fragment, useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { originalToUrl, urlToOriginal } from "compact-base64";
import pako from "pako";
import FileSaver from "file-saver";
import Dom2Image from 'dom-to-image';

import { useTemplate } from "@/context/TemplateContext";
import ImageCardBackground from "@/components/ImageCardBackground/";
import CharacterImageLoader from "@/components/CharacterImageLoader/";
import TextDisplay from "@/components/TextDisplay/";
import DialogExportText from "@/components/DialogExportText/";
import DialogImportText from "@/components/DialogImportText/";

import styles from "./styles.module.scss";

const App = () => {
	const { t } = useTranslation();
	const { state, actions } = useTemplate();
	const drawer = useRef();
	const [showUnrenderedStyles, setShowUnrenderedStyles] = useState(true);
	const [showExportTextDialog, setShowExportTextDialog] = useState(false);
	const [exportTextJson, setExportTextJson] = useState("");
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
		setShowUnrenderedStyles(true);
		// 清除 selected，隱藏所有 borders 同 toolbars
		actions.setSelectedId(null);
		
		// 等待一下確保 DOM 更新
		await new Promise(resolve => setTimeout(resolve, 100));
		
		const otherDivs = document.querySelectorAll(".app > *:not(.drawer)");

		otherDivs.forEach(e => e.style.display = "none");

		const dataUrl = await Dom2Image.toPng(drawer.current, {
			quality: .95,
		});

		FileSaver.saveAs(dataUrl, `${t("_out_filename")}.jpg`);
		otherDivs.forEach(e => e.style.display = "");
		setShowUnrenderedStyles(false);
	}

	function exportTemplate() {
		// 收集所有 template 數據
		const templateData = {
			background: {
				imageSrc: state.background.imageSrc,
				size: state.background.size
			},
			characters: state.characters.map(char => ({
				id: char.id,
				position: char.position,
				size: char.size,
				imageDataUrl: char.imageDataUrl,
				imageRenderMode: char.imageRenderMode || "contain"
			})),
			texts: state.texts.map(text => ({
				id: text.id,
				position: text.position,
				text: text.text,
				fontFamily: text.fontFamily,
				fontSize: text.fontSize,
				isBold: text.isBold,
				isItalic: text.isItalic,
				isUnderline: text.isUnderline,
				isStrikethrough: text.isStrikethrough,
				color: text.color,
				textAlign: text.textAlign || "left",
				widthMode: text.widthMode || "auto",
				width: text.width || 200,
				inputType: text.inputType || "single"
			}))
		};

		// 轉換成 JSON，壓縮，然後以 URL-safe base64 encode
		const jsonString = JSON.stringify(templateData);
		// 用 pako.deflate 壓縮（返回 Uint8Array）
		const compressed = pako.deflate(jsonString);
		// 將 Uint8Array 轉成 base64 string（用 chunk 方式避免 stack overflow）
		let binaryString = '';
		for (let i = 0; i < compressed.length; i += 8192) {
			binaryString += String.fromCharCode.apply(null, compressed.slice(i, i + 8192));
		}
		const base64String = btoa(binaryString);
		// 用 compact-base64 轉成 URL-safe base64
		const encodedData = originalToUrl(base64String);
		
		// 生成 URL
		const baseUrl = window.location.origin + window.location.pathname;
		const url = `${baseUrl}?template=${encodedData}`;

		// 複製到剪貼板
		navigator.clipboard.writeText(url).then(() => {
			alert(t("export_url_copied") || "URL 已複製到剪貼板！");
		}).catch(err => {
			console.error("Failed to copy URL:", err);
			// Fallback: 顯示在 prompt
			prompt(t("export_url") || "請複製以下 URL:", url);
		});
	}

	function getTemplateData() {
		return {
			background: {
				imageSrc: state.background.imageSrc,
				size: state.background.size
			},
			characters: state.characters.map(char => ({
				id: char.id,
				position: char.position,
				size: char.size,
				imageDataUrl: char.imageDataUrl,
				imageRenderMode: char.imageRenderMode || "contain"
			})),
			texts: state.texts.map(text => ({
				id: text.id,
				position: text.position,
				text: text.text,
				fontFamily: text.fontFamily,
				fontSize: text.fontSize,
				isBold: text.isBold,
				isItalic: text.isItalic,
				isUnderline: text.isUnderline,
				isStrikethrough: text.isStrikethrough,
				color: text.color,
				textAlign: text.textAlign || "left",
				widthMode: text.widthMode || "auto",
				width: text.width || 200,
				inputType: text.inputType || "single"
			}))
		};
	}

	function computeExportText(useBase64Option) {
		const templateData = getTemplateData();
		
		if (useBase64Option) {
			// 轉換成 JSON，壓縮，然後以 URL-safe base64 encode
			const jsonString = JSON.stringify(templateData);
			// 用 pako.deflate 壓縮（返回 Uint8Array）
			const compressed = pako.deflate(jsonString);
			// 將 Uint8Array 轉成 base64 string（用 chunk 方式避免 stack overflow）
			let binaryString = '';
			for (let i = 0; i < compressed.length; i += 8192) {
				binaryString += String.fromCharCode.apply(null, compressed.slice(i, i + 8192));
			}
			const base64String = btoa(binaryString);
			// 用 compact-base64 轉成 URL-safe base64
			return originalToUrl(base64String);
		} else {
			// 轉換成格式化的 JSON string（不壓縮）
			return JSON.stringify(templateData, null, 2);
		}
	}

	function exportAsText() {
		const text = computeExportText(useBase64);
		setExportTextJson(text);
		setShowExportTextDialog(true);
	}

	function handleUseBase64Change(newValue) {
		setUseBase64(newValue);
		// 當 checkbox 改變時，重新計算 export text
		const text = computeExportText(newValue);
		setExportTextJson(text);
	}

	function handleImportTemplate(templateData) {
		try {
			actions.loadTemplate(templateData);
			alert(t("import_text_success") || "Template 載入成功！");
		} catch (error) {
			console.error("Failed to import template:", error);
			alert(t("import_text_error_unknown") || "載入 template 失敗");
		}
	}

	// 檢查 URL query string 並載入 template
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const templateParam = urlParams.get("template");
		
		if (templateParam) {
			try {
				// 使用 compact-base64 以 URL-safe base64 解碼，然後解壓縮
				const base64String = urlToOriginal(templateParam);
				// 將 base64 string 轉成 Uint8Array
				const binaryString = atob(base64String);
				const compressed = Uint8Array.from(binaryString, c => c.charCodeAt(0));
				// 用 pako.inflate 解壓縮
				const decodedJson = pako.inflate(compressed, { to: 'string' });
				const templateData = JSON.parse(decodedJson);
				
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

	return (
		<div className={styles.App}>
			<div className={styles.Toolbar}>
				<div className={styles.ToolbarLeft}>
					<button onClick={() => actions.addTextDisplay()}>
						{ t("add_text") }
					</button>
					&nbsp;
					<button onClick={() => actions.addCharacter()}>
						{ t("add_character_image") }
					</button>
					&nbsp;
					<button
						id="save"
						onClick={saveImage}
						disabled={!state.background.imageSrc}
					>
						{ t("save_image") }
					</button>
				</div>
				<div className={styles.ToolbarRight}>
					<label style={{ display: "inline-flex", alignItems: "center", gap: "0.4em" }}>
						<input
							type="checkbox"
							id="showUnrenderedStyles"
							checked={showUnrenderedStyles}
							onChange={e => setShowUnrenderedStyles(e.target.checked)}
						/>
						{ t("toggle_unrendered_styles") }
					</label>
					&nbsp;
					<button 
						onClick={exportTemplate}
						disabled={state.background.imageSrc && state.background.imageSrc.startsWith("data:")}
						title={(state.background.imageSrc && state.background.imageSrc.startsWith("data:")) 
							? t("export_url_disabled_tooltip") 
							: t("export_url")}
					>
						{ t("export_url")}
					</button>
					&nbsp;
					<button onClick={exportAsText}>
						{ t("export_text") }
					</button>
					&nbsp;
					<button onClick={() => setShowImportTextDialog(true)}>
						{ t("import_text") }
					</button>
				</div>
			</div>
			
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
						className={styles.Z1}
						key={id} 
						id={id} 
						index={index + 1}
						registerRef={registerRef}
						unregisterRef={unregisterRef}
						showBorder={showUnrenderedStyles}
					/>
				))
			}
			{
				state.texts.map(({ id }) => (
					<TextDisplay 
						className={styles.Z3}
						key={id} 
						id={id} 
						registerRef={registerRef}
						unregisterRef={unregisterRef}
						showBorder={showUnrenderedStyles}
					/>
				))
			}
			</ImageCardBackground>
			<DialogExportText
				isOpen={showExportTextDialog}
				onClose={() => setShowExportTextDialog(false)}
				jsonText={exportTextJson}
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