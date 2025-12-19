import React, { Fragment, useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import FileSaver from "file-saver";
import Dom2Image from 'dom-to-image';

import { useTemplate } from "@/context/TemplateContext";
import ImageCardBackground from "@/components/ImageCardBackground/";
import CharacterImageLoader from "@/components/CharacterImageLoader/";
import TextDisplay from "@/components/TextDisplay/";

import styles from "./styles.module.scss";

const App = () => {
	const { t } = useTranslation();
	const { state, actions } = useTemplate();
	const drawer = useRef();
	const [isExporting, setIsExporting] = useState(false);
	
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
		setIsExporting(true);
		// 清除 selected，隱藏所有 borders 同 toolbars
		actions.setSelectedId(null);
		
		// 等待一下確保 DOM 更新
		await new Promise(resolve => setTimeout(resolve, 100));
		
		const otherDivs = document.querySelectorAll(".app > *:not(.drawer)");

		otherDivs.forEach(e => e.style.display = "none");

		const dataUrl = await Dom2Image.toPng(drawer.current, {
			quality: .9
		});

		FileSaver.saveAs(dataUrl, `${t("_out_filename")}.jpg`);
		otherDivs.forEach(e => e.style.display = "");
		setIsExporting(false);
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

		// 轉換成 JSON 並 base64 encode
		const jsonString = JSON.stringify(templateData);
		const encodedData = btoa(unescape(encodeURIComponent(jsonString)));
		
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

	// 檢查 URL query string 並載入 template
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const templateParam = urlParams.get("template");
		
		if (templateParam) {
			try {
				// Base64 decode 並 parse JSON
				const decodedData = decodeURIComponent(escape(atob(templateParam)));
				const templateData = JSON.parse(decodedData);
				
				// 載入 template
				actions.loadTemplate(templateData);
				
				// 清除 URL 中的 query string（可選）
				// window.history.replaceState({}, document.title, window.location.pathname);
			} catch (error) {
				console.error("Failed to load template from URL:", error);
				alert(t("import_error") || "載入 template 失敗");
			}
		}
	}, []); // 只在 mount 時執行一次

	return (
		<div className={styles.App}>
			<div className={styles.Toolbar}>
				<button onClick={() => actions.addTextDisplay()}>
					{ t("add_text") }
				</button>
				&nbsp;
				<button onClick={() => actions.addCharacter()}>
					{ t("add_character_image") }
				</button>
				&nbsp;
				<button id="save" onClick={saveImage}>{ t("save_image") }</button>
				&nbsp;
				<button onClick={exportTemplate}>{ t("export_url") || "Export URL" }</button>
			</div>
			
		    <ImageCardBackground
				id="drawer"
				drawer={drawer}
				className={isExporting ? undefined : "ShowBorders"}
			>
			{
				state.characters.map(({ id }, index) => (
					<CharacterImageLoader 
						key={id} 
						id={id} 
						index={index + 1}
						registerRef={registerRef}
						unregisterRef={unregisterRef}
					/>
				))
			}
			{
				state.texts.map(({ id }) => (
					<TextDisplay 
						key={id} 
						id={id} 
						registerRef={registerRef}
						unregisterRef={unregisterRef}
					/>
				))
			}
			</ImageCardBackground>
		</div>
	)
};

export default App;