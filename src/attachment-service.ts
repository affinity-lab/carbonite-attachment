import path from "path";
import fs from "fs";
import {EventSource} from "@affinity-lab/util";
import type CollectionDescriptor from "./collection-descriptor";

type AttachmentLike = { id: number, isGuarded: boolean, name: string };

export default class AttachmentService {

	static #instance: AttachmentService | undefined;

	private constructor(
		public readonly table: string,
		public readonly path: string
	) {
	}

	static get instance(): AttachmentService {return this.#instance;}

	static initialize(
		path: string,
		table: string = "attachments"
	): AttachmentService {
		if (this.#instance !== undefined) throw new Error("AttachmentService already initialized");
		this.#instance = new AttachmentService(table, path);
		return this.#instance;
	}

	readonly collections: { [p: string]: CollectionDescriptor } = {};
	public eventSource: EventSource = new EventSource();

	async storeFile(file: string, attachment: AttachmentLike) {
		let filePath = path.resolve(this.path, this.createPath(attachment));
		await fs.promises.mkdir(path.parse(filePath).dir, {recursive: true});
		await fs.promises.copyFile(file, filePath);
	}

	async deleteFile(attachment: AttachmentLike) {
		let filePath = path.resolve(this.path, this.createPath(attachment));
		if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
	}

	async renameFile(attachment: AttachmentLike, name: string) {
		await fs.promises.rename(
			path.resolve(this.path, this.createPath(attachment)),
			path.resolve(this.path, this.createPath(attachment, name))
		);
	}

	fullPath(attachment: AttachmentLike) { return path.resolve(this.path, this.createPath(attachment))}

	createPath(attachment: AttachmentLike, name: string | null = null): string {
		let b36 = attachment.id.toString(36).padStart(6, "0");
		return `${b36[0]}${b36[1]}/${b36[2]}${b36[3]}/${b36[4]}${b36[5]}${attachment.isGuarded ? '@' : '.'}${name ?? attachment.name}`;
	}

}