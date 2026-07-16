const SEQUENCE_BACKGROUND_KEYS = ["imageSrc", "type", "google_drive_file_id", "imageOrder"];
const SEQUENCE_CHARACTER_KEYS = ["id", "position", "size", "imageDataUrl", "imageRenderMode", "borderRadius"];
const SEQUENCE_TEXT_KEYS = ["id", "position", "text", "fontFamily", "fontSize", "isBold", "isItalic", "isUnderline", "isStrikethrough", "color", "textAlign", "widthMode", "width", "inputType"];

const GS = '\x1D';
const RS = '\x1E';
const US = '\x1F';

const _serializeByKeysList = (keys) => (o) => keys.map(k => o[k]).map(e => JSON.stringify(e)).join(US);
const _deserializeByKeysList = (keys) => (t) => {
    const a = t.split(US).map(e => JSON.parse(e));
    const ret = {};
    keys.forEach((k, i) => ret[k] = a[i]);
    return ret;
}

const serializeBackground = _serializeByKeysList(SEQUENCE_BACKGROUND_KEYS);
const deserializeBackground = _deserializeByKeysList(SEQUENCE_BACKGROUND_KEYS);

const serializeCharacters = (a) => a.map(_serializeByKeysList(SEQUENCE_CHARACTER_KEYS)).join(RS);
const deserializeCharacters = (a) => (a.indexOf(RS) > -1 ? a.split(RS) : [a]).map(_deserializeByKeysList(SEQUENCE_CHARACTER_KEYS));

const serializeTexts = (a) => a.map(_serializeByKeysList(SEQUENCE_TEXT_KEYS)).join(RS);
const deserializeTexts = (a) => (a.indexOf(RS) > -1 ? a.split(RS) : [a]).map(_deserializeByKeysList(SEQUENCE_TEXT_KEYS));

export function serialize(state) {
    const data = {
        background: {
            imageSrc: state.background.imageSrc,
            type: state.background.type,
            google_drive_file_id: state.background.google_drive_file_id,
            imageOrder: state.background.imageOrder,
        },
        characters: state.characters.map(char => ({
            id: char.id,
            position: char.position,
            size: char.size,
            imageDataUrl: char.imageDataUrl,
            imageRenderMode: char.imageRenderMode || "contain",
            borderRadius: char.borderRadius || 0
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

    return [serializeBackground(data.background), serializeCharacters(data.characters), serializeTexts(data.texts)].join(GS);
}

export function deserialize(payload) {
    const [
        _background,
        _characters,
        _texts,
    ] = payload.split(GS);
    return {
        background: deserializeBackground(_background),
        characters: deserializeCharacters(_characters),
        texts: deserializeTexts(_texts),
    };
}