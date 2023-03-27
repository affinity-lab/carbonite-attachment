import type CollectionDescriptor from "./collection-descriptor";
import Attachment from "./attachment";
import * as micromatch from "micromatch";
import type CollectionOwner from "./collection-owner";
import FileNotFoundException from "./exceptions/file-not-found-exception";
import FileSizeException from "./exceptions/file-size-exception";
import FileMimeTypeException from "./exceptions/file-mime-type-exception";
import FileCountException from "./exceptions/file-count-exception";
import MinImageSizeException from "./exceptions/min-image-size-exception";
import {FileDescriptor, Dimension} from "@affinity-lab/util";

export type GuardFunction = (attachment: Attachment, user: any) => boolean|Promise<boolean>;

export default class Collection {

	constructor(
		readonly owner: CollectionOwner,
		private descriptor: CollectionDescriptor) {
	}

	get isGuarded(): boolean {return this.descriptor.isGuarded}

	get files(): Promise<Array<Attachment>> { return Attachment.allForOwner(this.owner);}
	get count(): Promise<number> { return Attachment.countOfOwner(this.owner);}
	get first(): Promise<Attachment | null> { return Attachment.firstOfOwner(this.owner);}

	async find(fileName: string): Promise<Attachment[]> { return Attachment.findOfOwner(this.owner, fileName);}
	async get(id: number): Promise<Attachment | null> { return Attachment.pickOfOwner(this.owner, id);}

	async purge() { (await this.files).forEach(file => file.delete(false));}
	async reorder() { await Attachment.reorder(this.owner);}

	async replace(fileName: string): Promise<Attachment> {return this.add(fileName, true);}

	async add(fileName: string, replaceOne: boolean = false): Promise<Attachment> {
		let file = new FileDescriptor(fileName);

		let mimeType = this.descriptor.mimeType;
		let maxFileSize = this.descriptor.maxFileSize;
		let maxFileCount = this.descriptor.maxFileCount;
		let minImageSize = this.descriptor.minImageSize;

		if (!await file.exists) throw new FileNotFoundException(fileName);
		if (maxFileSize !== Infinity && await file.size > maxFileSize) throw new FileSizeException(maxFileSize)
		if (mimeType !== null && !micromatch.isMatch(file.mimeType.toString(), mimeType)) throw new FileMimeTypeException(mimeType);
		if (minImageSize !== null && file.isImage && !Dimension.make((await file.image).meta).contains(minImageSize)) throw new MinImageSizeException(minImageSize);
		if (maxFileCount !== Infinity && maxFileCount <= await this.count) {
			if (replaceOne) await (await this.first)?.delete();
			else throw new FileCountException(maxFileCount)
		}

		return Attachment.factory(file, this.owner);
	}

}