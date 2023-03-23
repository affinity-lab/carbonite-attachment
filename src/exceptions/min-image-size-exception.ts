import {Dimension} from "@affinity-lab/util";

export default class MinImageSizeException extends Error {
	constructor(readonly min: Dimension) {
		super(`image file dimensions are smaller than the reguired (${min.width} x ${min.height})`);
	}
}