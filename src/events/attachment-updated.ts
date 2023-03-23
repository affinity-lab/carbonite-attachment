import {EventSource} from "@affinity-lab/util";

export default class AttachmentUpdated extends EventSource.Event{
	constructor(readonly id:number) {
		super();
	}

}