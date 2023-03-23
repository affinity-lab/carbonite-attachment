import {Dimension} from "@affinity-lab/util";

export default class Image {
	readonly size: Dimension;
	constructor(
		width: number,
		height: number,
		public readonly dominant: { r: number; g: number; b: number },
		public readonly isAnimated: boolean,
		public focus: "centre" | "top" | "left" | "bottom" | "right" | "entropy" | "attention" = "attention"
	) {
		this.size = new Dimension(width, height);
	}
}
