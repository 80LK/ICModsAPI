import EventEmitter from "events";

interface Server {
	on(eventName: "test", listener: () => void): void;
	on(eventName: "mod_add" | "mod_update" | "screenshot_delete" | "screenshot_edit" | "screenshot_add" | "mod_edit" | "icon_update", listener: (mod_id: number) => void): void;
	on(eventName: "comment_add", listener: (mod_id: number, user_id: number, comment: string) => void): void;
	on(eventName: "user_register", listener: (user_id: number) => void): void;
	on(eventName: string | symbol, listener: (...args: any[]) => void): this;


	once(eventName: "test", listener: () => void): this;
	once(eventName: "mod_add" | "mod_update" | "screenshot_delete" | "screenshot_edit" | "screenshot_add" | "mod_edit" | "icon_update", listener: (mod_id: number) => void): this;
	once(eventName: "comment_add", listener: (mod_id: number, user_id: number, comment: string) => void): this;
	once(eventName: "user_register", listener: (user_id: number) => void): this;
	once(eventName: string | symbol, listener: (...args: any[]) => void): this;

	emit(eventName: "test"): boolean;
	emit(eventName: "mod_add" | "mod_update" | "screenshot_delete" | "screenshot_edit" | "screenshot_add" | "mod_edit" | "icon_update", mod_id: number): boolean;
	emit(eventName: "comment_add", mod_id: number, user_id: number, comment: string): boolean;
	emit(eventName: "user_register", user_id: number): boolean;
	emit(eventName: string | symbol, ...args: any[]): boolean;
}

abstract class Server extends EventEmitter {
	public abstract listen(): Promise<void> | void;
	public abstract close(): Promise<void> | void;
}

export default Server;
