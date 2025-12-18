export const locales = {
	hk: {
		_lang: "繁體中文",
		character_count: "角色數量",
		output: "輸出",
		_out_filename: "output"
	},
	en: {
		_lang: "English",
		character_count: "Character Count",
		output: "Output",
		_out_filename: "output"
	},
	cn: {
		_lang: "简体中文",
		character_count: "角色数量",
		output: "输出",
		_out_filename: "output"
	}
};

export function getLocale(lang, key) {
	const locale = locales[lang] || locales.hk;
	return locale[key] || key;
}

