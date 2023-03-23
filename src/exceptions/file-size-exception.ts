export default class FileSizeException extends Error {
	constructor(readonly max: number) {
		super(`file size is more than the allowed (${max})`);
	}
}