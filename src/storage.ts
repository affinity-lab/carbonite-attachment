import Attachment from "./attachment";
import PathStrategyBase36 from "./path-strategy-base36";
import CollectionDescriptor from "./collection-descriptor";
import * as path from "path";
import * as fs from "fs";
import attachmentConfig from "./config";
import {EventSource} from "@affinity-lab/util";

class Storage {

	readonly collections: { [p: string]: CollectionDescriptor } = {};
	public eventSource: EventSource = new EventSource();
	readonly path: string = attachmentConfig.path;
	readonly pathStrategy: PathStrategyBase36 = new PathStrategyBase36();

	async storeFile(file: string, attachment: Attachment) {
		let filePath = path.resolve(storage.path, this.pathStrategy.createPath(attachment));
		await fs.promises.mkdir(path.parse(filePath).dir, {recursive: true});
		await fs.promises.copyFile(file, filePath);
	}

	async deleteFile(attachment: Attachment) {
		let filePath = path.resolve(this.path, this.pathStrategy.createPath(attachment));
		if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
	}

	async renameFile(attachment: Attachment, name: string) {
		await fs.promises.rename(
			path.resolve(this.path, this.pathStrategy.createPath(attachment)),
			path.resolve(this.path, this.pathStrategy.createPath(attachment, name))
		);
	}

	fullPath(attachment: Attachment){
		return path.resolve(this.path, this.pathStrategy.createPath(attachment))
	}
}

const storage: Storage = new Storage();
export default storage;