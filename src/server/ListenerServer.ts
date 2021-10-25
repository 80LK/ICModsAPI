import ICModsAPI from "../API.js";
import Server from "./Server.js";
import isInt from "../utils/isInt.js";

const Sort = ICModsAPI.Sort;
type Sort = ICModsAPI.Sort;

class ListenerServer extends Server {
	private sort: Sort;
	private interval: number;
	private timer: NodeJS.Timeout;
	private lastTime: number;

	constructor(interval: number = 60000, sort: Sort = Sort.UPDATED) {
		if (!isInt(interval))
			throw new TypeError("interval was been Int");

		super();
		this.interval = interval;
		this.sort = sort;
		this.check = this.check.bind(this);
	}

	private async check() {
		let checkMod = (await ICModsAPI.list(this.sort, 0, 1))[0];
		let new_timestemp = (new Date(checkMod.last_update)).getTime();
		if (this.lastTime < new_timestemp) {
			let timestemp = new_timestemp, offset = 0;
			while (timestemp > this.lastTime) {
				let mods = await ICModsAPI.list(this.sort, offset * 20, 20);

				for (let i = 0; i < 20; i++) {
					let mod = mods[i];
					timestemp = (new Date(mod.last_update)).getTime();
					if (timestemp <= this.lastTime) break;

					if (mod.version == 1)
						this.emit("mod_new", mod.id);
					else
						this.emit("mod_update", mod.id);
				}

				offset++;
			}
			this.lastTime = new_timestemp;
		}
	}

	public async listen(): Promise<void> {
		if (this.timer) return;

		this.lastTime = (new Date((await ICModsAPI.list(this.sort, 0, 1))[0].last_update)).getTime();
		this.timer = setInterval(this.check, this.interval)
	}

	public close() {
		clearInterval(this.timer);
		this.timer = null;
	}
}

export default ListenerServer;
