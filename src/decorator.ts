import CollectionDescriptor from "./collection-descriptor";
import Collection, {type GuardFunction} from "./collection";
import CollectionOwner from "./collection-owner";
import {Atom} from "@affinity-lab/carbonite";
import attachmentModuleManager from "./module-manager";
import {Dimension} from "@affinity-lab/util";


export default function AttachmentCollection(
	mimeType: Array<string> | string | null = null,
	maxFileCount: number = Infinity,
	maxFileSizeKByte: number = Infinity,
	minImageSize: Dimension | null = null,
	guard: undefined|GuardFunction = undefined
) {
	return function (target: Object, propertyKey: string) {
		let descriptor = new CollectionDescriptor(
			target.constructor as typeof Atom,
			propertyKey,
			mimeType,
			maxFileCount,
			maxFileSizeKByte * 1024,
			minImageSize,
			guard
		);

		attachmentModuleManager.addCollectionDescriptor(descriptor);

		Object.defineProperty(target.constructor.prototype, propertyKey, {
			get: function () {
				let value = new Collection(new CollectionOwner(descriptor.entity, descriptor.name, this), descriptor);
				Object.defineProperty(this, propertyKey, {value});
				return value;
			},
		});
	}
}
