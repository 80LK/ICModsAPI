import { RequestOptions, request as requestHttp } from "http";
import { request as requestHttps } from "https";
import { URL } from "url";


type Link = string | URL;
enum Method {
	GET = "get",
	POST = "post"
}
interface RequestParams {
	url: Link;
	method?: Method;
}


function request(url: Link);
function request(url: Link) {
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
		const _request = req(url);
		_request.on("response", response => {
			response.setEncoding("utf-8");

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
