import express, {NextFunction, Request, Response} from "express";
import Attachment from "../attachment";
import attachmentConfig from "../config";
import authService from "../../../../services/auth-service";

export default class FsService {

	static router() {
		return express.Router()
			.use("/:id/:file", express.Router({mergeParams: true})
				.use(FsService.resolveUrl())
				.use(FsService.setCache())
				.use(FsService.serveStatic())
				.use(FsService.resolveNotFound())
				.use((req: Request, res: Response) => res.sendStatus(404))
			);
	}


	static resolveUrl() {
		return (req: Request, res: Response, next) => {
			let id = req.params["id"];
			let file = req.params["file"];
			req.url = `/${id[0]}${id[1]}/${id[2]}${id[3]}/${id[4]}${id[5]}.${file}`;
			next();
		}
	}


	static setCache() {
		return async (req: Request, res: Response, next: NextFunction) => {
			let maxAge: number = attachmentConfig.attachmentMaxAge;
			let maxAgeHeader = req.headers["x-set-max-age"];
			if (maxAgeHeader !== undefined) {
				if (Array.isArray(maxAge)) maxAgeHeader = maxAge[0];
				maxAge = parseInt(maxAgeHeader.toString());
			}
			res.setHeader("cache-control", "public, max-age=" + maxAge)
			next();
		}
	}

	static resolveNotFound() {
		return async (req: Request, res: Response, next: NextFunction) => {
			let id = req.params["id"];
			let file = req.params["file"];
			let attachment = await Attachment.pick(parseInt(id, 36));
			if (attachment !== null && file === attachment.name && attachment.isGuarded) {
				let user = authService.getAuthenticated(req).user;
				if (await attachment.guard(attachment, user)) {
					res.sendFile( attachment.fullPath)
					return;
				}
			}
			res.sendStatus(404);
		}
	}

	static serveStatic() {
		return express.static(attachmentConfig.path)
	}
}