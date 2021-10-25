import request from "./utils/request.js";

namespace ICModsAPI {
	const host: string = "https://icmods.mineprogramming.org/";
	function isInt(x: number): boolean {
		return parseInt(<string><any>x) == x;
	}

	export enum Lang {
		RU = "ru",
		EN = "en"
	}
	export interface IMethodParams {
		lang?: Lang,
		[key: string]: string | number | boolean | Array<string | number>
	}

	export class Error extends globalThis.Error { }

	export async function method<T>(method: string, params: IMethodParams = {}): Promise<T> {
		params = { lang: Lang.EN, ...params, horizon: true };
		let query = "";
		for (const name in params) {
			const value = ((value) => {
				if (Array.isArray(value)) {
					return value.map(e => encodeURIComponent(e)).join(",")
				} else {
					return value;
				}
			})(params[name])
			query += `${encodeURIComponent(name)}=${encodeURIComponent(value)}&`;
		}
		const response: T & { error?: string } = ((response) => {
			try {
				return JSON.parse(response);
			} catch (e) {
				return JSON.parse(response.replace(/\'/g, "\""));
			}
		})(await request(`${host}/api/${method}?${query}`))

		if (response.error)
			throw new Error(response.error);

		return response;
	}

	interface Mod {
		id: number,
		title: string,
		version: number,
		version_name: string,
		last_update: string,
		icon: string,
		likes: number,
		description: string
	}

	export interface ModShortInfo extends Mod {
		horizon_optimized: boolean,
		vip: boolean,
		pack: boolean,
		multiplayer: boolean
	}

	export enum Sort {
		POPULAR = "popular",
		NEW = "new",
		REDACTION = "redaction",
		UPDATED = "updated"
	}

	function parseModShortInfo(mod: ModShortInfo): ModShortInfo {
		mod.horizon_optimized = !!mod.horizon_optimized;
		mod.vip = !!mod.vip;
		mod.pack = !!mod.pack;
		mod.multiplayer = !!mod.multiplayer;
		return mod;
	}
	function parseModsShortInfo(mods: ModShortInfo[]): ModShortInfo[] {
		return mods.map(e => parseModShortInfo(e));
	}

	export async function list(sort: Sort = Sort.POPULAR, offset: number = 0, limit: number = 20, lang: Lang = null) {
		if (!isInt(offset))
			throw new TypeError("offset was been Int");

		if (!isInt(limit))
			throw new TypeError("limit was been Int");

		return parseModsShortInfo(await method<ModShortInfo[]>("list", {
			sort: sort,
			start: offset,
			count: limit,
			lang: lang
		}));
	};

	export async function listForIDs(ids: number[], lang: Lang = null) {
		if (ids.findIndex(i => !isInt(i)) != -1)
			throw new TypeError("ids was been Array<Int>");

		return parseModsShortInfo(await method<ModShortInfo[]>("list", {
			ids: ids,
			lang: lang
		}));
	}

	export interface ModLink {
		link: string,
		name: string
	}


	export interface ModComment {
		comment: string,
		user: string
	}

	export interface ModInfo extends ModShortInfo {
		filename: string,
		icon_full: string,
		icon_small: string;
		screenshots: NodeJS.Dict<string>,
		github?: string,
		rate: number,
		author: number,
		downloads: number,
		changelog?: string,
		deprecated: number,
		description_full: string,
		description_short: string,
		tags: string[],
		links: ModLink[],
		author_name: string,
		dependencies: number[],
		addons: number[],
		comments: ModComment[],
		enabled: boolean,
		hidden: boolean,
	}

	export async function description(id: number, lang: Lang = Lang.EN): Promise<ModInfo> {
		if (!isInt(id))
			throw new TypeError("id was been Int");

		const [mod, [advanceInfo]] = await Promise.all([method<ModInfo>("description", {
			id: id,
			lang: lang
		}), await listForIDs([id])]);

		mod.vip = !!mod.vip;
		mod.pack = !!mod.pack;
		mod.multiplayer = !!mod.multiplayer;
		mod.enabled = !!mod.enabled;
		mod.hidden = !mod.enabled;
		mod.description = mod.description_full;
		mod.icon = mod.icon_full;

		mod.description_short = advanceInfo.description;
		mod.icon_small = advanceInfo.icon;

		return mod;
	}

	//alias
	export function getModInfo(id: number, lang: Lang = Lang.EN) {
		return description(id, lang);
	};

	export async function searchModsFromAuthor(id: number, lang: Lang = null) {
		if (!isInt(id))
			throw new TypeError("id was been Int");

		return parseModsShortInfo(await method<ModShortInfo[]>("search", { author: id, lang: lang }));
	}

	export async function searchModsAtTag(tag: string, lang: Lang = null) {
		return parseModsShortInfo(await method<ModShortInfo[]>("search", { tag: tag, lang: lang }));
	}

	export async function searchMods(query: string, lang: Lang = null) {
		return parseModsShortInfo(await method<ModShortInfo[]>("search", { q: query, lang: lang }));
	}
}

export default ICModsAPI;
