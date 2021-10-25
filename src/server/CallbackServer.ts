import { IncomingMessage, Server as HttpServer, ServerResponse } from "http";
import { Server as HttpsServer, ServerOptions as HttpsServerOptions } from "https";
import Server from "./Server.js";

type WebServer = HttpServer | HttpsServer;
type ServerOptions = HttpsServerOptions & {
	server?: WebServer;
	port?: number;
	/**
	 * Default "/hooks"
	 */
	path?: string;
};

class _CallbackServer extends Server {
	//@ts-ignore
	private app: Express;
	private port: number;

	constructor(port: number = 80) {
		super();
		this.port = port;
		//@ts-ignore
		this.app = express();//@ts-ignore
		this.app.use(express.json());
		this.app.all("/hooks", (req, res) => {
			if (!req.body || !req.body.type)
				return res.sendStatus(400);

			let args: any[] = [];
			if (req.body.mod_id) args.push(req.body.mod_id);
			if (req.body.user_id) args.push(req.body.user_id);
			if (req.body.comment) args.push(req.body.comment);

			this.emit(req.body.type, ...args);

			res.sendStatus(200);
		});
	}

	public listen() {
		this.app.listen(this.port);
	}
	public close(): void { }
}

class CallbackServer extends Server {
	private _server: WebServer;
	private readonly _options: ServerOptions;


	public constructor(options: ServerOptions = {}) {
		super();

		this._options = {
			port: options.cert ? 443 : 80,
			path: "/hooks",
			...options
		}

		if (this._options.path[0] != "/")
			this._options.path = "/" + this._options.path;

		if (this._options.server) {
			this._server = this._options.server;
		} else {
			if (this._options.cert)
				this._server = new HttpsServer(this._options);
			else
				this._server = new HttpServer(this._options);
		}

		this.request = this.request.bind(this);
	}

	private request(req: IncomingMessage, res: ServerResponse) {
		const url = new URL(req.url, `${this._server instanceof HttpsServer ? "https" : "http"}://${req.headers.host}`);

		if (url.pathname != this._options.path) {
			if (!this._options.server) {
				res.statusCode = 404;
				res.end();
			}

			return;
		}

		let body = "";
		req.on("data", chunk => body += chunk);
		req.on("end", () => {
			const response: {
				type: string,
				mod_id?: number;
				user_id?: number;
				comment?: string
			} = JSON.parse(body);

			let args: any[] = [];
			if (response.mod_id) args.push(response.mod_id);
			if (response.user_id) args.push(response.user_id);
			if (response.comment) args.push(response.comment);

			this.emit(response.type, ...args);
		});

		res.statusCode = 200;
		res.end();
	}

	public listen() {
		this._server.prependListener("request", this.request);
		if (!this._server.listening)
			this._server.listen(this._options.port);
	}

	public close() {
		this._server.off("request", this.request);
		if (this._server.listening)
			this._server.close();
	}
}

export default CallbackServer;
