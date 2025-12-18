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
				<button id="save" onClick={saveImage}>{ t("output") }</button>
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