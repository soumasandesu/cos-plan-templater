import { createContext, useContext, useReducer, useCallback } from "react";

// 初始 state
const initialState = {
    // 背景設定
    background: {
        imageSrc: null, // dataUrl/base64
        size: { width: 1280, height: 720 }, // 背景顯示 size
        imageOrder: "bottom" // top, bottom
    },
    
    // CharacterImageLoader 列表
    characters: [],
    
    // TextDisplay 列表
    texts: [],
    
    // 選中狀態（null 或 component id）
    selectedId: null,
};

// Action types
const ActionTypes = {
    // Background
    SET_BACKGROUND_IMAGE: "SET_BACKGROUND_IMAGE",
    SET_BACKGROUND_SIZE: "SET_BACKGROUND_SIZE",
    SET_BACKGROUND_IMAGE_ORDER: "SET_BACKGROUND_IMAGE_ORDER",
    
    // Characters
    ADD_CHARACTER: "ADD_CHARACTER",
    REMOVE_CHARACTER: "REMOVE_CHARACTER",
    UPDATE_CHARACTER: "UPDATE_CHARACTER",
    CLONE_CHARACTER: "CLONE_CHARACTER",
    
    // Texts
    ADD_TEXT_DISPLAY: "ADD_TEXT_DISPLAY",
    REMOVE_TEXT_DISPLAY: "REMOVE_TEXT_DISPLAY",
    UPDATE_TEXT_DISPLAY: "UPDATE_TEXT_DISPLAY",
    CLONE_TEXT_DISPLAY: "CLONE_TEXT_DISPLAY",
    
    // Selection
    SET_SELECTED_ID: "SET_SELECTED_ID",
    
    // 批量更新
    LOAD_TEMPLATE: "LOAD_TEMPLATE",
    RESET_TEMPLATE: "RESET_TEMPLATE"
};

// Reducer
function templateReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_BACKGROUND_IMAGE:
            return {
                ...state,
                background: {
                    ...state.background,
                    imageSrc: action.payload
                }
            };
            
        case ActionTypes.SET_BACKGROUND_SIZE:
            return {
                ...state,
                background: {
                    ...state.background,
                    size: action.payload
                }
            };
            
        case ActionTypes.SET_BACKGROUND_IMAGE_ORDER:
            return {
                ...state,
                background: {
                    ...state.background,
                    imageOrder: action.payload
                }
            };
            
        case ActionTypes.ADD_CHARACTER:
            return {
                ...state,
                characters: [...state.characters, {
                    id: Math.random().toString(36).substr(2, 9),
                    position: { x: 0, y: 0 },
                    size: { width: 400, height: 400 },
                    imageDataUrl: null,
                    imageRenderMode: "contain" // contain, cover, fill, none
                }],
            };
            
        case ActionTypes.UPDATE_CHARACTER:
            const { id: charId, data } = action.payload;
            return {
                ...state,
                characters: state.characters.map((char) =>
                    char.id === charId ? { ...char, ...data } : char
                )
            };
            
        case ActionTypes.REMOVE_CHARACTER:
            const removeCharId = action.payload;
            return {
                ...state,
                characters: state.characters.filter((char) => char.id !== removeCharId),
                // 如果刪除嘅係 selected，就清除 selected
                selectedId: state.selectedId === removeCharId ? null : state.selectedId
            };
            
        case ActionTypes.CLONE_CHARACTER:
            const cloneCharId = action.payload;
            const charToClone = state.characters.find((char) => char.id === cloneCharId);
            if (!charToClone) {
                return state;
            }
            const clonedChar = {
                ...charToClone,
                id: Math.random().toString(36).substr(2, 9),
                position: {
                    x: charToClone.position.x + 10,
                    y: charToClone.position.y + 10
                }
            };
            return {
                ...state,
                characters: [...state.characters, clonedChar],
                selectedId: clonedChar.id // 自動選中新 clone 出嚟嘅 component
            };
            
        case ActionTypes.ADD_TEXT_DISPLAY:
            return {
                ...state,
                texts: [...state.texts, {
                    id: Math.random().toString(36).substr(2, 9),
                    position: { x: 0, y: 0 },
                    text: "輸入文字",
                    fontFamily: "Arial",
                    fontSize: 24,
                    isBold: false,    
                    isItalic: false,
                    isUnderline: false,
                    isStrikethrough: false,
                    color: "#000000",
                    textAlign: "left", // left, center, right
                    widthMode: "auto", // auto, fixed
                    width: 200, // 固定寬度時使用
                    inputType: "single" // single, multi
                }],
            };
            
        case ActionTypes.UPDATE_TEXT_DISPLAY:
            const { id: textId, data: textData } = action.payload;
            return {
                ...state,
                texts: state.texts.map((text) =>
                    text.id === textId ? { ...text, ...textData } : text
                )
            };
            
        case ActionTypes.REMOVE_TEXT_DISPLAY:
            const removeTextId = action.payload;
            return {
                ...state,
                texts: state.texts.filter((text) => text.id !== removeTextId),
                // 如果刪除嘅係 selected，就清除 selected
                selectedId: state.selectedId === removeTextId ? null : state.selectedId
            };
            
        case ActionTypes.CLONE_TEXT_DISPLAY:
            const cloneTextId = action.payload;
            const textToClone = state.texts.find((text) => text.id === cloneTextId);
            if (!textToClone) {
                return state;
            }
            const clonedText = {
                ...textToClone,
                id: Math.random().toString(36).substr(2, 9),
                position: {
                    x: textToClone.position.x + 10,
                    y: textToClone.position.y + 10
                }
            };
            return {
                ...state,
                texts: [...state.texts, clonedText],
                selectedId: clonedText.id // 自動選中新 clone 出嚟嘅 component
            };
            
        case ActionTypes.SET_SELECTED_ID:
            return {
                ...state,
                selectedId: action.payload
            };
            
        case ActionTypes.LOAD_TEMPLATE:
            // 確保載入的 template 有完整的結構
            return {
                background: action.payload.background || initialState.background,
                characters: action.payload.characters || [],
                texts: action.payload.texts || [],
                selectedId: null // 載入時清除 selected
            };
            
        case ActionTypes.RESET_TEMPLATE:
            return initialState;
            
        default:
            return state;
    }
}

