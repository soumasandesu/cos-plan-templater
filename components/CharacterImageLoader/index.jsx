import { useRef, useState, useEffect } from "react";
import ClassNames from "classnames";
import { useTranslation } from "react-i18next";

import { useTemplate } from "../../context/TemplateContext";
import { SUPPORTED_IMAGE_MIME_TYPES } from "../../extra/consts";

import styles from "./styles.module.scss";

export default function CharacterImageLoader({
    id,
    index,
    draggable = true,
    showBorder = true,
    registerRef,
    unregisterRef,
}) {
    const canvas = useRef();
    const fileIn = useRef();
    const componentRef = useRef();
    const { state, actions } = useTemplate();
    const { t } = useTranslation();
    
    const isSelected = state.selectedId === id;
    
    // 註冊/取消註冊 component ref
    useEffect(() => {
        if (registerRef) {
            registerRef(id, componentRef);
        }
        return () => {
            if (unregisterRef) {
                unregisterRef(id);
            }
        };
    }, [id, registerRef, unregisterRef]);

    const character = state.characters.find(char => char.id === id) || {
        id: id,
        position: { x: 0, y: 0 },
        size: { width: 400, height: 400 },
        imageDataUrl: null,
        imageRenderMode: "contain"
    };

    const [image, setImage] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const pointerStartPos = useRef({ x: 0, y: 0 });
    const resizeStartSize = useRef({ width: 0, height: 0 });

    // 當 imageDataUrl 改變時，重新載入圖片
    useEffect(() => {
        if (character.imageDataUrl) {
            const img = new Image();
            img.addEventListener("load", () => {
                setImage(img);
                drawImageIntoCanvas();
            });
            img.src = character.imageDataUrl;
        }
    }, [character.imageDataUrl]);

    function sauceChg() {
        const file = fileIn.current.files[0];
        if (!file) return;
        
        const fr = new FileReader();
        fr.addEventListener("load", () => {
            const dataUrl = fr.result;
            actions.updateCharacter(id, { imageDataUrl: dataUrl });
            
            const img = new Image();
            img.addEventListener("load", () => {
                setImage(img);
                drawImageIntoCanvas();
            });
            img.src = dataUrl;
        });
        fr.readAsDataURL(file);
    }

    function drawImageIntoCanvas() {
        if (!canvas.current || !image) return;
        const ctx = canvas.current.getContext("2d");
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
        
        const canvasWidth = canvas.current.width;
        const canvasHeight = canvas.current.height;
        const imageWidth = image.width;
        const imageHeight = image.height;
        const renderMode = character.imageRenderMode || "contain";
        
        let sx = 0, sy = 0, sWidth = imageWidth, sHeight = imageHeight;
        let dx = 0, dy = 0, dWidth = canvasWidth, dHeight = canvasHeight;
        
        switch (renderMode) {
            case "contain": {
                // 保持比例，完整顯示，可能有空白
                const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
                dWidth = imageWidth * scale;
                dHeight = imageHeight * scale;
                dx = (canvasWidth - dWidth) / 2;
                dy = (canvasHeight - dHeight) / 2;
                break;
            }
            case "cover": {
                // 保持比例，填滿整個 canvas，可能會裁切
                const scale = Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight);
                const scaledWidth = imageWidth * scale;
                const scaledHeight = imageHeight * scale;
                // 計算需要裁切嘅 source 區域
                sWidth = imageWidth;
                sHeight = imageHeight;
                sx = (imageWidth - canvasWidth / scale) / 2;
                sy = (imageHeight - canvasHeight / scale) / 2;
                sWidth = canvasWidth / scale;
                sHeight = canvasHeight / scale;
                break;
            }
            case "fill": {
                // 拉伸填滿，不保持比例
                // 直接用 canvas 大小
                break;
            }
            case "none": {
                // 原始大小，不縮放
                dWidth = imageWidth;
                dHeight = imageHeight;
                dx = (canvasWidth - dWidth) / 2;
                dy = (canvasHeight - dHeight) / 2;
                break;
            }
        }
        
        ctx.drawImage(
            image,
            sx, sy, sWidth, sHeight,  // source
            dx, dy, dWidth, dHeight   // destination
        );
    }

    // 當 size 或 render mode 改變時重新繪製
    useEffect(() => {
        if (image) {
            drawImageIntoCanvas();
        }
    }, [character.size.width, character.size.height, character.imageRenderMode, image]);

    function handlePointerDown(e) {
        // 如果撳緊 toolbar 入面嘅元素，就唔好觸發拖動或選擇
        const target = e.target;
        if (target.closest(`.${styles.ControlPanel}`)) {
            return;
        }
        
        e.preventDefault();
        
        // 點擊時 set 自己為 selected
        if (!isSelected) {
            actions.setSelectedId(id);
        }
        
        if (!draggable || isResizing) {
            return;
        }
        // 用 setPointerCapture 確保即使 cursor 離開 element 範圍都繼續追蹤
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDragging(true);
        dragStartPos.current = { ...character.position };
        pointerStartPos.current = { x: e.clientX, y: e.clientY };
    }

    function handlePointerMove(e) {
        // 如果係做緊 resize，就淨係改 size 而唔好郁成個 block
        if (isResizing) {
            const dx = e.clientX - pointerStartPos.current.x;
            const dy = e.clientY - pointerStartPos.current.y;

            const nextWidth = Math.max(50, resizeStartSize.current.width + dx);
            const nextHeight = Math.max(50, resizeStartSize.current.height + dy);

            actions.updateCharacter(id, {
                size: { width: nextWidth, height: nextHeight }
            });
            return;
        }

        if (!isDragging || !draggable) return;

        const dx = e.clientX - pointerStartPos.current.x;
        const dy = e.clientY - pointerStartPos.current.y;

        actions.updateCharacter(id, {
            position: {
                x: dragStartPos.current.x + dx,
                y: dragStartPos.current.y + dy
            }
        });
    }

    function handlePointerUp(e) {
        // 釋放 pointer capture
        if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        setIsDragging(false);
        setIsResizing(false);
        drawImageIntoCanvas();
    }

    function handleResizePointerDown(e) {
        e.preventDefault();
        e.stopPropagation();

        // 用 setPointerCapture 確保即使 cursor 離開 element 範圍都繼續追蹤
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsResizing(true);
        resizeStartSize.current = { ...character.size };
        pointerStartPos.current = { x: e.clientX, y: e.clientY };
    }

	return (
        <div
            ref={componentRef}
            className={ClassNames(
                styles.CharacterImageLoader, 
                { 
                    [styles.Draggable]: draggable,
                    [styles.Selected]: isSelected,
                    [styles.ShowBorder]: showBorder,
                }
            )}
            style={{
                transform: `translate(${character.position.x}px, ${character.position.y}px)`,
                cursor: isDragging ? "grabbing" : "grab"
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {index && (
                <div className={styles.Index}>
                    {index}
                </div>
            )}
            <canvas
                className={styles.ShapedCanvas}
                ref={canvas}
                width={character.size.width}
                height={character.size.height}
            />
            {isSelected && (
                <>
                    <div
                        className={styles.ResizeHandle}
                        onPointerDown={handleResizePointerDown}
                        onPointerUp={handlePointerUp}
                    />
                    <div className={styles.ControlPanel}>
                        <div className={ClassNames(styles.ControlRow, styles.FloatRight)}>
                            <button 
                                className={styles.DeleteButton}
                                onPointerDown={(e) => e.stopPropagation()}
                                onPointerMove={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    actions.cloneCharacter(id);
                                }}
                                title={t("clone")}
                            >
                                📋
                            </button>
                            <button 
                                className={styles.DeleteButton}
                                onPointerDown={(e) => e.stopPropagation()}
                                onPointerMove={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    console.debug("delete character", id);
                                    e.stopPropagation();
                                    actions.removeCharacter(id);
                                }}
                                title={t("delete")}
                            >
                                🗑️
                            </button>
                        </div>
                        <div className={styles.ControlRow}>
                            <input
                                type="file"
                                accept={SUPPORTED_IMAGE_MIME_TYPES.join(",")}
                                onPointerDown={(e) => e.stopPropagation()}
                                onPointerMove={(e) => e.stopPropagation()}
                                onChange={sauceChg}
                                ref={fileIn}
                            />
                            <select
                                value={character.imageRenderMode || "contain"}
                                onChange={(e) => {
                                    actions.updateCharacter(id, { imageRenderMode: e.target.value });
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                onPointerMove={(e) => e.stopPropagation()}
                                className={styles.RenderModeSelect}
                            >
                                <option value="contain">{t("render_mode_contain")}</option>
                                <option value="cover">{t("render_mode_cover")}</option>
                                <option value="fill">{t("render_mode_fill")}</option>
                                <option value="none">{t("render_mode_none")}</option>
                            </select>
                        </div>
                    </div>
                </>
            )}
        </div>
	)
}