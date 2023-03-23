export default class FileCountException extends Error {
	constructor(readonly max: number) {
		super(`file count exceeded the allowed (${max})`);
	}
}