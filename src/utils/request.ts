import { RequestOptions, request as requestHttp } from "http";
import { request as requestHttps } from "https";
import { URL } from "url";


type Link = string | URL;
enum Method {
	GET = "get",
	POST = "post"
}

function request(url: Link, encoding: BufferEncoding = "utf-8") {
	if (typeof url == "string")
		url = new URL(url);

	const req = ((protocol) => {
		switch (protocol) {
			case "http:": return requestHttp;
			case "https:": return requestHttps;
			default: throw new Error("Unsupport protocol");
		}
	})(url.protocol);

	return new Promise<string>((r, e) => {
		//@ts-ignore
		const _request = req(url, { rejectUnauthorized: false });
		_request.on("response", response => {
			if (response.statusCode > 299 || response.statusCode < 200)
				return e(response);

			if (encoding)
				response.setEncoding(encoding);

			const buffers = [];

			response.on("data", (chunk) => {
				buffers.push(chunk);
			});
			response.on('end', () => {
				r(buffers.join(""));
			});
			response.on('error', e);
		});
		_request.end();
	});
};

export default request;
export { Method };
