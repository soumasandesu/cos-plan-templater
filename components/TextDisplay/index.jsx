import { useRef, useState, useEffect } from "react";
import ClassNames from "classnames";

import { useTemplate } from "../../context/TemplateContext";
import styles from "./styles.module.scss";

export default function TextDisplay({ draggable = true, showBorder = true, id, registerRef, unregisterRef }) {
    const textRef = useRef();
    const componentRef = useRef();
    const { state, actions } = useTemplate();
    
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

    const textData = state.texts.find(text => text.id === id) || {
        id: id,
        position: { x: 0, y: 0 },
        text: "輸入文字",
        fontFamily: "Arial",
        fontSize: 24,
        isBold: false,
        isItalic: false,
        isUnderline: false,
        isStrikethrough: false,
        color: "#000000",
        textAlign: "left",
        widthMode: "auto",
        width: 200,
        inputType: "single"
    };

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const pointerStartPos = useRef({ x: 0, y: 0 });
    const resizeStartWidth = useRef(0);

    // 拖動處理
    function handlePointerDown(e) {
        // 如果撳緊 input, select, button 等互動元素，就唔好觸發拖動
        const target = e.target;
        if (target.tagName === 'INPUT' || 
            target.tagName === 'SELECT' || 
            target.tagName === 'BUTTON' ||
            target.tagName === 'LABEL' ||
            target.closest('input, select, button, label')) {
            return;
        }
        
        // 如果撳緊 ControlPanel，就唔好觸發拖動或選擇
        if (target.closest(`.${styles.ControlPanel}`)) {
            return;
        }
        
        // 如果撳緊 ResizeHandle，就唔好觸發拖動
        if (target.closest(`.${styles.ResizeHandle}`)) {
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
        dragStartPos.current = { ...textData.position };
        pointerStartPos.current = { x: e.clientX, y: e.clientY };
    }

    function handlePointerMove(e) {
        // 如果係做緊 resize，就淨係改 width 而唔好郁成個 block
        if (isResizing && textData.widthMode === "fixed") {
            const dx = e.clientX - pointerStartPos.current.x;
            const nextWidth = Math.max(50, resizeStartWidth.current + dx);
            actions.updateTextDisplay(id, { width: nextWidth });
            return;
        }

        if (!isDragging || !draggable) return;

        const dx = e.clientX - pointerStartPos.current.x;
        const dy = e.clientY - pointerStartPos.current.y;

        actions.updateTextDisplay(id, {
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
    }

    function handleResizePointerDown(e) {
        e.preventDefault();
        e.stopPropagation();

        // 用 setPointerCapture 確保即使 cursor 離開 element 範圍都繼續追蹤
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsResizing(true);
        resizeStartWidth.current = textData.width || 200;
        pointerStartPos.current = { x: e.clientX, y: e.clientY };
    }

    // 常用字型列表
    const fontFamilies = [
        "Arial",
        "Helvetica",
        "Times New Roman",
        "Courier New",
        "Verdana",
        "Georgia",
        "Palatino",
        "Garamond",
        "Comic Sans MS",
        "Trebuchet MS",
        "Impact",
        "微軟正黑體",
        "新細明體",
        "標楷體"
    ];

    return (
        <div
            ref={componentRef}
            className={ClassNames(
                styles.TextDisplay, 
                { 
                    [styles.Draggable]: draggable,
                    [styles.Selected]: isSelected,
                    [styles.ShowBorder]: showBorder,
                }
            )}
            style={{
                transform: `translate(${textData.position.x}px, ${textData.position.y}px)`,
                cursor: isDragging ? "grabbing" : "grab"
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {isSelected && (
                <div 
                    className={styles.ControlPanel}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerMove={(e) => e.stopPropagation()}
                >
                    <div className={styles.ControlRow}>
                        {textData.inputType === "single" ? (
                            <input
                                type="text"
                                value={textData.text}
                                onChange={(e) => actions.updateTextDisplay(id, { text: e.target.value })}
                                onPointerDown={(e) => e.stopPropagation()}
                                onPointerMove={(e) => e.stopPropagation()}
                                className={styles.TextInput}
                            />
                        ) : (
                            <textarea
                                value={textData.text}
                                onChange={(e) => actions.updateTextDisplay(id, { text: e.target.value })}
                                onPointerDown={(e) => e.stopPropagation()}
                                onPointerMove={(e) => e.stopPropagation()}
                                className={styles.TextInput}
                                rows={3}
                            />
                        )}
                        <button
                            className={ClassNames(styles.ToggleButton, { [styles.Active]: textData.inputType === "multi" })}
                            onClick={(e) => {
                                e.stopPropagation();
                                actions.updateTextDisplay(id, { 
                                    inputType: textData.inputType === "single" ? "multi" : "single" 
                                });
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerMove={(e) => e.stopPropagation()}
                            title={textData.inputType === "single" ? "切換到多行" : "切換到單行"}
                        >
                            {textData.inputType === "single" ? "多行" : "單行"}
                        </button>
                        <button 
                            className={styles.DeleteButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                actions.removeTextDisplay(id);
                            }}
                            title="刪除"
                        >
                            🗑️
                        </button>
                    </div>
                    
                    <div className={styles.ControlRow}>
                        <select
                            value={textData.textAlign || "left"}
                            onChange={(e) => actions.updateTextDisplay(id, { textAlign: e.target.value })}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerMove={(e) => e.stopPropagation()}
                            className={styles.Select}
                        >
                            <option value="left">靠左</option>
                            <option value="center">置中</option>
                            <option value="right">靠右</option>
                        </select>
                        <select
                            value={textData.widthMode || "auto"}
                            onChange={(e) => actions.updateTextDisplay(id, { widthMode: e.target.value })}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerMove={(e) => e.stopPropagation()}
                            className={styles.Select}
                        >
                            <option value="auto">自動寬度</option>
                            <option value="fixed">固定寬度</option>
                        </select>
                    </div>
                    
                    <div className={styles.ControlRow}>
                        <select
                            value={textData.fontFamily}
                            onChange={(e) => actions.updateTextDisplay(id, { fontFamily: e.target.value })}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerMove={(e) => e.stopPropagation()}
                            className={styles.Select}
                        >
                            {fontFamilies.map(font => (
                                <option key={font} value={font}>{font}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={textData.fontSize}
                            onChange={(e) => actions.updateTextDisplay(id, { fontSize: parseInt(e.target.value) || 24 })}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerMove={(e) => e.stopPropagation()}
                            min="8"
                            max="200"
                            className={styles.NumberInput}
                        />
                        <input
                            type="color"
                            value={textData.color}
                            onChange={(e) => actions.updateTextDisplay(id, { color: e.target.value })}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerMove={(e) => e.stopPropagation()}
                            className={styles.ColorInput}
                        />
                        <button
                            className={ClassNames(styles.StyleButton, styles.Bold, { [styles.Active]: textData.isBold })}
                            onClick={(e) => {
                                e.stopPropagation();
                                actions.updateTextDisplay(id, { isBold: !textData.isBold });
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerMove={(e) => e.stopPropagation()}
                            title="粗體"
                        >
                            B
                        </button>
                        <button
                            className={ClassNames(styles.StyleButton, styles.Italic, { [styles.Active]: textData.isItalic })}
                            onClick={(e) => {
                                e.stopPropagation();
                                actions.updateTextDisplay(id, { isItalic: !textData.isItalic });
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerMove={(e) => e.stopPropagation()}
                            title="斜體"
                        >
                            I
                        </button>
                        <button
                            className={ClassNames(styles.StyleButton, styles.Underline, { [styles.Active]: textData.isUnderline })}
                            onClick={(e) => {
                                e.stopPropagation();
                                actions.updateTextDisplay(id, { isUnderline: !textData.isUnderline });
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerMove={(e) => e.stopPropagation()}
                            title="底線"
                        >
                            U
                        </button>
                        <button
                            className={ClassNames(styles.StyleButton, styles.Strikethrough, { [styles.Active]: textData.isStrikethrough })}
                            onClick={(e) => {
                                e.stopPropagation();
                                actions.updateTextDisplay(id, { isStrikethrough: !textData.isStrikethrough });
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerMove={(e) => e.stopPropagation()}
                            title="刪除線"
                        >
                            S
                        </button>
                    </div>
                </div>
            )}

            <div
                ref={textRef}
                className={styles.TextPreview}
                style={{
                    fontFamily: textData.fontFamily,
                    fontSize: `${textData.fontSize}px`,
                    fontWeight: textData.isBold ? "bold" : "normal",
                    fontStyle: textData.isItalic ? "italic" : "normal",
                    textDecoration: [
                        textData.isUnderline ? "underline" : "",
                        textData.isStrikethrough ? "line-through" : ""
                    ].filter(Boolean).join(" ") || "none",
                    color: textData.color,
                    textAlign: textData.textAlign || "left",
                    width: textData.widthMode === "fixed" ? `${textData.width || 200}px` : "auto",
                    whiteSpace: textData.inputType === "multi" ? "pre-wrap" : "nowrap"
                }}
            >
                {textData.text || "輸入文字"}
            </div>
            {isSelected && textData.widthMode === "fixed" && (
                <div
                    className={styles.ResizeHandle}
                    onPointerDown={handleResizePointerDown}
                    onPointerUp={handlePointerUp}
                />
            )}
        </div>
    );
}