// Context
const TemplateContext = createContext(null);

// Provider
export function TemplateProvider({ children }) {
    const [state, dispatch] = useReducer(templateReducer, initialState);
    
    // Actions
    const actions = {
        // Background
        setBackgroundImage: useCallback((imageSrc) => {
            dispatch({ type: ActionTypes.SET_BACKGROUND_IMAGE, payload: imageSrc });
        }, []),
        
        setBackgroundSize: useCallback((size) => {
            dispatch({ type: ActionTypes.SET_BACKGROUND_SIZE, payload: size });
        }, []),

        setBackgroundImageOrder: useCallback((imageOrder) => {
            dispatch({ type: ActionTypes.SET_BACKGROUND_IMAGE_ORDER, payload: imageOrder });
        }, []),
        
        // Characters
        addCharacter: useCallback(() => {
            dispatch({ type: ActionTypes.ADD_CHARACTER });
        }, []),
        
        updateCharacter: useCallback((id, data) => {
            dispatch({ type: ActionTypes.UPDATE_CHARACTER, payload: { id, data } });
        }, []),
        
        removeCharacter: useCallback((id) => {
            dispatch({ type: ActionTypes.REMOVE_CHARACTER, payload: id });
        }, []),
        
        cloneCharacter: useCallback((id) => {
            dispatch({ type: ActionTypes.CLONE_CHARACTER, payload: id });
        }, []),
        
        // Texts
        addTextDisplay: useCallback(() => {
            dispatch({ type: ActionTypes.ADD_TEXT_DISPLAY });
        }, []),
        
        updateTextDisplay: useCallback((id, data) => {
            dispatch({ type: ActionTypes.UPDATE_TEXT_DISPLAY, payload: { id, data } });
        }, []),
        
        removeTextDisplay: useCallback((id) => {
            dispatch({ type: ActionTypes.REMOVE_TEXT_DISPLAY, payload: id });
        }, []),
        
        cloneTextDisplay: useCallback((id) => {
            dispatch({ type: ActionTypes.CLONE_TEXT_DISPLAY, payload: id });
        }, []),
        
        // Selection
        setSelectedId: useCallback((id) => {
            dispatch({ type: ActionTypes.SET_SELECTED_ID, payload: id });
        }, []),
        
        // Template management
        loadTemplate: useCallback((template) => {
            dispatch({ type: ActionTypes.LOAD_TEMPLATE, payload: template });
        }, []),
        
        resetTemplate: useCallback(() => {
            dispatch({ type: ActionTypes.RESET_TEMPLATE });
        }, [])
    };
    
    return (
        <TemplateContext.Provider value={{ state, actions }}>
            {children}
        </TemplateContext.Provider>
    );
}

// Hook
export function useTemplate() {
    const context = useContext(TemplateContext);
    if (!context) {
        throw new Error("useTemplate must be used within TemplateProvider");
    }
    return context;
}

