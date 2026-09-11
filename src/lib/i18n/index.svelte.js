import es from './es.json';
import ca from './ca.json';

const dictionaries = { es, ca };

// State is globally reactive
export const localeState = $state({
    lang: 'ca' // default language
});

export function initLanguage() {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('preferred_lang');
        if (saved && (saved === 'es' || saved === 'ca')) {
            localeState.lang = saved;
        }
    }
}

export function setLanguage(lang) {
    if (lang === 'es' || lang === 'ca') {
        localeState.lang = lang;
        if (typeof window !== 'undefined') {
            localStorage.setItem('preferred_lang', lang);
        }
    }
}

export function t(key, params = {}) {
    const dict = dictionaries[localeState.lang] || dictionaries['ca'];
    const keys = key.split('.');
    let value = dict;
    for (const k of keys) {
        if (value === undefined || value[k] === undefined) {
            // fallback to castellano if missing
            let fallbackValue = dictionaries['es'];
            for (const fk of keys) {
                if (fallbackValue === undefined || fallbackValue[fk] === undefined) return key;
                fallbackValue = fallbackValue[fk];
            }
            value = fallbackValue;
            break;
        }
        value = value[k];
    }
    
    if (typeof value === 'string') {
        return value.replace(/{(\w+)}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
    }
    return value;
}

if (typeof window !== 'undefined') {
    initLanguage();
}
