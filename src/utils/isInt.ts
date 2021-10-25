function isInt(x: number): boolean {
	return parseInt(<string><any>x) == x;
}
export default isInt;
