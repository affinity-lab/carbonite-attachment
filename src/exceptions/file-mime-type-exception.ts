export default class FileMimeTypeException extends Error {
	constructor(readonly mimeType: string|Array<string>) {
		super(`file mimetype does not match ${mimeType}`);
	}
}