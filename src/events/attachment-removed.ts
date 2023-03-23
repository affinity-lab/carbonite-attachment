import {EventSource} from "@affinity-lab/util";

export default class AttachmentRemoved extends EventSource.Event{
	constructor(readonly id:number) {
		super();
	}

}